# Prompt inicial — cole no Claude Code

Abra esta pasta como diretório do projeto e cole o texto abaixo como primeira mensagem.

---

Você vai desenvolver a aplicação completa da **Matilda3D**, uma marca de chaveiros e peças para casa impressas em 3D. São duas partes no mesmo projeto Next.js:

1. **Site público**: vitrine de produtos, pedido pelo WhatsApp com mensagem pronta e formulário de encomendas personalizadas.
2. **Painel gerencial (/admin)**: produtos, calculadora de preço, registro de vendas, livro caixa, encomendas, clientes, dashboard financeiro (entradas, saídas, saldo em caixa, lucro, ticket médio, a receber) e exportação CSV.

**A identidade visual já está aprovada e os arquivos de marca estão prontos em `public/brand/`** (logo principal, logo horizontal, versões brancas, símbolo, favicon, ícones do PWA, imagem de Open Graph). Use esses arquivos como estão. Não recrie o logo em código, não invente cores e não use cor de destaque: a paleta é neutra (Névoa, Branco, Pérola, Concreto, Pedra e Grafite), com as fontes Jost e DM Sans, tudo especificado em `docs/02-marca-e-design.md`.

**Antes de escrever qualquer código:**

1. Leia o `CLAUDE.md` inteiro.
2. Leia todos os arquivos de `docs/` na ordem numérica. Eles são a fonte da verdade: stack, identidade visual, telas, schema SQL completo, regras de negócio, permissões e plano de fases.
3. Abra os arquivos de `public/brand/` (pelo menos `logo-horizontal.svg`, `logo-principal.svg` e `simbolo.svg`) e a apresentação `referencia/identidade-visual-matilda3d.pdf`. Use somente o **conceito B, "Casinhas"**; o conceito A foi descartado.
4. Me responda com:
   - um resumo de 10 linhas do que entendeu, incluindo como vai aplicar a identidade visual;
   - a lista de dúvidas ou ambiguidades que encontrou (não invente respostas);
   - o plano da **Fase 0**.

Espere minha confirmação antes de começar.

**Durante o desenvolvimento:**

- Siga `docs/07-plano-de-execucao.md`, **uma fase por vez**. No início de cada fase, releia os documentos relacionados a ela.
- Na Fase 0, configure os tokens de cor como variáveis CSS do tema do shadcn/ui, carregue Jost e DM Sans com `next/font` e ligue favicon, ícones e Open Graph a partir de `public/brand/`.
- Dinheiro sempre em centavos (integer), fuso America/Sao_Paulo, interface 100% em português do Brasil.
- Vendas, pagamentos e estornos só pelas funções RPC do banco. Nunca apague vendas nem lançamentos de venda.
- RLS em todas as tabelas. A `service_role key` nunca vai para o navegador.
- Mobile first: teste cada tela em 375px de largura. Contraste AA: nunca use Concreto (`#A8A5A0`) em texto.
- Ao concluir cada fase, rode `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`, confira os critérios de aceite, atualize o "Status do projeto" no `CLAUDE.md`, faça um commit e me mostre um resumo curto do que foi entregue e do que preciso testar.
- Se algo nos documentos estiver contraditório ou faltando, pare e pergunte.

Comece pela leitura e pelo resumo.
