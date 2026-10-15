# 05 — Banco de dados (Supabase / Postgres)

Crie as migrações em `supabase/migrations/` na ordem abaixo. Todos os valores em dinheiro ficam em **centavos (integer)**. Gere os tipos com `supabase gen types typescript` após cada migração.

> **Implementado na Fase 1.** Os arquivos em `supabase/migrations/` são a versão em vigor do SQL abaixo e prevalecem sobre ele em caso de diferença. As mudanças em relação a este documento estão em "Diferenças da implementação", no fim.

## Princípios

- RLS ativado em todas as tabelas.
- Visitantes (anon) só **leem** dados públicos (produtos ativos, fotos, categorias, marca).
- Formulário de encomenda e cliques do WhatsApp são gravados **pelo servidor** (Server Action / Route Handler com `service_role`), nunca direto do navegador. Por isso não há política de insert para `anon`.
- Vendas, pagamentos e estornos são criados **somente via funções RPC** (`security definer`), garantindo que venda e caixa fiquem sempre consistentes.

## Migração 001 — Tabelas

```sql
-- Perfis de acesso ao painel
create table public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  papel text not null default 'membro' check (papel in ('admin','membro')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Dados públicos da marca (lidos pelo site)
create table public.marca (
  id int primary key default 1 check (id = 1),
  nome text not null default 'Matilda3D',
  whatsapp text,
  instagram text,
  texto_sobre text,
  foto_criadores text
);

-- Configurações internas (somente equipe)
create table public.configuracoes (
  id int primary key default 1 check (id = 1),
  saldo_inicial_centavos int not null default 0,
  data_inicio_caixa date not null default current_date,
  preco_kg_filamento_centavos int not null default 12000,
  custo_energia_hora_centavos int not null default 50,
  desgaste_hora_centavos int not null default 100,
  embalagem_centavos int not null default 150,
  taxa_falhas_pct numeric(5,2) not null default 10,
  margem_padrao_pct numeric(5,2) not null default 100
);

create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  ordem int not null default 0
);

create table public.produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  categoria_id uuid references public.categorias(id) on delete set null,
  descricao_curta text check (char_length(descricao_curta) <= 140),
  descricao text,
  preco_centavos int check (preco_centavos >= 0),
  custo_centavos int check (custo_centavos >= 0),
  gramas_filamento numeric(8,2),
  minutos_impressao int,
  cores text[] not null default '{}',
  ativo boolean not null default true,
  destaque boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.produto_fotos (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos(id) on delete cascade,
  caminho text not null,
  ordem int not null default 0
);

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  whatsapp text unique,          -- só dígitos, com DDI: 5561999999999
  instagram text,
  criado_em timestamptz not null default now()
);

create table public.vendas (
  id uuid primary key default gen_random_uuid(),
  numero int generated always as identity unique,
  data_venda date not null default (now() at time zone 'America/Sao_Paulo')::date,
  cliente_id uuid references public.clientes(id) on delete set null,
  canal text not null check (canal in ('whatsapp','instagram','presencial','site','outro')),
  subtotal_centavos int not null default 0 check (subtotal_centavos >= 0),
  desconto_centavos int not null default 0 check (desconto_centavos >= 0),
  frete_centavos int not null default 0 check (frete_centavos >= 0),
  total_centavos int not null default 0 check (total_centavos >= 0),
  pago_centavos int not null default 0 check (pago_centavos >= 0),
  status_pagamento text not null default 'pendente' check (status_pagamento in ('pendente','parcial','pago')),
  cancelada boolean not null default false,
  motivo_cancelamento text,
  cancelada_em timestamptz,
  encomenda_id uuid,
  observacoes text,
  criado_por uuid references public.perfis(id),
  criado_em timestamptz not null default now()
);

create table public.venda_itens (
  id uuid primary key default gen_random_uuid(),
  venda_id uuid not null references public.vendas(id) on delete cascade,
  produto_id uuid references public.produtos(id) on delete set null,
  descricao text not null,
  cor text,
  quantidade int not null check (quantidade > 0),
  preco_unitario_centavos int not null check (preco_unitario_centavos >= 0),
  custo_unitario_centavos int,   -- foto do custo no momento da venda
  total_centavos int generated always as (quantidade * preco_unitario_centavos) stored
);

create table public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  data date not null default (now() at time zone 'America/Sao_Paulo')::date,
  tipo text not null check (tipo in ('entrada','saida')),
  categoria text not null,
  descricao text not null,
  valor_centavos int not null check (valor_centavos > 0),
  forma_pagamento text check (forma_pagamento in ('pix','dinheiro','credito','debito','transferencia')),
  venda_id uuid references public.vendas(id),
  estorno_de uuid references public.lancamentos(id),
  comprovante text,
  criado_por uuid references public.perfis(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.venda_pagamentos (
  id uuid primary key default gen_random_uuid(),
  venda_id uuid not null references public.vendas(id) on delete cascade,
  data date not null,
  forma text not null check (forma in ('pix','dinheiro','credito','debito','transferencia')),
  valor_centavos int not null check (valor_centavos > 0),
  lancamento_id uuid references public.lancamentos(id),
  criado_em timestamptz not null default now()
);

create table public.encomendas (
  id uuid primary key default gen_random_uuid(),
  numero int generated always as identity unique,
  cliente_id uuid references public.clientes(id) on delete set null,
  nome_contato text not null,
  whatsapp text not null,
  tipo text not null,
  quantidade int not null default 1 check (quantidade > 0),
  descricao text not null check (char_length(descricao) <= 1000),
  cores text,
  data_desejada date,
  imagem_referencia text,
  status text not null default 'nova' check (status in
    ('nova','em_conversa','orcada','aprovada','em_producao','pronta','entregue','cancelada')),
  valor_orcado_centavos int check (valor_orcado_centavos >= 0),
  previsao_entrega date,
  notas_internas text,
  venda_id uuid references public.vendas(id),
  consentimento_contato boolean not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.vendas
  add constraint vendas_encomenda_fk foreign key (encomenda_id) references public.encomendas(id);

create table public.encomenda_historico (
  id uuid primary key default gen_random_uuid(),
  encomenda_id uuid not null references public.encomendas(id) on delete cascade,
  status_anterior text,
  status_novo text not null,
  usuario_id uuid references public.perfis(id),
  criado_em timestamptz not null default now()
);

create table public.cliques_whatsapp (
  id bigint generated always as identity primary key,
  produto_id uuid references public.produtos(id) on delete set null,
  origem text not null check (origem in ('card','pagina_produto','header','encomenda')),
  criado_em timestamptz not null default now()
);

-- Índices
create index on public.produtos (ativo, destaque);
create index on public.vendas (data_venda) where not cancelada;
create index on public.lancamentos (data);
create index on public.encomendas (status);
create index on public.cliques_whatsapp (produto_id, criado_em);
```

