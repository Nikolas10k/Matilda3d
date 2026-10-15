import type { Metadata } from "next";
import { EmBreve, SemPermissao } from "@/components/painel/em-breve";
import { ehAdmin, exigirEquipe } from "@/server/auth";

export const metadata: Metadata = { title: "Configurações" };

// Somente admin (docs/04, seção 9). O menu esconde o item para membros, e esta
// checagem bloqueia o acesso pela URL direta. Os dados em si são protegidos pelo RLS.
export default async function PaginaConfiguracoes() {
  const usuario = await exigirEquipe();
  if (!ehAdmin(usuario)) return <SemPermissao />;

  return (
    <EmBreve
      titulo="Configurações"
      fase={3}
      descricao="Dados da marca, saldo inicial do caixa, padrões da calculadora, categorias e usuários."
    />
  );
}
