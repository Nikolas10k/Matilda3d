// Critérios de aceite da Fase 1 (docs/07) e regras de docs/06, testados num
// Postgres em memória com as migrações reais.
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import {
  como,
  comoSuperusuario,
  criarBanco,
  criarUsuario,
  criarUsuarioSemPerfil,
} from "./banco";

let db: PGlite;
let admin: string;
let membro: string;
let outroMembro: string;
let semPerfil: string;
let membroInativo: string;

beforeAll(async () => {
  db = await criarBanco({ comSeed: true });
  admin = await criarUsuario(db, { nome: "Karem", papel: "admin" });
  membro = await criarUsuario(db, { nome: "Maria Clara" });
  outroMembro = await criarUsuario(db, { nome: "Tharik" });
  membroInativo = await criarUsuario(db, { nome: "Antigo", ativo: false });
  semPerfil = await criarUsuarioSemPerfil(db);
}, 60_000);

beforeEach(async () => {
  await comoSuperusuario(db);
});

async function valor<T>(sql: string, params: unknown[] = []): Promise<T> {
  const { rows } = await db.query<Record<string, T>>(sql, params);
  return Object.values(rows[0])[0];
}

async function saldo(): Promise<number> {
  await comoSuperusuario(db);
  return valor<number>("select saldo_centavos from vw_saldo_caixa");
}

async function registrarVenda(
  usuario: string,
  { pago = 0, forma = "pix", desconto = 0, frete = 0, encomenda = null as string | null } = {},
): Promise<string> {
  await como(db, "authenticated", usuario);
  const itens = JSON.stringify([
    { produto_id: null, descricao: "Chaveiro com nome", cor: "Rosa", quantidade: 2, preco_unitario_centavos: 1500 },
    { produto_id: null, descricao: "Topo de bolo", quantidade: 1, preco_unitario_centavos: 4000 },
  ]);
  const id = await valor<string>(
    `select registrar_venda(current_date, null, 'whatsapp', $1::jsonb, $2, $3, $4, $5, $6)`,
    [itens, desconto, frete, pago, pago > 0 ? forma : null, encomenda],
  );
  await comoSuperusuario(db);
  return id;
}

describe("migrações", () => {
  it("aplicam em banco limpo, com dados iniciais e seed", async () => {
    expect(await valor<number>("select count(*)::int from categorias")).toBe(5);
    expect(await valor<number>("select count(*)::int from produtos")).toBe(6);
    expect(await valor<string>("select nome from marca where id = 1")).toBe("Matilda3D");
    expect(await valor<string>("select texto_sobre from marca")).toContain("Maria Clara e Tharik");
    expect(await valor<number>("select count(*)::int from configuracoes")).toBe(1);
    expect(await valor<number>("select count(*)::int from storage.buckets")).toBe(4);
  });

  it("RLS está ativo em todas as tabelas do schema public", async () => {
    const { rows } = await db.query<{ relname: string }>(
      `select relname from pg_class
       where relnamespace = 'public'::regnamespace and relkind = 'r' and not relrowsecurity`,
    );
    expect(rows).toEqual([]);
  });

  it("criar usuário no auth cria perfil como membro", async () => {
    const papel = await valor<string>("select papel from perfis where id = $1", [membro]);
    const nome = await valor<string>("select nome from perfis where id = $1", [membro]);
    expect(papel).toBe("membro");
    expect(nome).toBe("Maria Clara");
  });
});

