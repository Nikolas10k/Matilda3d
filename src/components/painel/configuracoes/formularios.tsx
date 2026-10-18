"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Check, ImagePlus, KeyRound, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { InputMoeda } from "@/components/formulario/input-moeda";
import { CampoRotulado, classeSelect } from "@/components/painel/elementos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { converterParaWebp } from "@/lib/imagem";
import { BUCKET_MARCA, urlPublica } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import {
  alterarUsuario,
  criarCategoria,
  criarUsuario,
  definirSenhaUsuario,
  excluirCategoria,
  moverCategoria,
  renomearCategoria,
  salvarConfigCaixa,
  salvarMarca,
  salvarPadroesCalculadora,
  type ResultadoConfig,
} from "@/server/actions/configuracoes";
import type { UsuarioDaEquipe } from "@/server/configuracoes";

/** Estado comum: valores, erros por campo, envio com toast. */
function useFormulario<T extends Record<string, string>>(
  inicial: T,
  acao: (v: T) => Promise<ResultadoConfig>,
  sucesso: string,
  limparAoSalvar = false,
) {
  const router = useRouter();
  const [valores, setValores] = useState(inicial);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, iniciar] = useTransition();

  const mudar = (campo: keyof T) => (texto: string) => setValores((v) => ({ ...v, [campo]: texto }));
  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    iniciar(async () => {
      const r = await acao(valores);
      if (!r.ok) {
        setErros(r.campos ?? {});
        toast.error(r.erro);
        return;
      }
      setErros({});
      if (limparAoSalvar) setValores(inicial);
      toast.success(sucesso);
      router.refresh();
    });
  };
  return { valores, setValores, mudar, erros, salvando, enviar };
}

