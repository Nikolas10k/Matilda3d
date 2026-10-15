-- Migração 004 — Views para o dashboard (docs/05-banco-de-dados.md)
-- Todas com security_invoker = true, para respeitar o RLS de quem consulta.

create view public.vw_saldo_caixa with (security_invoker = true) as
select
  c.saldo_inicial_centavos
  + coalesce(sum(case when l.tipo = 'entrada' then l.valor_centavos else -l.valor_centavos end), 0)
  as saldo_centavos
from configuracoes c
left join lancamentos l on l.data >= c.data_inicio_caixa
group by c.saldo_inicial_centavos;

create view public.vw_resumo_mensal with (security_invoker = true) as
with caixa as (
  select date_trunc('month', data)::date as mes,
         sum(valor_centavos) filter (where tipo = 'entrada') as entradas,
         sum(valor_centavos) filter (where tipo = 'saida')   as saidas
  from lancamentos group by 1
), vendas_mes as (
  select date_trunc('month', data_venda)::date as mes,
         count(*) as qtd_vendas, sum(total_centavos) as faturamento
  from vendas where not cancelada group by 1
)
select coalesce(c.mes, v.mes) as mes,
       coalesce(c.entradas,0) as entradas_centavos,
       coalesce(c.saidas,0) as saidas_centavos,
       coalesce(c.entradas,0) - coalesce(c.saidas,0) as resultado_centavos,
       coalesce(v.qtd_vendas,0) as qtd_vendas,
       coalesce(v.faturamento,0) as faturamento_centavos,
       case when coalesce(v.qtd_vendas,0) > 0 then round(v.faturamento::numeric / v.qtd_vendas)::int else 0 end
         as ticket_medio_centavos
from caixa c full join vendas_mes v on v.mes = c.mes;

create view public.vw_a_receber with (security_invoker = true) as
select v.id, v.numero, v.data_venda, cl.nome as cliente,
       v.total_centavos, v.pago_centavos, v.total_centavos - v.pago_centavos as aberto_centavos
from vendas v left join clientes cl on cl.id = v.cliente_id
where not v.cancelada and v.status_pagamento <> 'pago';

create view public.vw_produtos_mais_vendidos with (security_invoker = true) as
select i.produto_id, coalesce(p.nome, i.descricao) as nome,
       sum(i.quantidade) as quantidade, sum(i.total_centavos) as total_centavos,
       min(v.data_venda) as primeira_venda, max(v.data_venda) as ultima_venda
from venda_itens i join vendas v on v.id = i.venda_id and not v.cancelada
left join produtos p on p.id = i.produto_id
group by i.produto_id, coalesce(p.nome, i.descricao);

-- Views do painel não são para visitantes (o RLS já bloquearia os dados).
revoke all on public.vw_saldo_caixa, public.vw_resumo_mensal,
  public.vw_a_receber, public.vw_produtos_mais_vendidos from anon;