describe("registrar_venda", () => {
  it("com pagamento cria venda, itens, pagamento e lançamento", async () => {
    const saldoAntes = await saldo();
    const venda = await registrarVenda(membro, { pago: 7000, desconto: 500, frete: 1000 });

    const { rows } = await db.query<Record<string, number | string>>(
      `select subtotal_centavos, total_centavos, pago_centavos, status_pagamento, criado_por
       from vendas where id = $1`,
      [venda],
    );
    expect(rows[0]).toEqual({
      subtotal_centavos: 7000, // 2 × 15,00 + 40,00
      total_centavos: 7500, // − 5,00 de desconto + 10,00 de frete
      pago_centavos: 7000,
      status_pagamento: "parcial",
      criado_por: membro,
    });
    expect(await valor<number>("select count(*)::int from venda_itens where venda_id = $1", [venda])).toBe(2);
    expect(await valor<number>("select count(*)::int from venda_pagamentos where venda_id = $1", [venda])).toBe(1);

    const lanc = await db.query<Record<string, unknown>>(
      "select tipo, categoria, valor_centavos, forma_pagamento from lancamentos where venda_id = $1",
      [venda],
    );
    expect(lanc.rows).toEqual([
      { tipo: "entrada", categoria: "Venda", valor_centavos: 7000, forma_pagamento: "pix" },
    ]);
    expect(await saldo()).toBe(saldoAntes + 7000);
  });

  it("venda parcial + pagamento do restante fica 'pago' com duas entradas no caixa", async () => {
    const venda = await registrarVenda(membro, { pago: 3000 });
    await como(db, "authenticated", outroMembro);
    await db.query("select registrar_pagamento($1, 4000, 'dinheiro')", [venda]);
    await comoSuperusuario(db);

    expect(await valor<string>("select status_pagamento from vendas where id = $1", [venda])).toBe("pago");
    expect(
      await valor<number>(
        "select count(*)::int from lancamentos where venda_id = $1 and tipo = 'entrada'",
        [venda],
      ),
    ).toBe(2);
  });

  it("sem pagamento fica 'pendente' e não mexe no caixa", async () => {
    const saldoAntes = await saldo();
    const venda = await registrarVenda(membro);
    expect(await valor<string>("select status_pagamento from vendas where id = $1", [venda])).toBe("pendente");
    expect(await saldo()).toBe(saldoAntes);
  });

  it("copia o custo do produto para o item", async () => {
    await db.query("update produtos set custo_centavos = 420 where slug = 'chaveiro-com-nome'");
    const produto = await valor<string>("select id from produtos where slug = 'chaveiro-com-nome'");
    await como(db, "authenticated", membro);
    const venda = await valor<string>(
      `select registrar_venda(current_date, null, 'presencial', $1::jsonb)`,
      [JSON.stringify([{ produto_id: produto, descricao: "Chaveiro", quantidade: 1, preco_unitario_centavos: 1500 }])],
    );
    await comoSuperusuario(db);
    await db.query("update produtos set custo_centavos = 999 where id = $1", [produto]);
    expect(
      await valor<number>("select custo_unitario_centavos from venda_itens where venda_id = $1", [venda]),
    ).toBe(420);
  });

  it("recusa pagamento maior que o valor em aberto", async () => {
    const venda = await registrarVenda(membro, { pago: 7000 });
    await como(db, "authenticated", membro);
    await expect(db.query("select registrar_pagamento($1, 1, 'pix')", [venda])).rejects.toThrow(
      "Pagamento maior que o valor em aberto",
    );
  });

  it("recusa venda sem itens, com desconto maior que o total e pagamento sem forma", async () => {
    await como(db, "authenticated", membro);
    await expect(
      db.query("select registrar_venda(current_date, null, 'whatsapp', '[]'::jsonb)"),
    ).rejects.toThrow("Inclua pelo menos um item");
    const item = JSON.stringify([{ descricao: "Peça", quantidade: 1, preco_unitario_centavos: 1000 }]);
    await expect(
      db.query("select registrar_venda(current_date, null, 'whatsapp', $1::jsonb, 2000)", [item]),
    ).rejects.toThrow("Desconto maior que o valor da venda");
    await expect(
      db.query("select registrar_venda(current_date, null, 'whatsapp', $1::jsonb, 0, 0, 500, null)", [item]),
    ).rejects.toThrow("Informe a forma de pagamento");
  });

  it("só a equipe ativa registra venda", async () => {
    const item = JSON.stringify([{ descricao: "Peça", quantidade: 1, preco_unitario_centavos: 1000 }]);
    for (const usuario of [semPerfil, membroInativo]) {
      await como(db, "authenticated", usuario);
      await expect(
        db.query("select registrar_venda(current_date, null, 'whatsapp', $1::jsonb)", [item]),
      ).rejects.toThrow("Acesso negado");
    }
    await como(db, "anon");
    await expect(
      db.query("select registrar_venda(current_date, null, 'whatsapp', $1::jsonb)", [item]),
    ).rejects.toThrow(/permission denied/);
  });
});

