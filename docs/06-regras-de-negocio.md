# 06 — Regras de negócio

## Dinheiro

- Tudo em centavos (integer). Conversão de texto digitado: `"12,50"` → `1250`; aceitar `"12"`, `"12,5"`, `"1.234,56"`.
- Arredondamento: sempre `Math.round` no último passo do cálculo, nunca no meio.
- Inputs monetários com máscara brasileira e teclado numérico no celular (`inputMode="decimal"`).

## Venda

- Total = soma dos itens − desconto + frete. Não pode ficar negativo.
- Status de pagamento é calculado, nunca digitado:
  - `pendente`: nada pago.
  - `parcial`: pago > 0 e < total.
  - `pago`: pago ≥ total.
- Pagamento nunca pode exceder o valor em aberto.
- Cada pagamento gera **um** lançamento de entrada no caixa, com categoria "Venda" e link para a venda.
- O custo unitário do produto é copiado para o item no momento da venda (para calcular lucro histórico mesmo se o custo mudar depois).
- Venda não é apagada. Cancelamento exige motivo e gera um lançamento de **saída** "Estorno de venda" para cada entrada já recebida. A venda cancelada some dos indicadores de vendas, mas os lançamentos (entrada + estorno) continuam no caixa, se anulando.
- Edição de venda após salvar: apenas observações e cliente. Para corrigir itens ou valores, cancelar e lançar de novo (o painel oferece "Cancelar e duplicar").

## Caixa

- Saldo em caixa = saldo inicial (configurações) + entradas − saídas, a partir da data de início do caixa.
- Entradas vindas de venda e estornos não podem ser editados nem apagados diretamente.
- Despesas lançadas por membro podem ser editadas por ele mesmo em até 24 horas; depois disso, só por admin.
- Categorias de saída: Filamento, Energia, Manutenção da impressora, Peças e ferramentas, Embalagem, Divulgação, Frete/entrega, Taxas, Estorno de venda (automática), Outros.
- Categorias de entrada: Venda (automática), Aporte, Reembolso, Outros.

## Indicadores

- Resultado do período = entradas − saídas do período (regime de caixa).
- Ticket médio = faturamento das vendas não canceladas ÷ quantidade.
- Lucro bruto estimado das vendas = soma de (preço − custo unitário) × quantidade dos itens com custo conhecido. Mostrar aviso quando houver itens sem custo cadastrado ("X itens sem custo: o lucro pode estar maior do que o real").
- Margem real = lucro ÷ preço de venda.

## Calculadora de preço (por peça)

```
custo_material   = gramas × (preco_kg_filamento ÷ 1000)
horas            = minutos_impressao ÷ 60
custo_maquina    = horas × (custo_energia_hora + desgaste_hora)
custo_producao   = (custo_material + custo_maquina) × (1 + taxa_falhas ÷ 100)
custo_total      = custo_producao + embalagem
preco_sugerido   = custo_total × (1 + margem ÷ 100)   → arredondar para cima até o próximo R$ 0,50
lucro_por_peca   = preco_sugerido − custo_total
margem_real      = lucro_por_peca ÷ preco_sugerido
```

Exibir cada linha com uma explicação simples (ex.: "Taxa de falhas: algumas impressões dão errado, então a gente reserva um pouco para cobrir o filamento perdido").

Escrever testes unitários para essas fórmulas com casos conhecidos.

## Encomendas

- Fluxo de status: `nova → em_conversa → orcada → aprovada → em_producao → pronta → entregue`; `cancelada` pode vir de qualquer status antes de `entregue`.
- Toda mudança de status é registrada no histórico (gatilho no banco).
- "Transformar em venda" só aparece a partir de `aprovada`. Ao salvar a venda, a encomenda guarda o `venda_id`.
- Destaque visual para encomendas com data desejada em até 7 dias e para as que estão em `nova` há mais de 24 horas.

## Clientes

- WhatsApp normalizado: só dígitos, com DDI 55. `(61) 99999-9999` → `5561999999999`. É a chave para evitar clientes duplicados.
- Ao receber encomenda do site, procurar cliente pelo WhatsApp; se não existir, criar.

## Permissões

| Ação | Admin | Membro |
| --- | --- | --- |
| Ver dashboard, vendas, caixa, encomendas, clientes | Sim | Sim |
| Cadastrar e editar produtos | Sim | Sim |
| Excluir produto (preferir desativar) | Sim | Não |
| Registrar venda e pagamento | Sim | Sim |
| Cancelar venda | Sim | Sim (com motivo) |
| Lançar despesa ou entrada avulsa | Sim | Sim |
| Editar lançamento manual | Sempre | Só o próprio, até 24 h |
| Excluir lançamento manual | Sim | Não |
| Configurações, usuários e saldo inicial | Sim | Não |
| Exportar CSV | Sim | Sim |

As permissões são garantidas no banco (RLS e RPC). A interface apenas esconde o que o usuário não pode fazer.

## Validações de formulário (mensagens)

- Campo obrigatório: "Preencha este campo."
- WhatsApp inválido: "Digite um WhatsApp com DDD, ex.: (61) 99999-9999."
- Valor inválido: "Digite um valor válido, ex.: 25,90."
- Pagamento maior que o aberto: "O valor é maior do que falta pagar (R$ X)."
- Data no passado (encomenda): "Escolha uma data a partir de hoje."
