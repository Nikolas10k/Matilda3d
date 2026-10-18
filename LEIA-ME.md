# Pacote Claude Code — Matilda3D

## Como usar

1. Descompacte esta pasta e abra-a como diretório do projeto (ex.: `cd matilda3d && claude`).
2. Crie um projeto no Supabase e preencha o `.env.local` com base no `CLAUDE.md`.
3. Cole o conteúdo de `PROMPT_INICIAL.md` como primeira mensagem.
4. Aprove fase por fase. A cada fase, o Claude Code roda as verificações e atualiza o `CLAUDE.md`.

## Estrutura

```
CLAUDE.md                        Memória do projeto (lida automaticamente pelo Claude Code)
PROMPT_INICIAL.md                Primeira mensagem para colar
docs/
  01-visao-geral.md              Contexto, usuários, escopo
  02-marca-e-design.md           Identidade aprovada: logo, cores, fontes, regras de uso
  03-site-publico.md             Páginas públicas e fluxo do WhatsApp
  04-painel-admin.md             Todas as telas do painel
  05-banco-de-dados.md           SQL completo: tabelas, RPC, views, RLS, storage
  06-regras-de-negocio.md        Cálculos, status, permissões, validações
  07-plano-de-execucao.md        Fases e critérios de aceite
public/brand/                    Logos (SVG e PNG), símbolo, favicon, ícones, og-image, foto de perfil
referencia/
  identidade-visual-matilda3d.pdf  Apresentação da identidade (usar o conceito B)
  previa-site-matilda3d.html       Prévia da 1ª versão do site (só estrutura; o visual é o do docs/02)
```

## Antes de começar

- Preencha o número do WhatsApp da Matilda3D (`NEXT_PUBLIC_WHATSAPP_NUMERO`).
- Confirme o @ do Instagram (`NEXT_PUBLIC_INSTAGRAM_USUARIO`, hoje `matildaimpressao3d`).
- `public/brand/perfil-instagram.png` já serve como foto de perfil do Instagram.