describe("cancelar_venda", () => {
  it("gera estorno e o saldo volta ao valor anterior", async () => {
    const saldoAntes = await saldo();
    const venda = await registrarVenda(membro, { pago: 3000 });
    await como(db, "authenticated", membro);
    await db.query("select registrar_pagamento($1, 2000, 'credito')", [venda]);
    expect(await saldo()).toBe(saldoAntes + 5000);

    await como(db, "authenticated", membro);
    await db.query("select cancelar_venda($1, 'Cliente desistiu')", [venda]);
    await comoSuperusuario(db);

    expect(await saldo()).toBe(saldoAntes);
    const estornos = await db.query<Record<string, unknown>>(
      `select valor_centavos, forma_pagamento from lancamentos
       where venda_id = $1 and categoria = 'Estorno de venda' and tipo = 'saida' order by valor_centavos`,
      [venda],
    );
    expect(estornos.rows).toEqual([
      { valor_centavos: 2000, forma_pagamento: "credito" },
      { valor_centavos: 3000, forma_pagamento: "pix" },
    ]);
    const { rows } = await db.query<Record<string, unknown>>(
      "select cancelada, motivo_cancelamento from vendas where id = $1",
      [venda],
    );
    expect(rows[0]).toEqual({ cancelada: true, motivo_cancelamento: "Cliente desistiu" });
  });

  it("exige motivo, não cancela duas vezes e bloqueia pagamento depois", async () => {
    const venda = await registrarVenda(membro);
    await como(db, "authenticated", membro);
    await expect(db.query("select cancelar_venda($1, '  ')", [venda])).rejects.toThrow(
      "Informe o motivo do cancelamento",
    );
    await db.query("select cancelar_venda($1, 'Erro de digitação')", [venda]);
    await expect(db.query("select cancelar_venda($1, 'De novo')", [venda])).rejects.toThrow(
      "Venda não encontrada ou já cancelada",
    );
    await expect(db.query("select registrar_pagamento($1, 100, 'pix')", [venda])).rejects.toThrow(
      "Venda cancelada não recebe pagamento",
    );
  });

  it("venda cancelada sai dos indicadores de vendas", async () => {
    const venda = await registrarVenda(membro);
    await como(db, "authenticated", membro);
    await db.query("select cancelar_venda($1, 'Teste')", [venda]);
    await comoSuperusuario(db);
    expect(await valor<number>("select count(*)::int from vw_a_receber where id = $1", [venda])).toBe(0);
  });
});

describe("visitante (anon)", () => {
  it.each(["vendas", "venda_itens", "venda_pagamentos", "lancamentos", "clientes", "encomendas",
    "perfis", "configuracoes", "cliques_whatsapp", "encomenda_historico"])(
    "não lê %s",
    async (tabela) => {
      await registrarVenda(membro, { pago: 1000 });
      await como(db, "anon");
      const { rows } = await db.query(`select * from ${tabela}`);
      expect(rows).toEqual([]);
    },
  );

  it("não acessa as views do painel", async () => {
    await como(db, "anon");
    await expect(db.query("select * from vw_saldo_caixa")).rejects.toThrow(/permission denied/);
    await expect(db.query("select * from vw_resumo_mensal")).rejects.toThrow(/permission denied/);
  });

  it("lê marca, categorias e só produtos ativos", async () => {
    await db.query("update produtos set ativo = false where slug = 'vaso-geometrico'");
    await como(db, "anon");
    expect(await valor<number>("select count(*)::int from produtos")).toBe(5);
    expect(await valor<number>("select count(*)::int from produtos where slug = 'vaso-geometrico'")).toBe(0);
    expect(await valor<number>("select count(*)::int from categorias")).toBe(5);
    expect(await valor<string>("select nome from marca")).toBe("Matilda3D");

    await como(db, "authenticated", membro);
    expect(await valor<number>("select count(*)::int from produtos")).toBe(6);
    await comoSuperusuario(db);
    await db.query("update produtos set ativo = true where slug = 'vaso-geometrico'");
  });

  it("não grava em nenhuma tabela", async () => {
    await como(db, "anon");
    await expect(
      db.query("insert into encomendas (nome_contato, whatsapp, tipo, descricao, consentimento_contato) values ('X', '5561999999999', 'Outro', 'Y', true)"),
    ).rejects.toThrow(/row-level security/);
    await expect(
      db.query("insert into cliques_whatsapp (origem) values ('card')"),
    ).rejects.toThrow(/row-level security/);
    await expect(db.query("select consumir_limite_envio('x')")).rejects.toThrow(/permission denied/);
  });
});

