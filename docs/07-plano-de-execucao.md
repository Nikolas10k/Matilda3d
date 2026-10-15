# 07 — Plano de execução

Execute uma fase por vez. Ao fim de cada uma: `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` sem erros, critérios de aceite conferidos e `CLAUDE.md` atualizado. Faça um commit por fase.

## Fase 0 — Setup

- Next.js com TypeScript, Tailwind, ESLint, App Router e pasta `src/`.
- shadcn/ui inicializado com os tokens de `docs/02` (variáveis CSS) e fontes Fredoka + DM Sans via `next/font`.
- Supabase: `@supabase/ssr`, clientes para servidor, navegador e middleware.
- Vitest para testes unitários.
- `src/lib/format.ts` com os formatadores e testes.
- `.env.example` com as variáveis do `CLAUDE.md`.

**Aceite**: projeto roda com `pnpm dev`, testes dos formatadores passam.

## Fase 1 — Banco de dados

- Migrações 001 a 005 de `docs/05`, buckets do Storage e seed.
- Gerar tipos TypeScript.

**Aceite**: migrações aplicam em banco limpo; `registrar_venda` com pagamento cria venda, itens, pagamento e lançamento; `cancelar_venda` gera estorno e o saldo volta ao valor anterior; usuário anônimo não lê vendas, caixa nem clientes.

## Fase 2 — Autenticação e layout do painel

- `/login` (e-mail e senha), recuperação de senha, middleware protegendo `/admin`.
- Usuário sem perfil ativo vê "Acesso não liberado. Fale com a responsável."
- Layout do painel: menu lateral (desktop) e barra inferior (mobile), cabeçalho com nome e papel do usuário.

**Aceite**: membro não vê "Configurações"; rota `/admin/configuracoes` bloqueada para membro inclusive por URL direta.

## Fase 3 — Produtos e calculadora

- CRUD de produtos com upload e ordenação de fotos.
- Calculadora com testes das fórmulas de `docs/06`.

**Aceite**: produto ativo aparece numa consulta pública; inativo não aparece; calculadora bate com os casos de teste.

## Fase 4 — Vendas e caixa

- Nova venda (tela única mobile), lista, detalhe, registrar pagamento, cancelar com estorno, recibo via WhatsApp.
- Livro caixa com despesas, entradas avulsas, saldo acumulado e comprovantes.

**Aceite**: venda parcial → registrar o restante → status "pago" e duas entradas no caixa; cancelamento gera estornos; membro não edita despesa de outro usuário.

## Fase 5 — Dashboard

- Indicadores, gráficos, listas e filtros de período de `docs/04`.
- Relatório mensal e exportação CSV.

**Aceite**: números do dashboard conferem com uma planilha de teste montada a partir do seed; CSV abre no Excel com acentos corretos.

## Fase 6 — Encomendas e clientes

- Kanban/lista, detalhe, histórico, "Transformar em venda".
- Clientes com histórico e totais.

**Aceite**: encomenda criada pelo site aparece como "nova"; mudança de status registra histórico; conversão em venda vincula as duas.

## Fase 7 — Site público

- Todas as rotas de `docs/03`, com o visual da prévia de referência.
- Fluxo do WhatsApp com mensagem pronta e registro de cliques.
- Formulário de encomenda com upload, honeypot e limite de envios.

**Aceite**: Lighthouse mobile ≥ 90 em Performance, Acessibilidade e SEO; mensagem do WhatsApp chega formatada; produto editado no painel aparece atualizado no site em até 1 minuto.

## Fase 8 — Polimento, SEO e deploy

- Sitemap, robots, Open Graph, JSON-LD de produto, página 404 amigável.
- PWA simples para o painel (ícone e "Adicionar à tela inicial").
- Deploy na Vercel conectado ao Supabase de produção; domínio configurado.
- README com instruções de uso para a família (como registrar venda, lançar despesa e ler o dashboard).

**Aceite**: site no ar no domínio; login funcionando em produção; README revisado.
