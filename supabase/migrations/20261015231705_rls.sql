-- Migração 005 — RLS (docs/05-banco-de-dados.md)

alter table public.perfis            enable row level security;
alter table public.marca             enable row level security;
alter table public.configuracoes     enable row level security;
alter table public.categorias        enable row level security;
alter table public.produtos          enable row level security;
alter table public.produto_fotos     enable row level security;
alter table public.clientes          enable row level security;
alter table public.vendas            enable row level security;
alter table public.venda_itens       enable row level security;
alter table public.venda_pagamentos  enable row level security;
alter table public.lancamentos       enable row level security;
alter table public.encomendas        enable row level security;
alter table public.encomenda_historico enable row level security;
alter table public.cliques_whatsapp  enable row level security;

-- Público (site)
create policy pub_marca on public.marca for select using (true);
create policy pub_categorias on public.categorias for select using (true);
create policy pub_produtos on public.produtos for select using (ativo or public.eh_equipe());
create policy pub_fotos on public.produto_fotos for select using (
  exists (select 1 from public.produtos p where p.id = produto_id and (p.ativo or public.eh_equipe())));

-- Perfis
create policy perfis_ler on public.perfis for select using (public.eh_equipe());
create policy perfis_admin on public.perfis for update using (public.eh_admin());

-- Marca, configurações e categorias: equipe lê, admin altera
create policy marca_admin on public.marca for update using (public.eh_admin());
create policy config_ler on public.configuracoes for select using (public.eh_equipe());
create policy config_admin on public.configuracoes for update using (public.eh_admin());
create policy cat_admin on public.categorias for all using (public.eh_admin()) with check (public.eh_admin());

-- Produtos e fotos: equipe cria e edita, admin apaga
create policy prod_ins on public.produtos for insert with check (public.eh_equipe());
create policy prod_upd on public.produtos for update using (public.eh_equipe());
create policy prod_del on public.produtos for delete using (public.eh_admin());
create policy fotos_ins on public.produto_fotos for insert with check (public.eh_equipe());
create policy fotos_upd on public.produto_fotos for update using (public.eh_equipe());
create policy fotos_del on public.produto_fotos for delete using (public.eh_equipe());

-- Clientes e encomendas: equipe
create policy cli_equipe on public.clientes for select using (public.eh_equipe());
create policy cli_ins on public.clientes for insert with check (public.eh_equipe());
create policy cli_upd on public.clientes for update using (public.eh_equipe());
create policy enc_ler on public.encomendas for select using (public.eh_equipe());
create policy enc_upd on public.encomendas for update using (public.eh_equipe());
create policy hist_ler on public.encomenda_historico for select using (public.eh_equipe());

-- Vendas e pagamentos: equipe só lê; escrita apenas via RPC
create policy vendas_ler on public.vendas for select using (public.eh_equipe());
create policy itens_ler on public.venda_itens for select using (public.eh_equipe());
create policy pag_ler on public.venda_pagamentos for select using (public.eh_equipe());
create policy vendas_obs on public.vendas for update using (public.eh_equipe())
  with check (public.eh_equipe());  -- só observacoes e cliente_id (gatilho trg_vendas_proteger)

-- Caixa
create policy lanc_ler on public.lancamentos for select using (public.eh_equipe());
create policy lanc_ins on public.lancamentos for insert with check (
  public.eh_equipe() and venda_id is null and estorno_de is null and criado_por = auth.uid());
create policy lanc_upd on public.lancamentos for update using (
  venda_id is null and estorno_de is null and (
    public.eh_admin() or (criado_por = auth.uid() and criado_em > now() - interval '24 hours')));
create policy lanc_del on public.lancamentos for delete using (
  public.eh_admin() and venda_id is null and estorno_de is null);

-- Cliques: equipe lê (o servidor grava com service_role)
create policy cliques_ler on public.cliques_whatsapp for select using (public.eh_equipe());
