-- Migração 008 — Dados iniciais necessários também em produção
-- (linhas únicas de marca e configurações, e as categorias de produto).
-- Os produtos de exemplo ficam em supabase/seed.sql, só para desenvolvimento.

insert into public.marca (id, nome, texto_sobre) values (
  1,
  'Matilda3D',
  'A Matilda3D nasceu da curiosidade de Maria Clara e Tharik por tecnologia e criatividade. '
  || 'Cada peça é modelada, impressa e acabada à mão, em casa, com atenção a cada detalhe.'
);

insert into public.configuracoes (id) values (1);

insert into public.categorias (nome, slug, ordem) values
  ('Chaveiros', 'chaveiros', 1),
  ('Decoração', 'decoracao', 2),
  ('Presentes', 'presentes', 3),
  ('Miniaturas', 'miniaturas', 4),
  ('Personalizados', 'personalizados', 5);
