# 04 — Painel gerencial (/admin)

Acesso apenas para usuários autenticados com perfil `admin` ou `membro` (ver `docs/06`). Layout com menu lateral no desktop e barra inferior com os 5 itens principais no mobile (Início, Vendas, Caixa, Encomendas, Mais).

Todo formulário mostra erros em português ao lado do campo, desabilita o botão durante o envio e exibe um toast de sucesso.

## 1. Dashboard (`/admin`)

Filtro de período no topo: Este mês (padrão), Mês passado, Últimos 3 meses, Este ano, Personalizado.

**Cards de indicadores** (cada um com legenda explicativa curta):

| Indicador | Cálculo | Legenda |
| --- | --- | --- |
| Entradas | Soma dos lançamentos de entrada no período | Todo dinheiro que entrou |
| Saídas | Soma dos lançamentos de saída no período | Tudo o que foi gasto |
| Resultado | Entradas − Saídas | Se positivo, o negócio deu lucro no período |
| Saldo em caixa | Saldo inicial + todas as entradas − todas as saídas, desde o início | Quanto dinheiro vocês têm agora |
| Vendas | Quantidade de vendas não canceladas | Número de pedidos fechados |
| Ticket médio | Valor total das vendas ÷ quantidade | Quanto cada cliente gasta, em média |
| A receber | Soma do saldo pendente das vendas não quitadas | Dinheiro de vendas que ainda não foi pago |

**Gráficos** (Recharts):
- Barras agrupadas: entradas × saídas por mês (últimos 6 meses).
- Linha: evolução do saldo em caixa (últimos 6 meses).
- Rosca: saídas por categoria no período.

**Listas**:
- Top 5 produtos mais vendidos (quantidade e valor).
- Top 5 produtos mais procurados no site (cliques no WhatsApp).
- Encomendas que precisam de atenção (status `nova` ou com data desejada nos próximos 7 dias).
- Últimas 5 vendas.

Botões de ação rápida fixos: "+ Nova venda" e "+ Nova despesa".

## 2. Produtos (`/admin/produtos`)

Lista com busca, filtro por categoria e status (ativo/inativo). Colunas: foto, nome, categoria, preço, custo, margem %, vendidos, ativo, destaque.

Formulário de produto:
- Nome, slug (gerado automaticamente, editável), categoria, descrição curta (até 140 caracteres), descrição completa.
- Preço de venda (pode ficar vazio = "Sob consulta").
- Custo: preenchido manualmente ou importado da calculadora (botão "Calcular custo").
- Gramas de filamento e tempo de impressão (horas e minutos), usados pela calculadora.
- Cores disponíveis (lista de tags).
- Fotos: até 6, upload para o bucket `produtos`, reordenáveis por arrastar, com a primeira como capa. Converter para webp e no máximo 1600px no lado maior antes do upload.
- Ativo (aparece no site) e Destaque (aparece na home).

Ao salvar: `revalidatePath('/')`, `/produtos` e a página do produto.

## 3. Calculadora de preço (`/admin/calculadora`)

Ferramenta educativa, também acessível de dentro do formulário de produto. Usa os valores padrão de `configuracoes`, que podem ser ajustados na tela.

Entradas: gramas de filamento, preço do kg de filamento, tempo de impressão (h/min), custo de energia por hora, custo de desgaste da impressora por hora, custo de embalagem, taxa de falhas (%) e margem desejada (%).

Saídas mostradas passo a passo (ver fórmulas em `docs/06`): custo do material, custo de máquina, custo com perdas, custo total, preço sugerido, lucro por peça e margem real. Botão "Usar este preço no produto".

## 4. Vendas (`/admin/vendas`)

Lista com filtros por período, status de pagamento, canal e forma de pagamento. Totais do filtro no topo. Colunas: número, data, cliente, itens (resumo), total, pago, status, canal.

**Nova venda** (pensada para o celular, em uma única tela):
1. Data (padrão: hoje).
2. Cliente: busca por nome ou WhatsApp, ou "Cliente novo" inline. Opcional ("Venda avulsa").
3. Itens: adicionar produto do catálogo (preço preenchido, editável) ou item livre (descrição + preço). Quantidade com botões − e +. Cor (opcional).
4. Desconto (R$), frete cobrado (R$).
5. Total calculado automaticamente e exibido em destaque.
6. Canal: WhatsApp, Instagram, Presencial, Site, Outro.
7. Pagamento: forma (Pix, Dinheiro, Cartão de crédito, Cartão de débito, Transferência) e valor recebido agora. Status calculado: pago, parcial ou pendente.
8. Observações.
9. Vincular a uma encomenda (opcional; se vier de uma encomenda, já vem preenchido).

**Detalhe da venda**: itens, pagamentos recebidos (pode haver vários), botão "Registrar pagamento" para vendas parciais ou pendentes, botão "Cancelar venda" (exige motivo e gera estorno no caixa, ver `docs/06`), botão "Enviar recibo pelo WhatsApp" (gera a mensagem de texto com os itens e o total).

## 5. Caixa (`/admin/caixa`)

Livro caixa com filtro de período, tipo e categoria. Topo com saldo atual, entradas e saídas do período.

Lista em ordem cronológica decrescente: data, descrição, categoria, valor (verde para entrada, vermelho para saída) e saldo acumulado.

- Entradas geradas por vendas aparecem com um link para a venda e não podem ser editadas diretamente.
- **Nova despesa**: data, descrição, categoria (Filamento, Energia, Manutenção da impressora, Peças e ferramentas, Embalagem, Divulgação, Frete/entrega, Taxas, Outros), valor, forma de pagamento e foto do comprovante opcional (bucket `comprovantes`).
- **Nova entrada avulsa**: aporte, reembolso ou outra entrada que não seja venda.
- Lançamentos manuais podem ser editados por admin. Membros podem editar apenas os próprios lançamentos em até 24 horas.

## 6. Encomendas (`/admin/encomendas`)

Visualização em quadro (kanban) no desktop e em lista agrupada por status no mobile.

Status: Nova → Em conversa → Orçada → Aprovada → Em produção → Pronta → Entregue; ou Cancelada.

Detalhe: dados do cliente, botão "Abrir conversa no WhatsApp", descrição, imagem de referência, quantidade, data desejada, valor orçado, previsão de entrega, notas internas e histórico de mudanças de status (quem mudou e quando).

Ação "Transformar em venda": abre o formulário de nova venda já preenchido. Ao salvar a venda, a encomenda é vinculada.

## 7. Clientes (`/admin/clientes`)

Lista com busca. Colunas: nome, WhatsApp, Instagram, nº de compras, total gasto, última compra. Detalhe com histórico de vendas e encomendas. Botão "Abrir WhatsApp".

## 8. Relatórios e exportação (`/admin/relatorios`)

- Resumo mensal em tabela (entradas, saídas, resultado, saldo, nº de vendas, ticket médio) para os últimos 12 meses.
- Exportar CSV (separador `;`, UTF-8 com BOM para abrir corretamente no Excel) de vendas, itens vendidos e caixa por período.

## 9. Configurações (`/admin/configuracoes`) — somente admin

- Dados da marca: nome, WhatsApp, Instagram, texto "Sobre nós", foto dos criadores.
- Saldo inicial do caixa e data de início.
- Padrões da calculadora: preço do kg de filamento, custo de energia por hora, desgaste por hora, embalagem, taxa de falhas, margem.
- Categorias de produto (criar, renomear, ordenar).
- Usuários: convidar por e-mail, definir perfil (admin/membro), desativar.