## Migração 002 — Funções auxiliares e gatilhos

```sql
create or replace function public.eh_equipe() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfis where id = auth.uid() and ativo);
$$;

create or replace function public.eh_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfis where id = auth.uid() and ativo and papel = 'admin');
$$;

-- Atualiza atualizado_em
create or replace function public.tocar_atualizado_em() returns trigger
language plpgsql as $$ begin new.atualizado_em := now(); return new; end $$;

create trigger trg_produtos_upd before update on public.produtos
  for each row execute function public.tocar_atualizado_em();
create trigger trg_lancamentos_upd before update on public.lancamentos
  for each row execute function public.tocar_atualizado_em();
create trigger trg_encomendas_upd before update on public.encomendas
  for each row execute function public.tocar_atualizado_em();

-- Histórico de status das encomendas
create or replace function public.registrar_status_encomenda() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into encomenda_historico (encomenda_id, status_anterior, status_novo, usuario_id)
    values (new.id, case when tg_op = 'UPDATE' then old.status end, new.status, auth.uid());
  end if;
  return new;
end $$;

create trigger trg_encomendas_status after insert or update on public.encomendas
  for each row execute function public.registrar_status_encomenda();

-- Cria perfil ao convidar um usuário (papel padrão: membro)
create or replace function public.criar_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into perfis (id, nome) values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email));
  return new;
end $$;

create trigger trg_auth_novo_usuario after insert on auth.users
  for each row execute function public.criar_perfil();
```

## Migração 003 — Funções de negócio (RPC)