describe("proteções contra alteração direta", () => {
  it("equipe só altera observações e cliente da venda", async () => {
    const venda = await registrarVenda(membro, { pago: 1000 });
    await como(db, "authenticated", membro);
    await db.query("update vendas set observacoes = 'Entregar sábado' where id = $1", [venda]);
    await expect(
      db.query("update vendas set total_centavos = 1 where id = $1", [venda]),
    ).rejects.toThrow("Só é possível alterar observações e cliente");
    await expect(
      db.query("update vendas set cancelada = true where id = $1", [venda]),
    ).rejects.toThrow("Só é possível alterar observações e cliente");
    await expect(db.query("delete from vendas where id = $1", [venda])).resolves.toMatchObject({
      affectedRows: 0,
    });
  });

  it("lançamentos de venda não podem ser editados nem apagados, nem por admin", async () => {
    const venda = await registrarVenda(membro, { pago: 1000 });
    await como(db, "authenticated", admin);
    const upd = await db.query("update lancamentos set valor_centavos = 1 where venda_id = $1", [venda]);
    const del = await db.query("delete from lancamentos where venda_id = $1", [venda]);
    expect(upd.affectedRows).toBe(0);
    expect(del.affectedRows).toBe(0);
    await expect(
      db.query(
        "insert into lancamentos (tipo, categoria, descricao, valor_centavos, venda_id, criado_por) values ('entrada', 'Venda', 'Falsa', 100, $1, $2)",
        [venda, admin],
      ),
    ).rejects.toThrow(/row-level security/);
  });
});

describe("caixa: despesas manuais", () => {
  async function lancarDespesa(usuario: string): Promise<string> {
    await como(db, "authenticated", usuario);
    const id = await valor<string>(
      `insert into lancamentos (tipo, categoria, descricao, valor_centavos, forma_pagamento, criado_por)
       values ('saida', 'Filamento', 'PLA 1kg', 12000, 'pix', $1) returning id`,
      [usuario],
    );
    await comoSuperusuario(db);
    return id;
  }

  it("membro edita a própria despesa, mas não a de outro", async () => {
    const minha = await lancarDespesa(membro);
    const deOutro = await lancarDespesa(outroMembro);
    await como(db, "authenticated", membro);
    expect((await db.query("update lancamentos set valor_centavos = 11000 where id = $1", [minha])).affectedRows).toBe(1);
    expect((await db.query("update lancamentos set valor_centavos = 1 where id = $1", [deOutro])).affectedRows).toBe(0);
  });

  it("membro não edita a própria despesa depois de 24 horas; admin edita", async () => {
    const id = await lancarDespesa(membro);
    await db.query("update lancamentos set criado_em = now() - interval '25 hours' where id = $1", [id]);
    await como(db, "authenticated", membro);
    expect((await db.query("update lancamentos set valor_centavos = 1 where id = $1", [id])).affectedRows).toBe(0);
    await como(db, "authenticated", admin);
    expect((await db.query("update lancamentos set valor_centavos = 13000 where id = $1", [id])).affectedRows).toBe(1);
  });

  it("membro não renova a janela de 24 horas nem muda o autor", async () => {
    const id = await lancarDespesa(membro);
    await como(db, "authenticated", membro);
    await expect(
      db.query("update lancamentos set criado_em = now() + interval '1 year' where id = $1", [id]),
    ).rejects.toThrow("Não é possível alterar o autor");
  });

  it("membro não lança em nome de outro e só admin exclui", async () => {
    await como(db, "authenticated", membro);
    await expect(
      db.query(
        "insert into lancamentos (tipo, categoria, descricao, valor_centavos, criado_por) values ('saida', 'Outros', 'X', 100, $1)",
        [outroMembro],
      ),
    ).rejects.toThrow(/row-level security/);
    const id = await lancarDespesa(membro);
    await como(db, "authenticated", membro);
    expect((await db.query("delete from lancamentos where id = $1", [id])).affectedRows).toBe(0);
    await como(db, "authenticated", admin);
    expect((await db.query("delete from lancamentos where id = $1", [id])).affectedRows).toBe(1);
  });
});

