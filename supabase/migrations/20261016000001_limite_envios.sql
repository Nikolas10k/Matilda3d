-- Migração 007 — Limite de envios do formulário de encomenda (docs/03: 3 envios por IP a cada 10 min)
-- Na Vercel cada requisição pode cair numa instância diferente, então o contador
-- precisa ficar no banco. A chave é um hash do IP (nunca o IP em si, por LGPD),
-- gerado no servidor.

create table public.limites_envio (
  id bigint generated always as identity primary key,
  chave text not null,
  criado_em timestamptz not null default now()
);

create index on public.limites_envio (chave, criado_em);

-- RLS sem políticas: só o service_role (servidor) acessa.
alter table public.limites_envio enable row level security;
revoke all on public.limites_envio from anon, authenticated;

-- Registra uma tentativa e diz se ela está dentro do limite.
create or replace function public.consumir_limite_envio(
  p_chave text, p_maximo int default 3, p_janela interval default interval '10 minutes'
) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_qtd int;
begin
  -- Serializa tentativas simultâneas da mesma chave.
  perform pg_advisory_xact_lock(hashtext('limite_envio:' || p_chave));

  -- Limpeza: nada aqui precisa durar mais de um dia.
  delete from limites_envio where criado_em < now() - greatest(p_janela, interval '1 day');

  select count(*) into v_qtd from limites_envio
  where chave = p_chave and criado_em > now() - p_janela;

  if v_qtd >= p_maximo then
    return false;
  end if;

  insert into limites_envio (chave) values (p_chave);
  return true;
end $$;

revoke all on function public.consumir_limite_envio from anon, authenticated, public;
grant execute on function public.consumir_limite_envio to service_role;
