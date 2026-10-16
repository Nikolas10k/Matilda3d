import type { Metadata } from "next";
import { Suspense } from "react";
import { ConteudoCarregando } from "@/components/painel/carregando";
import { EmBreve, SemPermissao } from "@/components/painel/em-breve";
import { ehAdmin, exigirEquipe } from "@/server/auth";

export const metadata: Metadata = { title: "Configurações" };

export default function PaginaConfiguracoes() {
  return (
    <Suspense fallback={<ConteudoCarregando />}>
      <Configuracoes />
    </Suspense>
  );
}

// Somente admin (docs/04, seção 9). O menu esconde o item para membros, e esta
// checagem bloqueia o acesso pela URL direta. Os dados em si são protegidos pelo RLS.
async function Configuracoes() {
  const usuario = await exigirEquipe();
  if (!ehAdmin(usuario)) return <SemPermissao />;

  return (
    <EmBreve
      titulo="Configurações"
      fase={4}
      descricao="Dados da marca, saldo inicial do caixa, padrões da calculadora, categorias e usuários."
    />
  );
}
