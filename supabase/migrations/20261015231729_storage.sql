-- Migração 006 — Buckets e políticas do Storage (docs/05-banco-de-dados.md, seção Storage)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('produtos', 'produtos', true, 5242880, array['image/webp','image/jpeg','image/png']),
  ('marca', 'marca', true, 5242880, array['image/webp','image/jpeg','image/png','image/svg+xml']),
  ('referencias-encomendas', 'referencias-encomendas', false, 5242880,
    array['image/webp','image/jpeg','image/png']),
  ('comprovantes', 'comprovantes', false, 10485760,
    array['image/webp','image/jpeg','image/png','application/pdf']);

-- produtos: leitura pública (bucket público); equipe envia, troca e apaga fotos
create policy storage_produtos_ins on storage.objects for insert to authenticated
  with check (bucket_id = 'produtos' and public.eh_equipe());
create policy storage_produtos_upd on storage.objects for update to authenticated
  using (bucket_id = 'produtos' and public.eh_equipe());
create policy storage_produtos_del on storage.objects for delete to authenticated
  using (bucket_id = 'produtos' and public.eh_equipe());

-- marca: leitura pública; só admin altera
create policy storage_marca_ins on storage.objects for insert to authenticated
  with check (bucket_id = 'marca' and public.eh_admin());
create policy storage_marca_upd on storage.objects for update to authenticated
  using (bucket_id = 'marca' and public.eh_admin());
create policy storage_marca_del on storage.objects for delete to authenticated
  using (bucket_id = 'marca' and public.eh_admin());

-- referencias-encomendas: o servidor grava (service_role); equipe lê via URL assinada
create policy storage_referencias_ler on storage.objects for select to authenticated
  using (bucket_id = 'referencias-encomendas' and public.eh_equipe());

-- comprovantes: equipe envia e lê; só admin apaga
create policy storage_comprovantes_ler on storage.objects for select to authenticated
  using (bucket_id = 'comprovantes' and public.eh_equipe());
create policy storage_comprovantes_ins on storage.objects for insert to authenticated
  with check (bucket_id = 'comprovantes' and public.eh_equipe());
create policy storage_comprovantes_del on storage.objects for delete to authenticated
  using (bucket_id = 'comprovantes' and public.eh_admin());
