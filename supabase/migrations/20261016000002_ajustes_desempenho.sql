-- Migração 009 — Ajustes apontados pelo Performance Advisor do Supabase
-- (o comportamento das permissões não muda; os testes cobrem isso).

-- auth.uid() dentro de (select ...) é avaliado uma vez por consulta, não por linha.
drop policy lanc_ins on public.lancamentos;
drop policy lanc_upd on public.lancamentos;

create policy lanc_ins on public.lancamentos for insert with check (
  (select public.eh_equipe()) and venda_id is null and estorno_de is null
  and criado_por = (select auth.uid()));
create policy lanc_upd on public.lancamentos for update using (
  venda_id is null and estorno_de is null and (
    (select public.eh_admin())
    or (criado_por = (select auth.uid()) and criado_em > now() - interval '24 hours')));

-- Categorias: a política "for all" do admin se somava à leitura pública.
-- Separada por ação, a leitura fica só com pub_categorias.
drop policy cat_admin on public.categorias;
create policy cat_ins on public.categorias for insert with check ((select public.eh_admin()));
create policy cat_upd on public.categorias for update using ((select public.eh_admin()));
create policy cat_del on public.categorias for delete using ((select public.eh_admin()));

-- Chaves estrangeiras que ainda não tinham índice.
create index on public.encomenda_historico (usuario_id);
create index on public.encomendas (venda_id);
create index on public.lancamentos (criado_por);
create index on public.venda_pagamentos (lancamento_id);
create index on public.vendas (criado_por);