describe("encomendas", () => {
  async function criarEncomenda(): Promise<string> {
    await como(db, "service_role");
    const id = await valor<string>(
      `insert into encomendas (nome_contato, whatsapp, tipo, descricao, consentimento_contato)
       values ('Ana', '5561999999999', 'Topo de bolo', 'Topo com nome Ana, 7 anos', true) returning id`,
    );
    await comoSuperusuario(db);
    return id;
  }

  it("encomenda do site entra como 'nova' e mudanças de status vão para o histórico", async () => {
    const enc = await criarEncomenda();
    expect(await valor<string>("select status from encomendas where id = $1", [enc])).toBe("nova");

    await como(db, "authenticated", membro);
    await db.query("update encomendas set status = 'em_conversa' where id = $1", [enc]);
    await db.query("update encomendas set notas_internas = 'Ligar à tarde' where id = $1", [enc]);
    await comoSuperusuario(db);

    const { rows } = await db.query<Record<string, unknown>>(
      "select status_anterior, status_novo, usuario_id from encomenda_historico where encomenda_id = $1 order by criado_em, status_novo desc",
      [enc],
    );
    expect(rows).toEqual([
      { status_anterior: null, status_novo: "nova", usuario_id: null },
      { status_anterior: "nova", status_novo: "em_conversa", usuario_id: membro },
    ]);
  });

  it("transformar em venda vincula as duas; não vincula duas vendas ativas", async () => {
    const enc = await criarEncomenda();
    const venda = await registrarVenda(membro, { encomenda: enc });
    expect(await valor<string>("select venda_id from encomendas where id = $1", [enc])).toBe(venda);
    expect(await valor<string>("select encomenda_id from vendas where id = $1", [venda])).toBe(enc);

    await expect(registrarVenda(membro, { encomenda: enc })).rejects.toThrow(
      "Esta encomenda já está vinculada a outra venda",
    );

    // "Cancelar e duplicar": depois de cancelar, a encomenda aceita a nova venda.
    await como(db, "authenticated", membro);
    await db.query("select cancelar_venda($1, 'Corrigir itens')", [venda]);
    const nova = await registrarVenda(membro, { encomenda: enc });
    expect(await valor<string>("select venda_id from encomendas where id = $1", [enc])).toBe(nova);
  });

  it("equipe não altera o vínculo com a venda diretamente", async () => {
    const enc = await criarEncomenda();
    const venda = await registrarVenda(membro);
    await como(db, "authenticated", membro);
    await expect(
      db.query("update encomendas set venda_id = $1 where id = $2", [venda, enc]),
    ).rejects.toThrow("O vínculo da encomenda com a venda");
  });
});

describe("permissões de admin", () => {
  it("só admin altera configurações e perfis", async () => {
    await como(db, "authenticated", membro);
    expect((await db.query("update configuracoes set saldo_inicial_centavos = 1")).affectedRows).toBe(0);
    expect((await db.query("update perfis set papel = 'admin' where id = $1", [membro])).affectedRows).toBe(0);

    await como(db, "authenticated", admin);
    expect((await db.query("update configuracoes set margem_padrao_pct = 120")).affectedRows).toBe(1);
    expect((await db.query("update perfis set nome = 'Tharik' where id = $1", [outroMembro])).affectedRows).toBe(1);
  });

  it("admin não remove o próprio acesso", async () => {
    await como(db, "authenticated", admin);
    await expect(db.query("update perfis set papel = 'membro' where id = $1", [admin])).rejects.toThrow(
      "Você não pode alterar o próprio papel",
    );
  });

  it("só admin exclui produto", async () => {
    await como(db, "authenticated", membro);
    expect((await db.query("delete from produtos where slug = 'topo-de-bolo'")).affectedRows).toBe(0);
  });
});

describe("limite de envios do formulário", () => {
  it("aceita 3 envios por chave em 10 minutos e recusa o 4º", async () => {
    await como(db, "service_role");
    const resultados: boolean[] = [];
    for (let i = 0; i < 4; i++) {
      resultados.push(await valor<boolean>("select consumir_limite_envio('hash-do-ip')"));
    }
    expect(resultados).toEqual([true, true, true, false]);
    expect(await valor<boolean>("select consumir_limite_envio('outro-ip')")).toBe(true);
  });
});
