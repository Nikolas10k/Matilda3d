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

Fundo Branco com borda inferior de 1px em Pérola. À esquerda, `public/brand/logo-horizontal.svg` (altura de 40px no desktop e 32px no mobile), com link para `/`. Links Produtos, Como encomendar e Sobre em DM Sans 15px Grafite, e botão pill grafite "Fale no WhatsApp" com ícone em traço. No mobile, menu em gaveta (Sheet do shadcn).

Metadados de ícones no `layout.tsx`: `favicon.ico`, `favicon.svg`, `apple-touch-icon.png` e o `manifest` com `icon-192.png` e `icon-512.png`. Open Graph padrão: `og-image.png`.

## Home

1. **Hero**: fundo Névoa, label "Impressão 3D" (Jost 500, maiúsculas, espaçada), título "Chaveiros e peças para casa, feitos camada por camada" (Jost 300), subtítulo curto, botões "Ver produtos" (grafite) e "Quero algo personalizado" (contorno grafite) e, à direita, uma foto de destaque de produto ou, enquanto não houver foto, o `logo-principal.svg` grande sobre Pérola.
2. **Destaques**: até 6 produtos com `destaque = true`, mesmo card da vitrine.
3. **Como encomendar**: 3 passos (Escolha ou imagine, Combine pelo WhatsApp, Receba a sua peça).
4. **Encomenda personalizada**: texto e botão para `/encomenda`.
5. **Sobre**: foto dos criadores e texto curto (conteúdo vindo de `configuracoes`).
6. **Rodapé**: fundo Grafite com `logo-horizontal-branco.svg`, Instagram, WhatsApp, links e "Site por Givance Tech".

## Card de produto

Foto (proporção 4:3, `next/image`), badge da categoria, nome, descrição curta (máx. 2 linhas), preço ("A partir de R$ X" se tiver variações com preços diferentes, ou "Sob consulta" se `preco_centavos` for nulo) e botão "Pedir" (WhatsApp).

## Fluxo de pedido pelo WhatsApp

O botão "Pedir" abre `https://wa.me/{NEXT_PUBLIC_WHATSAPP_NUMERO}?text={mensagem}` em nova aba, com a mensagem codificada via `encodeURIComponent`:

```
Olá, Matilda3D! Vim pelo site e tenho interesse no produto:
*{nome do produto}*{ — cor: {cor}, se escolhida}
Valor no site: {preço formatado}
Link: {url do produto}
```

Ao clicar, registrar um evento anônimo em `cliques_whatsapp` (produto_id, origem: "card" | "pagina_produto" | "header", data). Isso alimenta o indicador "Produtos mais procurados" do painel. Não registrar nenhum dado pessoal do visitante.

## Formulário de encomenda (`/encomenda`)

Campos: nome (obrigatório), WhatsApp (obrigatório, máscara `(00) 00000-0000`), tipo de peça (select: Chaveiro, Decoração, Presente, Topo de bolo, Lembrancinhas, Outro), quantidade (número ≥ 1), descrição da ideia (obrigatório, até 1000 caracteres), cores desejadas (texto opcional), data desejada (opcional, não pode ser no passado), imagem de referência (opcional, até 5 MB, jpg/png/webp, salva no bucket `referencias-encomendas`), checkbox de consentimento: "Autorizo a Matilda3D a entrar em contato comigo pelo WhatsApp sobre esta encomenda".

Ao enviar:
1. Validação com Zod no cliente e no servidor.
2. Proteção contra spam: campo honeypot oculto + limite de 3 envios por IP a cada 10 minutos.
3. Grava em `encomendas` com status `nova` e cria ou reaproveita o cliente pelo WhatsApp normalizado.
4. Redireciona para `/obrigado` com botão "Continuar no WhatsApp" (mensagem pronta com o número da encomenda).

## SEO e compartilhamento

- `metadata` por página, Open Graph com imagem do produto, `sitemap.xml` e `robots.txt` gerados pelo Next.
- Dados estruturados `Product` (JSON-LD) na página do produto.
- Títulos no formato "{Produto} | Matilda3D".

## Desempenho

- Imagens otimizadas via `next/image`, com `sizes` corretos.
- Meta de Lighthouse ≥ 90 em Performance, Acessibilidade e SEO no mobile.

## Notas da implementação (Fase 7)

- **Cache:** as páginas são estáticas, com dados em `'use cache'` (perfil `minutes`, renova em 1 min). O painel invalida na hora (`updateTag("produtos"/"marca")`) ao salvar, então a mudança costuma aparecer imediatamente.
- **Vitrine:** `/produtos` é estática com todos os produtos; o filtro `?categoria=slug` é aplicado no navegador (esconde os cards de outras categorias). Ficou mais rápida no Lighthouse do que filtrar no servidor.
- **"A partir de R$ X":** não implementado, porque o schema não tem preço por variação (só `cores`). O card mostra o preço ou "Sob consulta".
- **Encomenda na home:** seção com texto, exemplos e botão para `/encomenda` (como neste documento), no lugar do formulário curto da prévia.
- **Número do WhatsApp:** vem de Configurações → Marca (painel); se vazio, de `NEXT_PUBLIC_WHATSAPP_NUMERO`; se os dois estiverem vazios, o link abre o WhatsApp sem destinatário.
- **Limite de envios:** usa a função `consumir_limite_envio` (migração `…_limite_envios.sql`). Enquanto a migração não for aplicada, o formulário funciona sem o limite (honeypot continua ativo) e registra um aviso no log.
- **Animações ao rolar:** componente `src/components/site/revelar.tsx` (docs/02, "Movimento").
- **Foto do hero:** a primeira foto do primeiro produto da vitrine (destaques) que tiver foto; sem nenhuma foto, o `logo-principal.svg` sobre Pérola. Para trocar a foto do hero, mude a ordem dos destaques no painel.
- **Lighthouse (mobile, medido localmente com `next start`):** Acessibilidade 95–96, SEO 100, Boas práticas 100; Performance 89–94 conforme a página e a rodada. Conferir de novo no domínio publicado (Fase 8).
