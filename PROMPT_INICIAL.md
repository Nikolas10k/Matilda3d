# Prompt inicial — cole no Claude Code

Copie o texto abaixo e cole como primeira mensagem no Claude Code, com esta pasta aberta como diretório do projeto.

---

Você vai desenvolver a aplicação completa da **Matilda3D**, uma marca de produtos impressos em 3D. São duas partes no mesmo projeto Next.js:

1. **Site público**: vitrine de produtos, pedido pelo WhatsApp com mensagem pronta e formulário de encomendas personalizadas.
2. **Painel gerencial (/admin)**: produtos, calculadora de preço, registro de vendas, livro caixa, encomendas, clientes, dashboard financeiro (entradas, saídas, saldo em caixa, lucro, ticket médio, a receber) e exportação CSV.

**Antes de escrever qualquer código:**

1. Leia o `CLAUDE.md` inteiro.
2. Leia todos os arquivos de `docs/` na ordem numérica. Eles são a fonte da verdade: stack, design, telas, schema SQL completo, regras de negócio, permissões e plano de fases.
3. Se houver a pasta `referencia/`, abra a prévia HTML do site e use-a como referência visual do site público.
4. Me responda com:
   - um resumo de 10 linhas do que entendeu;
   - a lista de dúvidas ou ambiguidades que encontrou (não invente respostas);
   - o plano da **Fase 0**.

Espere minha confirmação antes de começar.

**Durante o desenvolvimento:**

- Siga `docs/07-plano-de-execucao.md`, **uma fase por vez**. No início de cada fase, releia os documentos relacionados a ela.
- Dinheiro sempre em centavos (integer), fuso America/Sao_Paulo, interface 100% em português do Brasil.
- Vendas, pagamentos e estornos só pelas funções RPC do banco. Nunca apague vendas nem lançamentos de venda.
- RLS em todas as tabelas. A `service_role key` nunca vai para o navegador.
- Mobile first: teste cada tela em 375px de largura.
- Ao concluir cada fase, rode `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`, confira os critérios de aceite, atualize o "Status do projeto" no `CLAUDE.md`, faça um commit e me mostre um resumo curto do que foi entregue e do que preciso testar.
- Se algo nos documentos estiver contraditório ou faltando, pare e pergunte.

Comece pela leitura e pelo resumo.
