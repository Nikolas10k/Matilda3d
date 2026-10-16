# 02 — Marca e design

> A identidade visual definitiva ainda está sendo criada. Use os valores abaixo como **tokens provisórios**, centralizados em um único lugar (variáveis CSS + `tailwind.config`), para que a troca depois seja feita em um só arquivo.
>
> **Implementação:** com Tailwind v4 não há `tailwind.config`; todos os tokens ficam em `src/app/globals.css` (variáveis `--m3d-*` + bloco `@theme`). No Tailwind, `--accent*` virou `brand`, `brand-strong` e `brand-soft`, e `--ink`/`--muted` viraram `ink`/`ink-muted`, para não conflitar com os tokens do shadcn/ui.

## Tokens de cor (provisórios)

| Token | Valor | Uso |
| --- | --- | --- |
| `--ink` | `#1E1B33` | Texto principal, botões primários, fundo escuro |
| `--muted` | `#4A4660` | Texto secundário |
| `--accent` | `#FF6A3D` | Destaques, logo "3D", números de passos |
| `--accent-strong` | `#C2410C` | Texto em destaque sobre fundo claro (contraste AA) |
| `--accent-soft` | `#FFF4EE` | Fundos de seção e badges |
| `--whatsapp` | `#1F7A47` | Botões de WhatsApp (texto branco) |
| `--surface-alt` | `#F6F4FB` | Seções alternadas |
| `--border` | `#ECE9F3` | Bordas de cards |
| `--success` | `#15803D` | Valores positivos, "pago" |
| `--danger` | `#B91C1C` | Saídas, valores negativos, "cancelado" |
| `--warning` | `#B45309` | "Pendente" |

Nunca use branco sobre `--accent` em texto pequeno (contraste insuficiente). Use `--ink` sobre `--accent`.

## Tipografia

- Títulos: **Fredoka** (600/700), via `next/font/google`.
- Texto: **DM Sans** (400/500/700), via `next/font/google`.
- Números financeiros no painel: DM Sans com `font-variant-numeric: tabular-nums`.

## Forma e espaçamento

- Raio: cards 22px, botões totalmente arredondados (pill), inputs 12px.
- Espaçamento base de 4px; seções do site com 80px de respiro vertical no desktop e 56px no mobile.
- Ícones: lucide-react, traço 2px. Sem emojis na interface.

## Movimento (site público)

O conteúdo aparece conforme a pessoa rola a página, com um movimento curto e discreto, para dar acabamento profissional sem distrair.

- **Entrada padrão:** o elemento sobe 20px e passa de transparente a visível em 600ms, com curva `cubic-bezier(0.22, 1, 0.36, 1)`.
- **Sequência:** em grades e listas (cards da vitrine, passos de "Como encomendar"), os itens entram um após o outro, com 80ms de intervalo. O título da seção entra antes do conteúdo.
- **Gatilho:** quando cerca de 15% do elemento entra na tela. Anima só uma vez (não some ao rolar de volta).
- **Hero:** o texto do hero já carrega visível (não pode atrasar o LCP). No máximo uma entrada leve em CSS na ilustração.
- **Microinterações:** cards sobem 2–4px e ganham sombra suave no hover; botões têm transição de cor de 150–200ms.
- **Acessibilidade:** com `prefers-reduced-motion: reduce`, nada se move e tudo aparece direto. Sem JavaScript, todo o conteúdo fica visível.
- **Implementação:** componente próprio `<Reveal>` com IntersectionObserver + transições CSS, sem biblioteca de animação (para manter o Lighthouse ≥ 90). Tokens em `src/app/globals.css` (bloco "Movimento").
- **Painel:** sem animações de rolagem; apenas transições curtas de estado.

## Gráficos (painel)

- **Entradas** `#1F7A47` e **saídas** `#C2410C`. O par foi validado para daltonismo (validador da skill de visualização de dados); o par verde `--success` × vermelho `--danger` **falha** para deuteranopia (ΔE 4,2) e não deve ser usado lado a lado em gráficos.
- **Saldo** (série única): `--ink` `#1E1B33`, linha de 2px com área a 10%, marcador só no ponto atual.
- Barras com no máximo 24px de espessura e ponta arredondada de 4px; grade em linha fina sólida `--border`; sem animação.
- Todo gráfico tem legenda com texto (2+ séries), dica ao passar o mouse/dedo e uma tabela equivalente ("Ver em tabela").
- Números grandes dos cartões usam algarismos proporcionais; `tabular-nums` só em colunas e tabelas.

## Tom de voz

- Site: próximo, alegre e confiante. Frases curtas. Ex.: "Ideias que saem da impressora direto pra sua mão."
- Painel: claro e educativo. Ex.: "Saldo em caixa: quanto dinheiro vocês têm agora, somando tudo o que entrou e tirando o que saiu."

## Referência visual

Existe uma prévia aprovada da página inicial (arquivo `referencia/previa-site-matilda3d.html`, se fornecido). Use-a como referência de layout, hierarquia e estilo do site público.