```sql
-- Recalcula pago e status de uma venda
create or replace function public.recalcular_venda(p_venda uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_pago int; v_total int;
begin
  select coalesce(sum(valor_centavos),0) into v_pago from venda_pagamentos where venda_id = p_venda;
  select total_centavos into v_total from vendas where id = p_venda;
  update vendas set
    pago_centavos = v_pago,
    status_pagamento = case when v_pago = 0 then 'pendente'
                            when v_pago >= v_total then 'pago' else 'parcial' end
  where id = p_venda;
end $$;

-- Registra um pagamento e o lançamento de entrada correspondente
create or replace function public.registrar_pagamento(
  p_venda uuid, p_valor int, p_forma text, p_data date default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_venda vendas; v_lanc uuid; v_pag uuid; v_data date;
begin
  if not eh_equipe() then raise exception 'Acesso negado'; end if;
  select * into v_venda from vendas where id = p_venda for update;
  if v_venda.id is null then raise exception 'Venda não encontrada'; end if;
  if v_venda.cancelada then raise exception 'Venda cancelada não recebe pagamento'; end if;
  if p_valor <= 0 then raise exception 'Valor deve ser maior que zero'; end if;
  if v_venda.pago_centavos + p_valor > v_venda.total_centavos then
    raise exception 'Pagamento maior que o valor em aberto';
  end if;
  v_data := coalesce(p_data, (now() at time zone 'America/Sao_Paulo')::date);

  insert into lancamentos (data, tipo, categoria, descricao, valor_centavos, forma_pagamento, venda_id, criado_por)
  values (v_data, 'entrada', 'Venda', 'Venda #' || v_venda.numero, p_valor, p_forma, p_venda, auth.uid())
  returning id into v_lanc;

  insert into venda_pagamentos (venda_id, data, forma, valor_centavos, lancamento_id)
  values (p_venda, v_data, p_forma, p_valor, v_lanc) returning id into v_pag;

  perform recalcular_venda(p_venda);
  return v_pag;
end $$;

-- Cria venda completa. p_itens: [{"produto_id":uuid|null,"descricao":text,"cor":text|null,
--   "quantidade":int,"preco_unitario_centavos":int}]
create or replace function public.registrar_venda(
  p_data date, p_cliente uuid, p_canal text, p_itens jsonb,
  p_desconto int default 0, p_frete int default 0,
  p_valor_pago int default 0, p_forma text default null,
  p_encomenda uuid default null, p_observacoes text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_sub int; v_total int; i jsonb;
begin
  if not eh_equipe() then raise exception 'Acesso negado'; end if;
  if jsonb_array_length(coalesce(p_itens,'[]')) = 0 then raise exception 'Inclua pelo menos um item'; end if;

  insert into vendas (data_venda, cliente_id, canal, desconto_centavos, frete_centavos,
                      encomenda_id, observacoes, criado_por)
  values (p_data, p_cliente, p_canal, coalesce(p_desconto,0), coalesce(p_frete,0),
          p_encomenda, p_observacoes, auth.uid())
  returning id into v_id;

  for i in select * from jsonb_array_elements(p_itens) loop
    insert into venda_itens (venda_id, produto_id, descricao, cor, quantidade,
                             preco_unitario_centavos, custo_unitario_centavos)
    values (v_id, nullif(i->>'produto_id','')::uuid, i->>'descricao', i->>'cor',
            (i->>'quantidade')::int, (i->>'preco_unitario_centavos')::int,
            (select custo_centavos from produtos where id = nullif(i->>'produto_id','')::uuid));
  end loop;

  select sum(total_centavos) into v_sub from venda_itens where venda_id = v_id;
  v_total := v_sub - coalesce(p_desconto,0) + coalesce(p_frete,0);
  if v_total < 0 then raise exception 'Desconto maior que o valor da venda'; end if;
  update vendas set subtotal_centavos = v_sub, total_centavos = v_total where id = v_id;

  if p_encomenda is not null then
    update encomendas set venda_id = v_id where id = p_encomenda;
  end if;

  if coalesce(p_valor_pago,0) > 0 then
    perform registrar_pagamento(v_id, p_valor_pago, p_forma, p_data);
  end if;
  return v_id;
end $$;

-- Cancela venda e estorna no caixa tudo o que já entrou
create or replace function public.cancelar_venda(p_venda uuid, p_motivo text) returns void
language plpgsql security definer set search_path = public as $$
declare l lancamentos; v_num int;
begin
  if not eh_equipe() then raise exception 'Acesso negado'; end if;
  if coalesce(trim(p_motivo),'') = '' then raise exception 'Informe o motivo do cancelamento'; end if;
  select numero into v_num from vendas where id = p_venda and not cancelada for update;
  if v_num is null then raise exception 'Venda não encontrada ou já cancelada'; end if;

  for l in select * from lancamentos
           where venda_id = p_venda and tipo = 'entrada' and estorno_de is null loop
    insert into lancamentos (tipo, categoria, descricao, valor_centavos, forma_pagamento,
                             venda_id, estorno_de, criado_por)
    values ('saida', 'Estorno de venda', 'Estorno da venda #' || v_num, l.valor_centavos,
            l.forma_pagamento, p_venda, l.id, auth.uid());
  end loop;

  update vendas set cancelada = true, motivo_cancelamento = p_motivo, cancelada_em = now()
  where id = p_venda;
end $$;

revoke all on function public.registrar_venda, public.registrar_pagamento,
  public.cancelar_venda, public.recalcular_venda from anon, public;
grant execute on function public.registrar_venda, public.registrar_pagamento,
  public.cancelar_venda to authenticated;
```

