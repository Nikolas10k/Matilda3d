-- Migração 011 — A equipe precisa "ler" os objetos do bucket produtos pela API.
-- O bucket é público (as fotos abrem pelo link direto), mas a API do Storage
-- consulta storage.objects antes de apagar ou listar arquivos. Sem esta
-- política, remover fotos ao editar ou excluir um produto falhava em silêncio
-- e os arquivos ficavam órfãos.

create policy storage_produtos_ler on storage.objects for select to authenticated
  using (bucket_id = 'produtos' and public.eh_equipe());

create policy storage_marca_ler on storage.objects for select to authenticated
  using (bucket_id = 'marca' and public.eh_equipe());
