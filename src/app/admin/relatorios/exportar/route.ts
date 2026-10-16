import type { NextRequest } from "next/server";
import { dataCsv, dinheiroCsv, gerarCsv } from "@/lib/csv";
import { periodoDosParametros } from "@/lib/periodo";
import { createClient } from "@/lib/supabase/server";
import { rotuloCanal, rotuloForma, ROTULO_STATUS, type StatusPagamento } from "@/lib/venda";
import { obterSessao } from "@/server/auth";

// Exportação CSV (docs/04, seção 8): /admin/relatorios/exportar?tipo=vendas|itens|caixa&de=AAAA-MM-DD&ate=AAAA-MM-DD
// Permitida para admin e membro (docs/06). Os dados respeitam o RLS de quem baixa.
export async function GET(request: NextRequest) {
  const sessao = await obterSessao();
  if (!sessao?.perfil) return new Response("Acesso não liberado.", { status: 401 });

  const params = request.nextUrl.searchParams;
  const tipo = params.get("tipo");
  const periodo = periodoDosParametros({
    periodo: params.get("periodo") ?? undefined,
    de: params.get("de") ?? undefined,
    ate: params.get("ate") ?? undefined,
  });
  const supabase = await createClient();

  let csv: string;
  if (tipo === "vendas") {
    const { data, error } = await supabase
      .from("vendas")
      .select("numero, data_venda, canal, subtotal_centavos, desconto_centavos, frete_centavos, total_centavos, pago_centavos, status_pagamento, cancelada, motivo_cancelamento, observacoes, clientes(nome), venda_itens(descricao, quantidade)")
      .gte("data_venda", periodo.de)
      .lte("data_venda", periodo.ate)
      .order("numero");
    if (error) return new Response("Erro ao gerar o arquivo.", { status: 500 });
    csv = gerarCsv(
      ["Número", "Data", "Cliente", "Canal", "Itens", "Subtotal", "Desconto", "Frete", "Total", "Pago", "Em aberto", "Status", "Cancelada", "Motivo do cancelamento", "Observações"],
      (data ?? []).map((v) => [
        v.numero,
        dataCsv(v.data_venda),
        v.clientes?.nome ?? "Venda avulsa",
        rotuloCanal(v.canal),
        v.venda_itens.map((i) => `${i.quantidade}x ${i.descricao}`).join(", "),
        dinheiroCsv(v.subtotal_centavos),
        dinheiroCsv(v.desconto_centavos),
        dinheiroCsv(v.frete_centavos),
        dinheiroCsv(v.total_centavos),
        dinheiroCsv(v.pago_centavos),
        dinheiroCsv(v.cancelada ? 0 : v.total_centavos - v.pago_centavos),
        v.cancelada ? "Cancelada" : ROTULO_STATUS[v.status_pagamento as StatusPagamento],
        v.cancelada,
        v.motivo_cancelamento,
        v.observacoes,
      ]),
    );
  } else if (tipo === "itens") {
    const { data, error } = await supabase
      .from("venda_itens")
      .select("descricao, cor, quantidade, preco_unitario_centavos, total_centavos, custo_unitario_centavos, produtos(nome), vendas!inner(numero, data_venda, cancelada)")
      .gte("vendas.data_venda", periodo.de)
      .lte("vendas.data_venda", periodo.ate);
    if (error) return new Response("Erro ao gerar o arquivo.", { status: 500 });
    const linhas = [...(data ?? [])].sort((a, b) => a.vendas.numero - b.vendas.numero);
    csv = gerarCsv(
      ["Venda", "Data", "Produto", "Descrição", "Cor", "Quantidade", "Preço unitário", "Total", "Custo unitário", "Lucro estimado", "Venda cancelada"],
      linhas.map((i) => {
        const total = i.total_centavos ?? i.quantidade * i.preco_unitario_centavos;
        return [
          i.vendas.numero,
          dataCsv(i.vendas.data_venda),
          i.produtos?.nome ?? "Item livre",
          i.descricao,
          i.cor,
          i.quantidade,
          dinheiroCsv(i.preco_unitario_centavos),
          dinheiroCsv(total),
          dinheiroCsv(i.custo_unitario_centavos),
          i.custo_unitario_centavos == null ? "" : dinheiroCsv(total - i.custo_unitario_centavos * i.quantidade),
          i.vendas.cancelada,
        ];
      }),
    );
  } else if (tipo === "caixa") {
    const { data, error } = await supabase
      .from("lancamentos")
      .select("data, tipo, categoria, descricao, valor_centavos, forma_pagamento, vendas(numero), perfis(nome)")
      .gte("data", periodo.de)
      .lte("data", periodo.ate)
      .order("data")
      .order("criado_em");
    if (error) return new Response("Erro ao gerar o arquivo.", { status: 500 });
    csv = gerarCsv(
      ["Data", "Tipo", "Categoria", "Descrição", "Entrada", "Saída", "Forma de pagamento", "Venda", "Lançado por"],
      (data ?? []).map((l) => [
        dataCsv(l.data),
        l.tipo === "entrada" ? "Entrada" : "Saída",
        l.categoria,
        l.descricao,
        l.tipo === "entrada" ? dinheiroCsv(l.valor_centavos) : "",
        l.tipo === "saida" ? dinheiroCsv(l.valor_centavos) : "",
        l.forma_pagamento ? rotuloForma(l.forma_pagamento) : "",
        l.vendas?.numero ?? "",
        l.perfis?.nome ?? "",
      ]),
    );
  } else {
    return new Response("Tipo de exportação inválido.", { status: 400 });
  }

  const nome = `matilda3d-${tipo}-${periodo.de}-a-${periodo.ate}.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nome}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