## Migração 004 — Views para o dashboard

Todas com `security_invoker = true`, para respeitar o RLS de quem consulta.

```sql
create view public.vw_saldo_caixa with (security_invoker = true) as
select
  c.saldo_inicial_centavos
  + coalesce(sum(case when l.tipo = 'entrada' then l.valor_centavos else -l.valor_centavos end), 0)
  as saldo_centavos
from configuracoes c
left join lancamentos l on l.data >= c.data_inicio_caixa
group by c.saldo_inicial_centavos;

create view public.vw_resumo_mensal with (security_invoker = true) as
with caixa as (
  select date_trunc('month', data)::date as mes,
         sum(valor_centavos) filter (where tipo = 'entrada') as entradas,
         sum(valor_centavos) filter (where tipo = 'saida')   as saidas
  from lancamentos group by 1
), vendas_mes as (
  select date_trunc('month', data_venda)::date as mes,
         count(*) as qtd_vendas, sum(total_centavos) as faturamento
  from vendas where not cancelada group by 1
)
select coalesce(c.mes, v.mes) as mes,
       coalesce(c.entradas,0) as entradas_centavos,
       coalesce(c.saidas,0) as saidas_centavos,
       coalesce(c.entradas,0) - coalesce(c.saidas,0) as resultado_centavos,
       coalesce(v.qtd_vendas,0) as qtd_vendas,
       coalesce(v.faturamento,0) as faturamento_centavos,
       case when coalesce(v.qtd_vendas,0) > 0 then round(v.faturamento::numeric / v.qtd_vendas)::int else 0 end
         as ticket_medio_centavos
from caixa c full join vendas_mes v on v.mes = c.mes;

create view public.vw_a_receber with (security_invoker = true) as
select v.id, v.numero, v.data_venda, cl.nome as cliente,
       v.total_centavos, v.pago_centavos, v.total_centavos - v.pago_centavos as aberto_centavos
from vendas v left join clientes cl on cl.id = v.cliente_id
where not v.cancelada and v.status_pagamento <> 'pago';

create view public.vw_produtos_mais_vendidos with (security_invoker = true) as
select i.produto_id, coalesce(p.nome, i.descricao) as nome,
       sum(i.quantidade) as quantidade, sum(i.total_centavos) as total_centavos,
       min(v.data_venda) as primeira_venda, max(v.data_venda) as ultima_venda
from venda_itens i join vendas v on v.id = i.venda_id and not v.cancelada
left join produtos p on p.id = i.produto_id
group by i.produto_id, coalesce(p.nome, i.descricao);
```

> O dashboard filtra períodos no servidor. Para períodos personalizados, prefira consultas diretas em `lancamentos` e `vendas` com `where data between $1 and $2`, em vez das views mensais.

## Migração 005 — RLS

```sql
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
  with check (public.eh_equipe());  -- a aplicação só altera observacoes e cliente_id

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
```

> Para impedir que a coluna `cancelada` ou valores de `vendas` sejam alterados por update direto, crie um trigger `before update on vendas` que rejeite mudanças em colunas financeiras quando a chamada não vier das funções RPC (ex.: comparar `old` e `new` e usar `current_setting('app.rpc', true)` definido dentro das funções).

## Storage

