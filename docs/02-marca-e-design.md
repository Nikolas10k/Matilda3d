# 02 — Marca e design

> Identidade visual **aprovada**: conceito B, "Casinhas". Use exatamente os valores abaixo. Todos os arquivos de marca já estão em `public/brand/`. Não redesenhe o logo e não use outro arquivo de logo.
>
> **Implementação:** com Tailwind v4 não há `tailwind.config`; todos os tokens ficam em `src/app/globals.css` (variáveis `--m3d-*` + bloco `@theme`). Nomes no Tailwind: Grafite `ink`, `ink-soft`, Pedra `ink-muted`, Névoa `surface`, Pérola `surface-strong`, Concreto `line`, e `success`/`danger`/`warning`. O logo é renderizado pelo componente `src/components/marca/logo.tsx`, que só aponta para os SVGs de `public/brand/`.

## Conceito

Um monograma "m" formado por dois telhados: duas casinhas lado a lado, que ligam a marca às peças para casa. O traço é único e fino, apoiado numa linha de base que lembra uma camada de impressão, com um ponto em cima que lembra o bico da impressora. O estilo é minimalista, delicado e neutro, para que as cores das peças impressas se destaquem nas fotos.

## Arquivos de marca (`public/brand/`)

| Arquivo | Uso |
| --- | --- |
| `logo-principal.svg` / `.png` | Logo empilhado (símbolo + MATILDA + IMPRESSÃO 3D) em grafite. Hero, rodapé, página Sobre |
| `logo-principal-branco.svg` / `.png` | Mesmo logo em branco, para fundos grafite |
| `logo-horizontal.svg` / `.png` | Símbolo à esquerda + nome. **Header do site** e topo do painel |
| `logo-horizontal-branco.svg` / `.png` | Versão branca do horizontal |
| `simbolo.svg` / `.png` | Só o símbolo, em grafite. Elementos decorativos, estados vazios, loading |
| `simbolo-branco.svg` / `.png` | Símbolo em branco |
| `favicon.svg`, `favicon.ico` | Favicon (traço mais grosso, legível em tamanho pequeno) |
| `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` | Ícones do PWA e do iOS (fundo Névoa) |
| `og-image.png` | Imagem de compartilhamento (Open Graph), 1200×630 |
| `perfil-instagram.png` | Foto de perfil do Instagram, 1080×1080 |

Regras de uso do logo:
- Use `next/image` ou `<img>` apontando para os SVGs. Não recrie o logo em código e não troque a fonte do nome.
- Área de respiro mínima ao redor do logo: a altura do ponto do símbolo multiplicada por 4.
- Tamanho mínimo: horizontal com 120px de largura; símbolo sozinho com 24px.
- Só use o logo grafite em fundos claros (Branco, Névoa, Pérola) e o branco sobre Grafite. Nunca sobre fotos sem uma faixa de fundo.
- `alt="Matilda3D"` no logo do header, que também é link para `/`.

**Na implementação:** `src/app/icon.svg` (cópia de `favicon.svg`), `src/app/apple-icon.png` (cópia de `apple-touch-icon.png`) e `src/app/opengraph-image.png` (cópia de `og-image.png`) são servidos pelas convenções de metadata do Next. O `favicon.ico` fica em `public/` (o Turbopack recusa esse `.ico` em `src/app` porque o PNG interno não é RGBA). O manifesto (`src/app/manifest.ts`) usa `icon-192.png` e `icon-512.png`; o símbolo cabe na área segura de 80%, então o 512 também serve como `maskable`. No header, o logo horizontal tem 38px de altura no celular (123px de largura, para respeitar o mínimo de 120px) e 40px no desktop.

## Tokens de cor

| Token | Nome | Valor | Uso |
| --- | --- | --- | --- |
| `--background` | Branco | `#FFFFFF` | Fundo de cards, inputs, embalagens |
| `--surface` | Névoa | `#F4F3F1` | Fundo principal do site, seções e posts |
| `--surface-strong` | Pérola | `#E6E4E0` | Cards secundários, bordas, separadores, placeholders de foto |
| `--line` | Concreto | `#A8A5A0` | Linhas finas, ícones decorativos. **Nunca em texto** (contraste insuficiente) |
| `--muted` | Pedra | `#6B6964` | Textos de apoio, legendas, labels |
| `--ink` | Grafite | `#2F2F31` | Logo, títulos, textos principais, botões primários |
| `--ink-soft` | — | `#4A4946` | Parágrafos longos (um pouco mais suave que o grafite) |

Proporção de uso sugerida: Névoa 40%, Branco 25%, Pérola 15%, Grafite 10%, Pedra 5%, Concreto 5%.

**Não existe cor de destaque.** A marca é neutra. Os destaques são feitos com peso tipográfico, espaço e contraste grafite × névoa. Botões de WhatsApp também são **grafite com texto branco** e ícone do WhatsApp em traço; não use verde.

**Contraste (conferido na implementação):** Pedra sobre Pérola fica em 4,3:1 e **não passa** AA em texto pequeno. Sobre Pérola, use Grafite ou `--ink-soft`; Pedra só sobre Branco ou Névoa. A borda dos inputs (`--input`) é `#CFCCC6`, um tom acima da Pérola, para o campo aparecer sobre o branco.

### Cores de estado (somente no painel)

Discretas, para não brigar com a marca:

