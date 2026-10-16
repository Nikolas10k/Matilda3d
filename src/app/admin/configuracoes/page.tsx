import type { Metadata } from "next";
import { Suspense } from "react";
import { FormularioCarregando } from "@/components/painel/carregando";
import {
  FormularioCaixa,
  FormularioCalculadora,
  FormularioMarca,
  GerenciarCategorias,
  GerenciarUsuarios,
} from "@/components/painel/configuracoes/formularios";
import { Secao } from "@/components/painel/elementos";
import { SemPermissao } from "@/components/painel/em-breve";
import { centavosParaTexto, formatarWhatsApp } from "@/lib/format";
import { ehAdmin, exigirEquipe } from "@/server/auth";
import { listarUsuarios, obterConfiguracoesCompletas } from "@/server/configuracoes";

export const metadata: Metadata = { title: "Configurações" };

export default function PaginaConfiguracoes() {
  return (
    <Suspense fallback={<FormularioCarregando />}>
      <Configuracoes />
    </Suspense>
  );
}

// Somente admin (docs/04, seção 9). O menu esconde o item para membros, e esta
// checagem bloqueia o acesso pela URL direta. Os dados em si são protegidos pelo RLS.
async function Configuracoes() {
  const usuario = await exigirEquipe();
  if (!ehAdmin(usuario)) return <SemPermissao />;

  const [{ marca, config, categorias }, usuarios] = await Promise.all([obterConfiguracoesCompletas(), listarUsuarios()]);
  const numero = (n: number | string) => String(n).replace(".", ",");

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold md:text-3xl">Configurações</h1>

      <Secao titulo="Usuários" descricao="Quem pode entrar no painel.">
        <GerenciarUsuarios usuarios={usuarios} meuId={usuario.id} />
      </Secao>

      <Secao titulo="Caixa" descricao="Ponto de partida do saldo em caixa.">
        <FormularioCaixa
          inicial={{ saldoInicial: centavosParaTexto(config.saldo_inicial_centavos), dataInicio: config.data_inicio_caixa }}
        />
      </Secao>

      <Secao titulo="Marca" descricao="Dados que aparecem no site.">
        <FormularioMarca
          inicial={{
            nome: marca.nome,
            whatsapp: marca.whatsapp ? formatarWhatsApp(marca.whatsapp) : "",
            instagram: marca.instagram ? `@${marca.instagram}` : "",
            textoSobre: marca.texto_sobre ?? "",
            fotoCriadores: marca.foto_criadores ?? "",
          }}
        />
      </Secao>

      <Secao titulo="Padrões da calculadora" descricao="Valores que a calculadora de preço usa quando abre.">
        <FormularioCalculadora
          inicial={{
            precoKg: centavosParaTexto(config.preco_kg_filamento_centavos),
            energiaHora: centavosParaTexto(config.custo_energia_hora_centavos),
            desgasteHora: centavosParaTexto(config.desgaste_hora_centavos),
            embalagem: centavosParaTexto(config.embalagem_centavos),
            taxaFalhas: numero(config.taxa_falhas_pct),
            margem: numero(config.margem_padrao_pct),
          }}
        />
      </Secao>

      <Secao titulo="Categorias de produto" descricao="A ordem aqui é a ordem dos filtros da vitrine.">
        <GerenciarCategorias categorias={categorias} />
      </Secao>
    </section>
  );
}
