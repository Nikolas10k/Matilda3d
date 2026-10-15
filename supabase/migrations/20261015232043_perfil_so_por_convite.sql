-- Migração 010 — Só usuários convidados ganham acesso ao painel.
-- O gatilho original criava um perfil ATIVO para qualquer novo usuário do Auth.
-- Se o cadastro público estiver ligado no Supabase (é o padrão), qualquer pessoa
-- poderia criar conta com a chave pública e ver o financeiro. Agora o perfil só
-- nasce ativo quando o usuário foi convidado (auth.users.invited_at preenchido);
-- os demais ficam inativos até um admin liberar em Configurações.

create or replace function public.criar_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into perfis (id, nome, ativo)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email), new.invited_at is not null);
  return new;
end $$;

revoke all on function public.criar_perfil from anon, authenticated, public;
