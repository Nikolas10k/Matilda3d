-- Migração 001 — Tabelas (docs/05-banco-de-dados.md)
-- Todos os valores em dinheiro ficam em centavos (integer).

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
  data_inicio_caixa date not null default (now() at time zone 'America/Sao_Paulo')::date,
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

-- Índices das chaves estrangeiras mais consultadas (joins e RLS)
create index on public.produtos (categoria_id);
create index on public.produto_fotos (produto_id, ordem);
create index on public.vendas (cliente_id);
create index on public.vendas (encomenda_id);
create index on public.venda_itens (venda_id);
create index on public.venda_itens (produto_id);
create index on public.venda_pagamentos (venda_id);
create index on public.lancamentos (venda_id);
create index on public.lancamentos (estorno_de);
create index on public.encomendas (cliente_id);
create index on public.encomenda_historico (encomenda_id);