| Token | Valor | Uso |
| --- | --- | --- |
| `--success` | `#3F6B4E` | Entradas, "pago" |
| `--danger` | `#9B3B3B` | Saídas, "cancelada", valores negativos |
| `--warning` | `#8A6A2F` | "Pendente", "parcial" |

Use-as com fundo claro do mesmo tom (ex.: badge com fundo `#EEF3EF` e texto `--success`). Nunca dependa só da cor: inclua sempre o texto ("Pago", "Pendente") ou o sinal (+ / −).

## Tipografia

| Papel | Fonte | Pesos | Observação |
| --- | --- | --- | --- |
| Títulos e destaques | **Jost** | 300 (Light), 400, 500 | Títulos grandes em 300; labels em 500, MAIÚSCULAS, `letter-spacing: 0.2em–0.3em` |
| Textos, botões e painel | **DM Sans** | 400, 500, 700 | Corpo 16px, `line-height` 1.6 |
| Números do painel | DM Sans | 500 | `font-variant-numeric: tabular-nums` |

Carregue as duas com `next/font/google` (`Jost` e `DM_Sans`) e exponha como variáveis CSS (`--font-display` e `--font-sans`). *(Implementação: as variáveis do `next/font` são `--font-jost` e `--font-dm-sans`, mapeadas para `font-heading` e `font-sans` no Tailwind. O label da marca é a utilidade `rotulo`.)*

Escala sugerida: H1 56–64px Jost 300 (mobile 40px) · H2 40px Jost 300 · H3 24px Jost 400 · label 12px Jost 500 maiúsculas com `letter-spacing` 0.25em · corpo 16px DM Sans · legenda 13px DM Sans Pedra.

## Forma, espaço e ícones

- Raio: cards 20px, imagens de produto 16px, inputs 12px, botões totalmente arredondados (pill).
- Bordas finas de 1px em Pérola. Sem sombras pesadas: no máximo `0 1px 2px rgb(47 47 49 / 0.06)`.
- Muito respiro: seções com 96px de espaço vertical no desktop e 64px no mobile.
- Ícones: lucide-react, `strokeWidth={1.5}`, cor Grafite ou Pedra. Sem emojis na interface.
- Placeholders de foto: fundo Pérola com o símbolo em Concreto centralizado. *(Implementação: `SimboloPlaceholder` em `src/components/site/blocos.tsx` usa `simbolo.svg` com opacidade reduzida, sem redesenhar o símbolo.)*

## Movimento (site público)

O conteúdo aparece conforme a pessoa rola a página, com um movimento curto e discreto, para dar acabamento profissional sem distrair.

- **Entrada padrão:** o elemento sobe 20px e passa de transparente a visível em 600ms, com curva `cubic-bezier(0.22, 1, 0.36, 1)`.
- **Sequência:** em grades e listas (cards da vitrine, passos de "Como encomendar"), os itens entram um após o outro, com 80ms de intervalo. O título da seção entra antes do conteúdo.
- **Gatilho:** quando cerca de 15% do elemento entra na tela. Anima só uma vez (não some ao rolar de volta).
- **Hero:** o texto do hero já carrega visível (não pode atrasar o LCP). No máximo uma entrada leve em CSS na imagem.
- **Microinterações:** cards sobem 2px e a borda escurece para Concreto no hover (sem sombra pesada); botões têm transição de cor de 150–200ms.
- **Acessibilidade:** com `prefers-reduced-motion: reduce`, nada se move e tudo aparece direto. Sem JavaScript, todo o conteúdo fica visível.
- **Implementação:** componente próprio `<Revelar>` com IntersectionObserver + transições CSS, sem biblioteca de animação (para manter o Lighthouse ≥ 90). Tokens em `src/app/globals.css` (bloco "Movimento").
- **Painel:** sem animações de rolagem; apenas transições curtas de estado.

## Gráficos (painel)

- **Entradas** `#3366A3` (azul-ardósia) e **saídas** `#A85A32` (terracota). O par foi validado para daltonismo sobre Branco e Névoa (validador da skill de visualização de dados: ΔE 17,7 no pior caso). O par verde `--success` × vermelho `--danger` **falha** para deuteranopia (ΔE 3,7) e não deve ser usado lado a lado em gráficos.
- **Saldo** (série única): Grafite `#2F2F31`, linha de 2px com área a 10%, marcador só no ponto atual.
- Barras com no máximo 24px de espessura e ponta arredondada de 4px; grade em linha fina sólida Pérola; eixos em Pedra; sem animação.
- Todo gráfico tem legenda com texto (2+ séries), dica ao passar o mouse/dedo e uma tabela equivalente ("Ver em tabela").
- Números grandes dos cartões usam algarismos proporcionais; `tabular-nums` só em colunas e tabelas.

## Tom de voz

- Site: calmo, próximo e delicado. Frases curtas. Ex.: "Chaveiros e peças para casa, feitos camada por camada."
- Painel: claro e educativo, adequado a jovens. Ex.: "Saldo em caixa: quanto dinheiro vocês têm agora, somando tudo o que entrou e tirando o que saiu."

## Referências

- `referencia/identidade-visual-matilda3d.pdf`: apresentação da identidade. **Use o conceito B** (páginas 1, 3, 4, 5 e as aplicações do conceito B na página 6). O conceito A foi descartado.
- `referencia/previa-site-matilda3d.html`: prévia da primeira versão do site, feita com a identidade provisória. Vale só como referência de **estrutura** (seções e hierarquia); cores, fontes e logo seguem este documento.
- Layout do site público: siga as seções descritas em `docs/03`, aplicando esta identidade.