| Bucket | Público | Quem envia | Observação |
| --- | --- | --- | --- |
| `produtos` | Sim (leitura) | Equipe | Fotos webp, máx. 1600px |
| `marca` | Sim (leitura) | Admin | Logo e foto dos criadores |
| `referencias-encomendas` | Não | Servidor (service_role) | Leitura pela equipe via URL assinada |
| `comprovantes` | Não | Equipe | Leitura pela equipe via URL assinada |

## Seed (desenvolvimento)

- `marca` e `configuracoes` com a linha `id = 1`.
- Categorias: Chaveiros, Decoração, Presentes, Miniaturas, Personalizados.
- 6 produtos de exemplo (os da prévia), sem preço real (`preco_centavos` nulo ou valores fictícios claramente marcados no ambiente de desenvolvimento).
- O primeiro admin é promovido manualmente: `update perfis set papel = 'admin' where id = '<uuid da Karem>';`

## Diferenças da implementação

Ajustes feitos na Fase 1 (todos cobertos por testes em `supabase/tests/banco.test.ts`):

- **Proteção contra update direto** (nota do fim da migração 005): em vez de `current_setting('app.rpc')`, os gatilhos comparam `current_user`. Dentro das funções RPC (`security definer`) ele é o dono do banco; numa chamada direta pela API ele é `authenticated`. O cliente não consegue falsificar isso. Gatilhos criados:
  - `vendas`: pela API só mudam `observacoes` e `cliente_id`.
  - `lancamentos`: `criado_por` e `criado_em` não mudam (senão o membro poderia renovar a janela de 24 horas).
  - `encomendas`: `venda_id` só é preenchido por `registrar_venda`.
  - `perfis`: ninguém altera o próprio papel nem se desativa (evita ficar sem admin).
- **Permissões de funções:** o Supabase concede `execute` a `anon` e `authenticated` em toda função nova. As migrações revogam isso de `recalcular_venda` e das funções de gatilho; só as 3 RPCs de venda ficam liberadas para `authenticated`. As views do painel também foram revogadas de `anon`.
- **Validações extras nas RPCs:** pagamento exige forma de pagamento; todo item precisa de descrição; uma encomenda não pode ser vinculada a duas vendas ativas (depois de cancelar, pode — fluxo "Cancelar e duplicar").
- **Índices** nas chaves estrangeiras usadas em joins e no RLS.
- **Migração 006 — Storage:** cria os 4 buckets com limite de tamanho e tipos de arquivo, e as políticas da tabela acima.
- **Migração 007 — Limite de envios:** tabela `limites_envio` e função `consumir_limite_envio(chave, maximo, janela)`, só para o `service_role`. Guarda um hash do IP, nunca o IP (LGPD). Atende ao "3 envios por IP a cada 10 minutos" do `docs/03`, que não funcionaria em memória na Vercel.
- **Migração 008 — Dados iniciais:** `marca` (com o texto "Sobre nós" citando Maria Clara e Tharik), `configuracoes` e as 5 categorias vão numa migração, porque também são necessários em produção. `supabase/seed.sql` fica só com os 6 produtos de exemplo (sem preço, "Sob consulta").

## Como aplicar no projeto Supabase

1. Crie o projeto na região **São Paulo (sa-east-1)**.
2. No painel do Supabase, em Authentication → Sign In / Providers, **desative "Allow new users to sign up"**: o acesso ao painel é só por convite.
3. Vincule e aplique as migrações:
   ```bash
   pnpm dlx supabase@2.121.0 login
   pnpm dlx supabase@2.121.0 link --project-ref <ref-do-projeto>
   pnpm dlx supabase@2.121.0 db push                 # produção: só migrações
   pnpm dlx supabase@2.121.0 db push --include-seed  # desenvolvimento: + produtos de exemplo
   ```
4. Gere os tipos oficiais: `pnpm db:tipos`.
5. Convide a Karem (Authentication → Users → Invite) e promova-a a admin com o `update perfis` acima.

## Testes do banco

`pnpm test` aplica todas as migrações num Postgres em memória (PGlite) que emula os papéis do Supabase (`supabase/tests/supabase-shim.sql`) e verifica RLS, RPCs, estornos, saldo e permissões. Sem projeto Supabase, `pnpm db:tipos:local` gera `src/types/database.ts` pelo mesmo caminho.
