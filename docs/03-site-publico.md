# 03 — Site público

Todas as páginas são Server Components, com dados vindos do Supabase (apenas produtos ativos). Revalidação: `revalidate = 60` ou `revalidatePath` disparado pelo painel ao salvar um produto.

## Rotas

| Rota | Conteúdo |
| --- | --- |
| `/` | Home: hero, destaques, como encomendar, chamada para encomenda personalizada, sobre, rodapé |
| `/produtos` | Vitrine completa com filtro por categoria (query string `?categoria=slug`) |
| `/produtos/[slug]` | Página do produto: galeria, descrição, preço, variações de cor, botão de pedido |
| `/encomenda` | Formulário de encomenda personalizada |
| `/sobre` | História da marca e dos criadores |
| `/obrigado` | Confirmação após enviar encomenda |

## Header

Logo (texto "Matilde" + "3D" na cor de destaque, com ícone de cubo), links Produtos, Como encomendar, Sobre, e botão verde "Fale no WhatsApp". No mobile, menu em gaveta (Sheet do shadcn).

## Home

1. **Hero**: selo "Feito camada por camada, com carinho", título, subtítulo, botões "Ver produtos" e "Quero algo personalizado", ilustração ou foto de destaque.
2. **Destaques**: até 6 produtos com `destaque = true`, mesmo card da vitrine.
3. **Como encomendar**: 3 passos (Escolha ou imagine, Combine pelo WhatsApp, Receba a sua peça).
4. **Encomenda personalizada**: texto e botão para `/encomenda`.
5. **Sobre**: foto dos criadores e texto curto (conteúdo vindo de `configuracoes`).
6. **Rodapé**: logo, Instagram, WhatsApp, links e "Site por Givance Tech".

## Card de produto

Foto (proporção 4:3, `next/image`), badge da categoria, nome, descrição curta (máx. 2 linhas), preço ("A partir de R$ X" se tiver variações com preços diferentes, ou "Sob consulta" se `preco_centavos` for nulo) e botão "Pedir" (WhatsApp).

## Fluxo de pedido pelo WhatsApp

O botão "Pedir" abre `https://wa.me/{NEXT_PUBLIC_WHATSAPP_NUMERO}?text={mensagem}` em nova aba, com a mensagem codificada via `encodeURIComponent`:

```
Olá, Matilde3D! Vim pelo site e tenho interesse no produto:
*{nome do produto}*{ — cor: {cor}, se escolhida}
Valor no site: {preço formatado}
Link: {url do produto}
```

Ao clicar, registrar um evento anônimo em `cliques_whatsapp` (produto_id, origem: "card" | "pagina_produto" | "header", data). Isso alimenta o indicador "Produtos mais procurados" do painel. Não registrar nenhum dado pessoal do visitante.

## Formulário de encomenda (`/encomenda`)

Campos: nome (obrigatório), WhatsApp (obrigatório, máscara `(00) 00000-0000`), tipo de peça (select: Chaveiro, Decoração, Presente, Topo de bolo, Lembrancinhas, Outro), quantidade (número ≥ 1), descrição da ideia (obrigatório, até 1000 caracteres), cores desejadas (texto opcional), data desejada (opcional, não pode ser no passado), imagem de referência (opcional, até 5 MB, jpg/png/webp, salva no bucket `referencias-encomendas`), checkbox de consentimento: "Autorizo a Matilde3D a entrar em contato comigo pelo WhatsApp sobre esta encomenda".

Ao enviar:
1. Validação com Zod no cliente e no servidor.
2. Proteção contra spam: campo honeypot oculto + limite de 3 envios por IP a cada 10 minutos.
3. Grava em `encomendas` com status `nova` e cria ou reaproveita o cliente pelo WhatsApp normalizado.
4. Redireciona para `/obrigado` com botão "Continuar no WhatsApp" (mensagem pronta com o número da encomenda).

## SEO e compartilhamento

- `metadata` por página, Open Graph com imagem do produto, `sitemap.xml` e `robots.txt` gerados pelo Next.
- Dados estruturados `Product` (JSON-LD) na página do produto.
- Títulos no formato "{Produto} | Matilde3D".

## Desempenho

- Imagens otimizadas via `next/image`, com `sizes` corretos.
- Meta de Lighthouse ≥ 90 em Performance, Acessibilidade e SEO no mobile.
