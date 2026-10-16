"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calculator, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Calculadora, type ResultadoParaProduto } from "@/components/painel/calculadora";
import { CampoCores } from "@/components/painel/produtos/campo-cores";
import { FotosProduto } from "@/components/painel/produtos/fotos-produto";
import { InputMoeda } from "@/components/formulario/input-moeda";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { centavosParaTexto, formatarPercentual, paraCentavos } from "@/lib/format";
import { margemProduto } from "@/lib/calculadora";
import { gerarSlug } from "@/lib/slug";
import { cn } from "@/lib/utils";
import { esquemaProduto, type DadosProduto, type ValoresFormularioProduto } from "@/lib/validacao/produto";
import { excluirProduto, salvarProduto } from "@/server/actions/produtos";
import type { PadroesCalculadora } from "@/server/produtos";

type Props = {
  novo: boolean;
  valoresIniciais: ValoresFormularioProduto;
  categorias: { id: string; nome: string }[];
  padroes: PadroesCalculadora;
  podeExcluir: boolean;
};

export function FormularioProduto({ novo, valoresIniciais, categorias, padroes, podeExcluir }: Props) {
  const router = useRouter();
  const [salvando, iniciarSalvar] = useTransition();
  const [excluindo, iniciarExcluir] = useTransition();
  const [calculadoraAberta, setCalculadoraAberta] = useState(false);
  const [slugEditado, setSlugEditado] = useState(!novo);

  const form = useForm<ValoresFormularioProduto, unknown, DadosProduto>({
    resolver: zodResolver(esquemaProduto),
    defaultValues: valoresIniciais,
    mode: "onTouched",
  });
  const { register, control, setValue, setError, formState } = form;
  const erros = formState.errors;

  const [preco, custo, descricaoCurta, slug, gramas, horas, minutos] = useWatch({
    control,
    name: ["preco", "custo", "descricaoCurta", "slug", "gramas", "horas", "minutos"],
  });
  const margem = margemProduto(paraCentavos(preco), paraCentavos(custo));

  const nomeRegistrado = register("nome", {
    onChange: (e) => {
      if (!slugEditado) setValue("slug", gerarSlug(e.target.value), { shouldValidate: formState.isSubmitted });
    },
  });

  const enviar = form.handleSubmit(() => {
    iniciarSalvar(async () => {
      const resultado = await salvarProduto(form.getValues());
      if (!resultado.ok) {
        for (const [campo, mensagem] of Object.entries(resultado.campos ?? {})) {
          setError(campo as keyof ValoresFormularioProduto, { message: mensagem });
        }
        toast.error(resultado.erro);
        return;
      }
      toast.success(novo ? "Produto cadastrado!" : "Produto salvo!");
      router.push("/admin/produtos");
      router.refresh();
    });
  });

  function excluir() {
    if (!window.confirm("Excluir este produto? As fotos também serão apagadas. Se ele só saiu de linha, prefira desativar.")) {
      return;
    }
    iniciarExcluir(async () => {
      const resultado = await excluirProduto(valoresIniciais.id);
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success("Produto excluído.");
      router.push("/admin/produtos");
      router.refresh();
    });
  }

  function usarCalculadora(r: ResultadoParaProduto) {
    setValue("custo", centavosParaTexto(r.custoTotalCentavos), { shouldDirty: true, shouldValidate: true });
    setValue("preco", centavosParaTexto(r.precoSugeridoCentavos), { shouldDirty: true, shouldValidate: true });
    if (r.gramas) setValue("gramas", String(r.gramas).replace(".", ","), { shouldDirty: true });
    if (r.minutos) {
      setValue("horas", String(Math.floor(r.minutos / 60)), { shouldDirty: true });
      setValue("minutos", String(r.minutos % 60), { shouldDirty: true });
    }
    setCalculadoraAberta(false);
    toast.success("Custo e preço preenchidos pela calculadora.");
  }

  const gramasAtual = Number((gramas ?? "").replace(",", ".")) || null;
  const minutosAtual = (Number(horas) || 0) * 60 + (Number(minutos) || 0) || null;

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-6 pb-24 md:pb-20">
      <Secao titulo="Informações">
        <CampoTexto id="nome" rotulo="Nome do produto" erro={erros.nome?.message}>
          <Input id="nome" autoComplete="off" aria-invalid={!!erros.nome} {...nomeRegistrado} />
        </CampoTexto>

        <CampoTexto
          id="slug"
          rotulo="Endereço na internet"
          erro={erros.slug?.message}
          dica={`Fica assim: matilda3d.com.br/produtos/${slug || "nome-do-produto"}`}
        >
          <Input
            id="slug"
            autoComplete="off"
            autoCapitalize="none"
            aria-invalid={!!erros.slug}
            {...register("slug", { onChange: () => setSlugEditado(true) })}
          />
        </CampoTexto>

        <CampoTexto id="categoriaId" rotulo="Categoria" erro={erros.categoriaId?.message}>
          <select
            id="categoriaId"
            {...register("categoriaId")}
            className="h-11 w-full rounded-lg border border-input bg-white px-3 text-base focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <option value="">Sem categoria</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </CampoTexto>

        <CampoTexto
          id="descricaoCurta"
          rotulo="Descrição curta"
          erro={erros.descricaoCurta?.message}
          dica={`Aparece no card da vitrine. ${(descricaoCurta ?? "").length}/140 caracteres.`}
        >
          <Textarea id="descricaoCurta" rows={2} maxLength={140} aria-invalid={!!erros.descricaoCurta} {...register("descricaoCurta")} />
        </CampoTexto>

        <CampoTexto id="descricao" rotulo="Descrição completa" erro={erros.descricao?.message} dica="Aparece na página do produto.">
          <Textarea id="descricao" rows={5} aria-invalid={!!erros.descricao} {...register("descricao")} />
        </CampoTexto>
      </Secao>

      <Secao
        titulo="Preço e custo"
        acao={
          <Button type="button" variant="outline" onClick={() => setCalculadoraAberta(true)}>
            <Calculator aria-hidden="true" />
            Calcular custo
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoTexto id="preco" rotulo="Preço de venda" erro={erros.preco?.message} dica='Vazio = "Sob consulta" no site.'>
            <Controller
              control={control}
              name="preco"
              render={({ field }) => (
                <InputMoeda
                  id="preco"
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  aria-invalid={!!erros.preco}
                />
              )}
            />
          </CampoTexto>
          <CampoTexto id="custo" rotulo="Custo por peça" erro={erros.custo?.message} dica="Use a calculadora se não souber.">
            <Controller
              control={control}
              name="custo"
              render={({ field }) => (
                <InputMoeda
                  id="custo"
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  aria-invalid={!!erros.custo}
                />
              )}
            />
          </CampoTexto>
        </div>
        <p className="rounded-xl bg-surface-alt px-4 py-3 text-sm">
          <span className="font-bold">Margem: </span>
          {margem === null ? (
            <span className="text-ink-muted">preencha preço e custo para ver quanto do preço é lucro.</span>
          ) : (
            <span className={cn("tabular font-bold", margem < 0 ? "text-danger" : "text-success")}>
              {formatarPercentual(margem)}
              {margem < 0 && " (prejuízo: o custo é maior que o preço)"}
            </span>
          )}
        </p>
      </Secao>

      <Secao titulo="Produção" descricao="Usados pela calculadora. Veja os números no fatiador da impressora.">
        <div className="grid grid-cols-3 gap-3">
          <CampoTexto id="gramas" rotulo="Gramas" erro={erros.gramas?.message}>
            <Input id="gramas" inputMode="decimal" className="tabular" aria-invalid={!!erros.gramas} {...register("gramas")} />
          </CampoTexto>
          <CampoTexto id="horas" rotulo="Horas" erro={erros.horas?.message}>
            <Input id="horas" inputMode="numeric" className="tabular" aria-invalid={!!erros.horas} {...register("horas")} />
          </CampoTexto>
          <CampoTexto id="minutos" rotulo="Minutos" erro={erros.minutos?.message}>
            <Input id="minutos" inputMode="numeric" className="tabular" aria-invalid={!!erros.minutos} {...register("minutos")} />
          </CampoTexto>
        </div>
      </Secao>

      <Secao titulo="Cores disponíveis">
        <Controller
          control={control}
          name="cores"
          render={({ field }) => (
            <CampoCores id="cores" cores={field.value} aoMudar={field.onChange} erro={erros.cores?.message} />
          )}
        />
      </Secao>

      <Secao titulo="Fotos">
        <Controller
          control={control}
          name="fotos"
          render={({ field }) => (
            <FotosProduto
              produtoId={valoresIniciais.id}
              fotos={field.value}
              aoMudar={field.onChange}
              erro={erros.fotos?.message}
            />
          )}
        />
      </Secao>

      <Secao titulo="Na vitrine">
        <Controller
          control={control}
          name="ativo"
          render={({ field }) => (
            <LinhaSwitch
              id="ativo"
              rotulo="Ativo"
              descricao="Aparece no site para os clientes."
              marcado={field.value}
              aoMudar={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="destaque"
          render={({ field }) => (
            <LinhaSwitch
              id="destaque"
              rotulo="Destaque"
              descricao="Aparece na página inicial (até 6 produtos)."
              marcado={field.value}
              aoMudar={field.onChange}
            />
          )}
        />
      </Secao>

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-white/95 px-4 py-3 backdrop-blur md:bottom-0 md:left-64 md:px-8">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          {podeExcluir && !novo && (
            <Button type="button" variant="destructive" onClick={excluir} disabled={excluindo || salvando}>
              <Trash2 aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Excluir</span>
            </Button>
          )}
          <Button type="button" variant="ghost" className="ml-auto" onClick={() => router.push("/admin/produtos")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={salvando || excluindo} className="min-w-32">
            {salvando ? "Salvando…" : "Salvar produto"}
          </Button>
        </div>
      </div>

      <Sheet open={calculadoraAberta} onOpenChange={setCalculadoraAberta}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold">Calcular custo e preço</SheetTitle>
            <SheetDescription>Os resultados vão direto para os campos de preço e custo do produto.</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-8">
            <Calculadora padroes={padroes} inicial={{ gramas: gramasAtual, minutos: minutosAtual }} aoUsar={usarCalculadora} />
          </div>
        </SheetContent>
      </Sheet>
    </form>
  );
}

function Secao({
  titulo,
  descricao,
  acao,
  children,
}: {
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-card border border-border bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{titulo}</h2>
          {descricao && <p className="text-sm text-ink-muted">{descricao}</p>}
        </div>
        {acao}
      </div>
      {children}
    </section>
  );
}

function CampoTexto({
  id,
  rotulo,
  erro,
  dica,
  children,
}: {
  id: string;
  rotulo: string;
  erro?: string;
  dica?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-bold">
        {rotulo}
      </Label>
      {children}
      {erro ? (
        <p className="text-sm font-medium text-danger" role="alert">
          {erro}
        </p>
      ) : (
        dica && <p className="text-sm text-ink-muted">{dica}</p>
      )}
    </div>
  );
}

function LinhaSwitch({
  id,
  rotulo,
  descricao,
  marcado,
  aoMudar,
}: {
  id: string;
  rotulo: string;
  descricao: string;
  marcado: boolean;
  aoMudar: (v: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-xl px-1">
      <span>
        <span className="block font-bold">{rotulo}</span>
        <span className="block text-sm text-ink-muted">{descricao}</span>
      </span>
      <Switch id={id} checked={marcado} onCheckedChange={aoMudar} />
    </label>
  );
}