export function FormularioMarca({
  inicial,
}: {
  inicial: { nome: string; whatsapp: string; instagram: string; textoSobre: string; fotoCriadores: string };
}) {
  const f = useFormulario(inicial, salvarMarca, "Dados da marca salvos!");
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  async function enviarFoto(arquivo: File | undefined) {
    if (!arquivo) return;
    setEnviandoFoto(true);
    try {
      const webp = await converterParaWebp(arquivo);
      const caminho = `criadores/${crypto.randomUUID()}.webp`;
      const { error } = await createClient()
        .storage.from(BUCKET_MARCA)
        .upload(caminho, webp, { contentType: "image/webp", cacheControl: "31536000" });
      if (error) throw error;
      f.mudar("fotoCriadores")(caminho);
      toast.info("Foto enviada. Clique em Salvar para usar no site.");
    } catch {
      toast.error("Não foi possível enviar a foto.");
    } finally {
      setEnviandoFoto(false);
    }
  }

  return (
    <form onSubmit={f.enviar} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <CampoRotulado id="marca-nome" rotulo="Nome da marca" erro={f.erros.nome}>
          <Input id="marca-nome" value={f.valores.nome} onChange={(e) => f.mudar("nome")(e.target.value)} />
        </CampoRotulado>
        <CampoRotulado id="marca-whatsapp" rotulo="WhatsApp" erro={f.erros.whatsapp} dica="Aparece no site para contato.">
          <Input id="marca-whatsapp" inputMode="tel" placeholder="(00) 00000-0000" value={f.valores.whatsapp} onChange={(e) => f.mudar("whatsapp")(e.target.value)} />
        </CampoRotulado>
        <CampoRotulado id="marca-instagram" rotulo="Instagram" erro={f.erros.instagram}>
          <Input id="marca-instagram" placeholder="@matildaimpressao3d" autoCapitalize="none" value={f.valores.instagram} onChange={(e) => f.mudar("instagram")(e.target.value)} />
        </CampoRotulado>
      </div>
      <CampoRotulado id="marca-sobre" rotulo='Texto "Sobre nós"' erro={f.erros.textoSobre} dica="Aparece na página inicial e em /sobre. Use só o primeiro nome dos criadores.">
        <Textarea id="marca-sobre" rows={4} value={f.valores.textoSobre} onChange={(e) => f.mudar("textoSobre")(e.target.value)} />
      </CampoRotulado>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-bold">Foto dos criadores</span>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex aspect-[4/3] w-40 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface">
            {f.valores.fotoCriadores ? (
              <Image src={urlPublica(BUCKET_MARCA, f.valores.fotoCriadores)} alt="Foto dos criadores" fill sizes="160px" className="object-cover" />
            ) : (
              <span className="text-xs text-ink-muted">Sem foto</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-input bg-white px-4 text-sm font-bold hover:border-ink focus-within:ring-3 focus-within:ring-ring/50">
              <ImagePlus className="size-4" aria-hidden="true" />
              {enviandoFoto ? "Enviando…" : f.valores.fotoCriadores ? "Trocar foto" : "Enviar foto"}
              <input type="file" accept="image/*" className="sr-only" disabled={enviandoFoto} onChange={(e) => enviarFoto(e.target.files?.[0])} />
            </label>
            {f.valores.fotoCriadores && (
              <button type="button" onClick={() => f.mudar("fotoCriadores")("")} className="min-h-11 text-left text-sm font-medium text-danger">
                Remover foto
              </button>
            )}
          </div>
        </div>
      </div>
      <Button type="submit" disabled={f.salvando || enviandoFoto} className="self-start">
        {f.salvando ? "Salvando…" : "Salvar dados da marca"}
      </Button>
    </form>
  );
}

export function FormularioCaixa({ inicial }: { inicial: { saldoInicial: string; dataInicio: string } }) {
  const f = useFormulario(inicial, salvarConfigCaixa, "Configuração do caixa salva!");
  return (
    <form onSubmit={f.enviar} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoRotulado id="cx-saldo" rotulo="Saldo inicial" erro={f.erros.saldoInicial} dica="Quanto dinheiro o negócio tinha no dia em que começaram a usar o painel.">
          <InputMoeda id="cx-saldo" value={f.valores.saldoInicial} onValueChange={f.mudar("saldoInicial")} />
        </CampoRotulado>
        <CampoRotulado id="cx-data" rotulo="Data de início do caixa" erro={f.erros.dataInicio} dica="Lançamentos antes desta data não entram no saldo.">
          <Input id="cx-data" type="date" value={f.valores.dataInicio} onChange={(e) => f.mudar("dataInicio")(e.target.value)} />
        </CampoRotulado>
      </div>
      <Button type="submit" disabled={f.salvando} className="self-start">
        {f.salvando ? "Salvando…" : "Salvar caixa"}
      </Button>
    </form>
  );
}

export function FormularioCalculadora({
  inicial,
}: {
  inicial: { precoKg: string; energiaHora: string; desgasteHora: string; embalagem: string; taxaFalhas: string; margem: string };
}) {
  const f = useFormulario(inicial, salvarPadroesCalculadora, "Padrões da calculadora salvos!");
  const dinheiro: [keyof typeof inicial, string][] = [
    ["precoKg", "Quilo do filamento"],
    ["energiaHora", "Energia por hora de impressão"],
    ["desgasteHora", "Desgaste da impressora por hora"],
    ["embalagem", "Embalagem por peça"],
  ];
  return (
    <form onSubmit={f.enviar} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {dinheiro.map(([campo, rotulo]) => (
          <CampoRotulado key={campo} id={`calc-${campo}`} rotulo={rotulo} erro={f.erros[campo]}>
            <InputMoeda id={`calc-${campo}`} value={f.valores[campo]} onValueChange={f.mudar(campo)} />
          </CampoRotulado>
        ))}
        <CampoRotulado id="calc-falhas" rotulo="Taxa de falhas (%)" erro={f.erros.taxaFalhas} dica="Quantas impressões costumam dar errado.">
          <Input id="calc-falhas" inputMode="decimal" value={f.valores.taxaFalhas} onChange={(e) => f.mudar("taxaFalhas")(e.target.value)} />
        </CampoRotulado>
        <CampoRotulado id="calc-margem" rotulo="Margem desejada (%)" erro={f.erros.margem} dica="100% = o preço é o dobro do custo.">
          <Input id="calc-margem" inputMode="decimal" value={f.valores.margem} onChange={(e) => f.mudar("margem")(e.target.value)} />
        </CampoRotulado>
      </div>
      <Button type="submit" disabled={f.salvando} className="self-start">
        {f.salvando ? "Salvando…" : "Salvar padrões"}
      </Button>
    </form>
  );
}

export function GerenciarCategorias({ categorias }: { categorias: { id: string; nome: string; produtos: number }[] }) {
  const router = useRouter();
  const [ocupado, iniciar] = useTransition();
  const [nova, setNova] = useState("");
  const [editando, setEditando] = useState<{ id: string; nome: string } | null>(null);

  const executar = (acao: () => Promise<ResultadoConfig>, sucesso?: string, depois?: () => void) =>
    iniciar(async () => {
      const r = await acao();
      if (!r.ok) {
        toast.error(r.erro);
        return;
      }
      if (sucesso) toast.success(sucesso);
      depois?.();
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
        {categorias.map((c, i) => (
          <li key={c.id} className="flex items-center gap-2 px-3 py-2">
            {editando?.id === c.id ? (
              <form
                className="flex flex-1 items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  executar(() => renomearCategoria(c.id, editando.nome), "Categoria renomeada!", () => setEditando(null));
                }}
              >
                <label htmlFor={`cat-${c.id}`} className="sr-only">
                  Novo nome
                </label>
                <Input id={`cat-${c.id}`} value={editando.nome} onChange={(e) => setEditando({ id: c.id, nome: e.target.value })} autoFocus />
                <button type="submit" aria-label="Salvar nome" disabled={ocupado} className="flex size-11 items-center justify-center rounded-lg text-success hover:bg-success/10">
                  <Check className="size-4" aria-hidden="true" />
                </button>
                <button type="button" aria-label="Cancelar" onClick={() => setEditando(null)} className="flex size-11 items-center justify-center rounded-lg hover:bg-surface">
                  <X className="size-4" aria-hidden="true" />
                </button>
              </form>
            ) : (
              <>
                <span className="flex-1">
                  <span className="font-bold">{c.nome}</span>
                  <span className="ml-2 text-sm text-ink-muted">
                    {c.produtos} {c.produtos === 1 ? "produto" : "produtos"}
                  </span>
                </span>
                <button type="button" aria-label={`Subir ${c.nome}`} disabled={i === 0 || ocupado} onClick={() => executar(() => moverCategoria(c.id, "subir"))} className="flex size-11 items-center justify-center rounded-lg text-ink-muted hover:bg-surface disabled:opacity-30">
                  <ArrowUp className="size-4" aria-hidden="true" />
                </button>
                <button type="button" aria-label={`Descer ${c.nome}`} disabled={i === categorias.length - 1 || ocupado} onClick={() => executar(() => moverCategoria(c.id, "descer"))} className="flex size-11 items-center justify-center rounded-lg text-ink-muted hover:bg-surface disabled:opacity-30">
                  <ArrowDown className="size-4" aria-hidden="true" />
                </button>
                <button type="button" aria-label={`Renomear ${c.nome}`} onClick={() => setEditando({ id: c.id, nome: c.nome })} className="flex size-11 items-center justify-center rounded-lg text-ink-muted hover:bg-surface">
                  <Pencil className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Excluir ${c.nome}`}
                  disabled={ocupado}
                  onClick={() => {
                    const aviso = c.produtos ? ` Os ${c.produtos} produtos dela ficam sem categoria.` : "";
                    if (window.confirm(`Excluir a categoria "${c.nome}"?${aviso}`)) executar(() => excluirCategoria(c.id), "Categoria excluída.");
                  }}
                  className="flex size-11 items-center justify-center rounded-lg text-danger hover:bg-danger/5"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          executar(() => criarCategoria(nova), "Categoria criada!", () => setNova(""));
        }}
      >
        <label htmlFor="nova-categoria" className="sr-only">
          Nova categoria
        </label>
        <Input id="nova-categoria" value={nova} onChange={(e) => setNova(e.target.value)} placeholder="Nova categoria, ex.: Luminárias" />
        <Button type="submit" variant="outline" disabled={!nova.trim() || ocupado}>
          Criar
        </Button>
      </form>
    </div>
  );
}

/** Troca de senha feita pelo admin (abre embaixo do usuário). */
function TrocarSenha({ usuario, aoFechar }: { usuario: UsuarioDaEquipe; aoFechar: () => void }) {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string>();
  const [salvando, iniciar] = useTransition();

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    iniciar(async () => {
      const r = await definirSenhaUsuario(usuario.id, senha);
      if (!r.ok) {
        setErro(r.campos?.senha ?? r.erro);
        return;
      }
      toast.success(`Senha de ${usuario.nome} trocada. Passe a nova senha para a pessoa.`);
      aoFechar();
    });
  };

  return (
    <form onSubmit={salvar} noValidate className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <CampoRotulado id={`senha-${usuario.id}`} rotulo={`Nova senha de ${usuario.nome}`} erro={erro}>
        <Input
          id={`senha-${usuario.id}`}
          type="text"
          autoComplete="new-password"
          autoCapitalize="none"
          spellCheck={false}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Pelo menos 8 caracteres"
        />
      </CampoRotulado>
      <div className="flex gap-2">
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar senha"}
        </Button>
        <Button type="button" variant="ghost" onClick={aoFechar}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export function GerenciarUsuarios({ usuarios, meuId }: { usuarios: UsuarioDaEquipe[]; meuId: string }) {
  const router = useRouter();
  const [ocupado, iniciar] = useTransition();
  const [trocandoSenha, setTrocandoSenha] = useState<string | null>(null);
  const f = useFormulario(
    { nome: "", usuario: "", senha: "", papel: "membro" },
    criarUsuario,
    "Usuário criado! Passe o usuário e a senha para a pessoa entrar no painel.",
    true,
  );

  const alterar = (id: string, mudancas: Parameters<typeof alterarUsuario>[1]) =>
    iniciar(async () => {
      const r = await alterarUsuario(id, mudancas);
      if (!r.ok) {
        toast.error(r.erro);
        return;
      }
      toast.success("Usuário atualizado.");
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-5">
      <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
        {usuarios.map((u) => (
          <li key={u.id} className="flex flex-col gap-3 px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {u.nome}
                  {u.id === meuId && <span className="ml-2 text-sm font-normal text-ink-muted">(você)</span>}
                </p>
                <p className="truncate text-sm text-ink-muted">{u.login ? `Usuário: ${u.login}` : "usuário indisponível"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-11"
                  aria-expanded={trocandoSenha === u.id}
                  onClick={() => setTrocandoSenha(trocandoSenha === u.id ? null : u.id)}
                >
                  <KeyRound className="size-4" aria-hidden="true" />
                  Trocar senha
                </Button>
                <label className="sr-only" htmlFor={`papel-${u.id}`}>
                  Papel de {u.nome}
                </label>
                <select
                  id={`papel-${u.id}`}
                  value={u.papel}
                  disabled={u.id === meuId || ocupado}
                  onChange={(e) => alterar(u.id, { papel: e.target.value as "admin" | "membro" })}
                  className={`${classeSelect} w-auto`}
                >
                  <option value="membro">Membro</option>
                  <option value="admin">Admin</option>
                </select>
                <label htmlFor={`ativo-${u.id}`} className="flex min-h-11 items-center gap-2 text-sm font-bold">
                  <Switch id={`ativo-${u.id}`} checked={u.ativo} disabled={u.id === meuId || ocupado} onCheckedChange={(ativo) => alterar(u.id, { ativo })} />
                  {u.ativo ? "Ativo" : "Desativado"}
                </label>
              </div>
            </div>
            {trocandoSenha === u.id && <TrocarSenha usuario={u} aoFechar={() => setTrocandoSenha(null)} />}
          </li>
        ))}
      </ul>

      <form onSubmit={f.enviar} noValidate className="flex flex-col gap-3 rounded-xl bg-surface p-4">
        <p className="font-bold">Novo usuário</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <CampoRotulado id="novo-nome" rotulo="Nome" erro={f.erros.nome}>
            <Input id="novo-nome" value={f.valores.nome} onChange={(e) => f.mudar("nome")(e.target.value)} placeholder="Ex.: Maria Clara" />
          </CampoRotulado>
          <CampoRotulado id="novo-usuario" rotulo="Usuário (para entrar)" erro={f.erros.usuario}>
            <Input
              id="novo-usuario"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              value={f.valores.usuario}
              onChange={(e) => f.mudar("usuario")(e.target.value)}
              placeholder="Ex.: mariaclara"
            />
          </CampoRotulado>
          <CampoRotulado id="novo-senha" rotulo="Senha" erro={f.erros.senha}>
            <Input
              id="novo-senha"
              type="text"
              autoComplete="new-password"
              autoCapitalize="none"
              spellCheck={false}
              value={f.valores.senha}
              onChange={(e) => f.mudar("senha")(e.target.value)}
              placeholder="Pelo menos 8 caracteres"
            />
          </CampoRotulado>
          <CampoRotulado id="novo-papel" rotulo="Papel">
            <select id="novo-papel" value={f.valores.papel} onChange={(e) => f.mudar("papel")(e.target.value)} className={classeSelect}>
              <option value="membro">Membro</option>
              <option value="admin">Admin</option>
            </select>
          </CampoRotulado>
        </div>
        <p className="text-sm text-ink-muted">
          A pessoa entra no painel com esse usuário e essa senha, sem precisar de e-mail. Membro registra vendas, despesas e
          produtos. Admin também mexe nas configurações, cria usuários, exclui e vê tudo.
        </p>
        <Button type="submit" disabled={f.salvando} className="self-start">
          {f.salvando ? "Criando…" : "Criar usuário"}
        </Button>
      </form>
    </div>
  );
}
