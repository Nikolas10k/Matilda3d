# Pacote Claude Code — Matilda3D

## Como usar

1. Descompacte esta pasta e abra-a como diretório do projeto (ex.: `cd matilda3d && claude`).
2. Coloque a prévia do site em `referencia/previa-site-matilda3d.html` (já incluída).
3. Crie um projeto no Supabase e preencha o `.env.local` com base no `CLAUDE.md`.
4. Cole o conteúdo de `PROMPT_INICIAL.md` como primeira mensagem.
5. Aprove fase por fase. A cada fase, o Claude Code roda as verificações e atualiza o `CLAUDE.md`.

## Estrutura

```
CLAUDE.md                      Memória do projeto (lida automaticamente pelo Claude Code)
PROMPT_INICIAL.md              Primeira mensagem para colar
docs/
  01-visao-geral.md            Contexto, usuários, escopo
  02-marca-e-design.md         Tokens de cor, fontes, tom de voz
  03-site-publico.md           Páginas públicas e fluxo do WhatsApp
  04-painel-admin.md           Todas as telas do painel
  05-banco-de-dados.md         SQL completo: tabelas, RPC, views, RLS, storage
  06-regras-de-negocio.md      Cálculos, status, permissões, validações
  07-plano-de-execucao.md      Fases e critérios de aceite
referencia/
  previa-site-matilda3d.html   Prévia visual aprovada do site
```

## O que preencher antes de começar

- Número do WhatsApp da Matilda3D (`NEXT_PUBLIC_WHATSAPP_NUMERO`).
- @ do Instagram, se for diferente de `matilda3d`.
- Quando a identidade visual final estiver pronta, atualize `docs/02-marca-e-design.md` e peça ao Claude Code para aplicar os novos tokens.
