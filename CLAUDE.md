# CLAUDE.md — Projeto Matilda3D

Este arquivo é a memória do projeto. Leia-o inteiro antes de qualquer tarefa e consulte os documentos em `docs/` sempre que for implementar algo. Em caso de dúvida, os documentos em `docs/` são a fonte da verdade. Se algo não estiver especificado, pergunte antes de inventar.

## O que é o projeto

A Matilda3D é uma marca de produtos impressos em 3D criada por jovens empreendedores (menores de idade), **Maria Clara e Tharik**, sob responsabilidade da mãe, Karem. O projeto é desenvolvido pela Givance Tech. No site público, cite os criadores só pelo primeiro nome (sem sobrenome, idade, escola ou cidade) salvo autorização da Karem.

A aplicação tem duas partes:

1. **Site público**: vitrine de produtos, pedido pelo WhatsApp e formulário de encomendas personalizadas.
2. **Painel gerencial (/admin)**: cadastro de produtos, registro de vendas, livro caixa, encomendas, clientes, calculadora de preço e dashboard financeiro.

## Stack obrigatória

- Next.js (App Router, versão estável mais recente) + TypeScript (strict)
- Tailwind CSS + shadcn/ui
- Supabase: Postgres, Auth, Storage e Row Level Security
- Validação com Zod; formulários com React Hook Form
- Gráficos com Recharts
- Deploy na Vercel
- Gerenciador de pacotes: pnpm

## Mapa da documentação (leia antes de implementar)

| Arquivo | Quando consultar |
| --- | --- |
| `docs/01-visao-geral.md` | Contexto, público, objetivos, escopo e fora de escopo |
| `docs/02-marca-e-design.md` | Cores, fontes, tom de voz, componentes visuais |
| `docs/03-site-publico.md` | Todas as páginas públicas e o fluxo do WhatsApp |
| `docs/04-painel-admin.md` | Todas as telas do painel, campos e comportamentos |
| `docs/05-banco-de-dados.md` | Schema SQL completo, RLS, views e seeds |
| `docs/06-regras-de-negocio.md` | Cálculos financeiros, status, permissões e validações |
| `docs/07-plano-de-execucao.md` | Ordem das fases e critérios de aceite de cada uma |

## Regras inegociáveis

1. **Dinheiro sempre em centavos (integer)** no banco e na lógica. Nunca use float para valores monetários. Formate só na exibição com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
2. **Fuso horário America/Sao_Paulo** em todas as datas exibidas e nos agrupamentos por mês e dia.
3. **Toda a interface em português do Brasil**, inclusive mensagens de erro, validações e e-mails.
4. **RLS ativado em todas as tabelas.** Nenhuma tabela fica acessível sem política explícita.
5. **Segredos só em variáveis de ambiente.** Nunca commitar `.env*`. A `service_role key` nunca vai para o cliente.
6. **Operações financeiras em transação** (venda + lançamento de caixa). Use funções SQL (RPC) para garantir atomicidade.
7. **Nada é apagado de verdade em vendas e caixa.** Use cancelamento e estorno (ver `docs/06`).
8. **Dados mínimos de clientes (LGPD)**: nome, WhatsApp e Instagram opcional. Não coletar CPF, endereço completo nem data de nascimento.
9. **Mobile first.** O painel será muito usado no celular. Todas as telas devem funcionar bem em 375px de largura.
10. **Acessibilidade básica**: contraste AA, labels em todos os inputs, alvos de toque ≥ 44px, navegação por teclado.

## Convenções de código

- Estrutura: `src/app` (rotas), `src/components` (UI), `src/lib` (supabase, utils, formatters), `src/server` (actions e queries), `src/types`.
- Server Actions para mutações; leitura com Server Components sempre que possível.
- Nomes de tabelas e colunas em português, snake_case (ex.: `vendas`, `valor_total_centavos`).
- Componentes em PascalCase; funções e variáveis em camelCase.
- Funções utilitárias obrigatórias em `src/lib/format.ts`: `formatarMoeda(centavos)`, `paraCentavos(texto)`, `formatarData(date)`, `formatarWhatsApp(numero)`.
- Commits pequenos e descritivos em português.

### Particularidades da versão instalada (Next.js 16.4)

- Leia o guia em `node_modules/next/dist/docs/` antes de usar uma API do Next (ver `AGENTS.md`).
- `middleware.ts` foi renomeado para **`src/proxy.ts`** (função `proxy`). A renovação de sessão do Supabase e o bloqueio de `/admin` ficam lá, via `src/lib/supabase/proxy.ts`.
- **`cacheComponents` está ativo.** Leituras de `cookies()`/sessão precisam ficar dentro de `<Suspense>`. Em vez de `export const revalidate = 60` (citado no `docs/03`), use `'use cache'` + `cacheLife` + `cacheTag`, e `revalidatePath`/`updateTag` ao salvar no painel.
- Clientes Supabase: `src/lib/supabase/client.ts` (navegador), `server.ts` (servidor com sessão), `admin.ts` (service_role, só servidor, ignora RLS).
- Tokens de design só em `src/app/globals.css` (Tailwind v4, sem `tailwind.config`). Ver `docs/02`.

## Fluxo de trabalho esperado

1. Antes de cada fase, leia o documento correspondente e apresente um plano curto.
2. Implemente uma fase por vez, seguindo `docs/07-plano-de-execucao.md`.
3. Ao terminar uma fase, rode `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`, e confira os critérios de aceite.
4. Atualize a seção "Status do projeto" abaixo ao final de cada fase.

## Variáveis de ambiente

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # só no servidor
NEXT_PUBLIC_WHATSAPP_NUMERO=      # formato 55DDDNUMERO, ex.: 5561999999999
NEXT_PUBLIC_INSTAGRAM_USUARIO=matilda3d
NEXT_PUBLIC_SITE_URL=https://matilda3d.com.br
```

## Status do projeto

- [x] Fase 0 — Setup (Next.js 16.4, Tailwind v4, shadcn/ui, clientes Supabase, Vitest, formatadores com testes)
- [ ] Fase 1 — Banco de dados
- [ ] Fase 2 — Autenticação e layout do painel
- [ ] Fase 3 — Produtos e calculadora
- [ ] Fase 4 — Vendas e caixa
- [ ] Fase 5 — Dashboard
- [ ] Fase 6 — Encomendas e clientes
- [ ] Fase 7 — Site público
- [ ] Fase 8 — Polimento, SEO e deploy
