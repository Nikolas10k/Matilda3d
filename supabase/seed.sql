-- Seed de DESENVOLVIMENTO (não roda em produção).
-- Os 6 produtos da prévia, sem preço real: preco_centavos nulo = "Sob consulta".
-- O primeiro admin é promovido manualmente depois do primeiro login:
--   update perfis set papel = 'admin' where id = '<uuid da Karem>';

insert into public.produtos
  (nome, slug, categoria_id, descricao_curta, preco_centavos, cores, ativo, destaque)
select p.nome, p.slug, c.id, p.descricao_curta, null, p.cores, true, p.destaque
from (values
  ('Chaveiro com nome', 'chaveiro-com-nome', 'chaveiros',
    'Seu nome ou apelido em 3D, na cor que você escolher.',
    array['Rosa','Azul','Preto','Branco'], true),
  ('Vaso geométrico', 'vaso-geometrico', 'decoracao',
    'Para suculentas e plantinhas, com acabamento em camadas.',
    array['Branco','Verde','Terracota'], true),
  ('Suporte de celular', 'suporte-de-celular', 'presentes',
    'Firme e leve, ideal para mesa de estudo ou trabalho.',
    array['Preto','Branco','Cinza'], true),
  ('Organizador de mesa', 'organizador-de-mesa', 'decoracao',
    'Divisórias para canetas, clipes e pequenos objetos.',
    array['Branco','Azul','Rosa'], true),
  ('Miniaturas e bonequinhos', 'miniaturas-e-bonequinhos', 'miniaturas',
    'Personagens e figuras para colecionar ou presentear.',
    array[]::text[], true),
  ('Topo de bolo', 'topo-de-bolo', 'personalizados',
    'Com nome e idade, feito sob medida para a sua festa.',
    array['Dourado','Prata','Rosa'], true)
) as p(nome, slug, categoria_slug, descricao_curta, cores, destaque)
join public.categorias c on c.slug = p.categoria_slug;
