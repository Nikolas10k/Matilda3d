-- Migração 003 — Funções de negócio (RPC) (docs/05-banco-de-dados.md)
-- Vendas, pagamentos e estornos só são criados por estas funções, que rodam
-- numa única transação: venda e caixa ficam sempre consistentes.

-- Recalcula pago e status de uma venda
create or replace function public.recalcular_venda(p_venda uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_pago int; v_total int;
begin
  select coalesce(sum(valor_centavos),0) into v_pago from venda_pagamentos where venda_id = p_venda;
  select total_centavos into v_total from vendas where id = p_venda;
  update vendas set
    pago_centavos = v_pago,
    status_pagamento = case when v_pago = 0 then 'pendente'
                            when v_pago >= v_total then 'pago' else 'parcial' end
  where id = p_venda;
end $$;

-- Registra um pagamento e o lançamento de entrada correspondente
create or replace function public.registrar_pagamento(
  p_venda uuid, p_valor int, p_forma text, p_data date default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_venda vendas; v_lanc uuid; v_pag uuid; v_data date;
begin
  if not eh_equipe() then raise exception 'Acesso negado'; end if;
  select * into v_venda from vendas where id = p_venda for update;
  if v_venda.id is null then raise exception 'Venda não encontrada'; end if;
  if v_venda.cancelada then raise exception 'Venda cancelada não recebe pagamento'; end if;
  if p_valor is null or p_valor <= 0 then raise exception 'Valor deve ser maior que zero'; end if;
  if p_forma is null then raise exception 'Informe a forma de pagamento'; end if;
  if v_venda.pago_centavos + p_valor > v_venda.total_centavos then
    raise exception 'Pagamento maior que o valor em aberto';
  end if;
  v_data := coalesce(p_data, (now() at time zone 'America/Sao_Paulo')::date);

  insert into lancamentos (data, tipo, categoria, descricao, valor_centavos, forma_pagamento, venda_id, criado_por)
  values (v_data, 'entrada', 'Venda', 'Venda #' || v_venda.numero, p_valor, p_forma, p_venda, auth.uid())
  returning id into v_lanc;

  insert into venda_pagamentos (venda_id, data, forma, valor_centavos, lancamento_id)
  values (p_venda, v_data, p_forma, p_valor, v_lanc) returning id into v_pag;

  perform recalcular_venda(p_venda);
  return v_pag;
end $$;

-- Cria venda completa. p_itens: [{"produto_id":uuid|null,"descricao":text,"cor":text|null,
--   "quantidade":int,"preco_unitario_centavos":int}]
create or replace function public.registrar_venda(
  p_data date, p_cliente uuid, p_canal text, p_itens jsonb,
  p_desconto int default 0, p_frete int default 0,
  p_valor_pago int default 0, p_forma text default null,
  p_encomenda uuid default null, p_observacoes text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_sub int; v_total int; i jsonb;
begin
  if not eh_equipe() then raise exception 'Acesso negado'; end if;
  if jsonb_typeof(p_itens) is distinct from 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Inclua pelo menos um item';
  end if;
  if p_encomenda is not null and exists (
    select 1 from encomendas e join vendas v on v.id = e.venda_id
    where e.id = p_encomenda and not v.cancelada
  ) then
    raise exception 'Esta encomenda já está vinculada a outra venda';
  end if;

  insert into vendas (data_venda, cliente_id, canal, desconto_centavos, frete_centavos,
                      encomenda_id, observacoes, criado_por)
  values (coalesce(p_data, (now() at time zone 'America/Sao_Paulo')::date), p_cliente, p_canal,
          coalesce(p_desconto,0), coalesce(p_frete,0), p_encomenda, p_observacoes, auth.uid())
  returning id into v_id;

  for i in select * from jsonb_array_elements(p_itens) loop
    if coalesce(trim(i->>'descricao'),'') = '' then raise exception 'Todo item precisa de descrição'; end if;
    insert into venda_itens (venda_id, produto_id, descricao, cor, quantidade,
                             preco_unitario_centavos, custo_unitario_centavos)
    values (v_id, nullif(i->>'produto_id','')::uuid, i->>'descricao', nullif(i->>'cor',''),
            (i->>'quantidade')::int, (i->>'preco_unitario_centavos')::int,
            (select custo_centavos from produtos where id = nullif(i->>'produto_id','')::uuid));
  end loop;

  select sum(total_centavos) into v_sub from venda_itens where venda_id = v_id;
  v_total := v_sub - coalesce(p_desconto,0) + coalesce(p_frete,0);
  if v_total < 0 then raise exception 'Desconto maior que o valor da venda'; end if;
  update vendas set subtotal_centavos = v_sub, total_centavos = v_total where id = v_id;

  if p_encomenda is not null then
    update encomendas set venda_id = v_id where id = p_encomenda;
  end if;

  if coalesce(p_valor_pago,0) > 0 then
    perform registrar_pagamento(v_id, p_valor_pago, p_forma, p_data);
  end if;
  return v_id;
end $$;

-- Cancela venda e estorna no caixa tudo o que já entrou
create or replace function public.cancelar_venda(p_venda uuid, p_motivo text) returns void
language plpgsql security definer set search_path = public as $$
declare l lancamentos; v_num int;
begin
  if not eh_equipe() then raise exception 'Acesso negado'; end if;
  if coalesce(trim(p_motivo),'') = '' then raise exception 'Informe o motivo do cancelamento'; end if;
  select numero into v_num from vendas where id = p_venda and not cancelada for update;
  if v_num is null then raise exception 'Venda não encontrada ou já cancelada'; end if;

  for l in select * from lancamentos
           where venda_id = p_venda and tipo = 'entrada' and estorno_de is null loop
    insert into lancamentos (tipo, categoria, descricao, valor_centavos, forma_pagamento,
                             venda_id, estorno_de, criado_por)
    values ('saida', 'Estorno de venda', 'Estorno da venda #' || v_num, l.valor_centavos,
            l.forma_pagamento, p_venda, l.id, auth.uid());
  end loop;

  update vendas set cancelada = true, motivo_cancelamento = trim(p_motivo), cancelada_em = now()
  where id = p_venda;
end $$;

-- O Supabase concede execute em funções novas a anon e authenticated por padrão.
-- Aqui fica explícito quem pode chamar o quê.
revoke all on function public.registrar_venda, public.registrar_pagamento,
  public.cancelar_venda, public.recalcular_venda from anon, authenticated, public;
grant execute on function public.registrar_venda, public.registrar_pagamento,
  public.cancelar_venda to authenticated;

-- Funções de gatilho não são chamadas pela API.
revoke all on function public.tocar_atualizado_em, public.registrar_status_encomenda,
  public.criar_perfil, public.proteger_vendas, public.proteger_lancamentos,
  public.proteger_encomendas, public.proteger_perfis from anon, authenticated, public;
