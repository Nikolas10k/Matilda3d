-- Migração 002 — Funções auxiliares e gatilhos (docs/05-banco-de-dados.md)

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
language plpgsql set search_path = '' as $$
begin
  new.atualizado_em := now();
  return new;
end $$;

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

-- Proteções contra update direto (complementam o RLS; ver nota no fim da migração 005 do docs/05).
-- As funções RPC rodam como o dono (security definer), então `current_user` dentro
-- delas não é 'authenticated'. Assim dá para distinguir update direto pela API de
-- update feito pelas funções, sem depender de variáveis que o cliente poderia definir.

-- Vendas: pela API só podem mudar observacoes e cliente_id.
create or replace function public.proteger_vendas() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') and (
       new.numero is distinct from old.numero
    or new.data_venda is distinct from old.data_venda
    or new.canal is distinct from old.canal
    or new.subtotal_centavos is distinct from old.subtotal_centavos
    or new.desconto_centavos is distinct from old.desconto_centavos
    or new.frete_centavos is distinct from old.frete_centavos
    or new.total_centavos is distinct from old.total_centavos
    or new.pago_centavos is distinct from old.pago_centavos
    or new.status_pagamento is distinct from old.status_pagamento
    or new.cancelada is distinct from old.cancelada
    or new.motivo_cancelamento is distinct from old.motivo_cancelamento
    or new.cancelada_em is distinct from old.cancelada_em
    or new.encomenda_id is distinct from old.encomenda_id
    or new.criado_por is distinct from old.criado_por
    or new.criado_em is distinct from old.criado_em
  ) then
    raise exception 'Só é possível alterar observações e cliente de uma venda. Para corrigir valores, cancele e lance de novo.';
  end if;
  return new;
end $$;

create trigger trg_vendas_proteger before update on public.vendas
  for each row execute function public.proteger_vendas();

-- Lançamentos manuais: autor e data de criação não mudam (senão o membro poderia
-- "renovar" a janela de 24 horas ou editar em nome de outra pessoa).
create or replace function public.proteger_lancamentos() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') and (
       new.criado_por is distinct from old.criado_por
    or new.criado_em is distinct from old.criado_em
  ) then
    raise exception 'Não é possível alterar o autor nem a data de criação de um lançamento.';
  end if;
  return new;
end $$;

create trigger trg_lancamentos_proteger before update on public.lancamentos
  for each row execute function public.proteger_lancamentos();

-- Encomendas: o vínculo com a venda só é feito por registrar_venda.
create or replace function public.proteger_encomendas() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') and (
       new.venda_id is distinct from old.venda_id
    or new.numero is distinct from old.numero
    or new.criado_em is distinct from old.criado_em
  ) then
    raise exception 'O vínculo da encomenda com a venda é feito ao registrar a venda.';
  end if;
  return new;
end $$;

create trigger trg_encomendas_proteger before update on public.encomendas
  for each row execute function public.proteger_encomendas();

-- Perfis: ninguém altera o próprio papel nem se desativa (evita ficar sem admin).
create or replace function public.proteger_perfis() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') and new.id = auth.uid() and (
       new.papel is distinct from old.papel
    or new.ativo is distinct from old.ativo
  ) then
    raise exception 'Você não pode alterar o próprio papel nem desativar a própria conta.';
  end if;
  return new;
end $$;

create trigger trg_perfis_proteger before update on public.perfis
  for each row execute function public.proteger_perfis();
