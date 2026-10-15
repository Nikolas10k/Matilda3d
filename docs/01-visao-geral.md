# 01 — Visão geral

## Contexto

A Matilde3D vende peças impressas em 3D: chaveiros personalizados, decoração, presentes, miniaturas, topos de bolo e encomendas sob medida. Quem produz são jovens empreendedores, com a mãe (Karem) como responsável. As vendas acontecem principalmente pelo WhatsApp e pelo Instagram.

## Objetivos

1. Dar à marca uma presença profissional na internet (site com vitrine).
2. Facilitar o pedido: o cliente escolhe o produto e cai direto no WhatsApp com a mensagem pronta.
3. Captar encomendas personalizadas de forma organizada.
4. Dar aos jovens um painel simples para registrar vendas, controlar o caixa e entender se o negócio dá lucro.
5. Ensinar gestão básica na prática: custo, preço, margem, entradas e saídas.

## Usuários

| Perfil | Quem | O que faz |
| --- | --- | --- |
| Visitante | Cliente final | Navega na vitrine, pede pelo WhatsApp, envia encomenda |
| Admin | Karem (responsável) | Acesso total, gerencia usuários, apaga e estorna, vê tudo |
| Membro | Os filhos | Cadastra produtos, registra vendas, lança despesas, atende encomendas |

## Escopo (versão 1)

- Site público: home, vitrine com filtro por categoria, página do produto, encomenda personalizada, sobre nós.
- Painel: dashboard, produtos, calculadora de preço, vendas, livro caixa, encomendas, clientes, configurações, exportação CSV.

## Fora de escopo (versão 1)

- Pagamento online (checkout, gateway). O pagamento é combinado no WhatsApp.
- Cálculo de frete automático.
- Emissão de nota fiscal.
- Aplicativo nativo. O painel é web responsivo (pode ser instalado como PWA na fase 8).
- Integração automática com a API do WhatsApp ou do Instagram.

## Princípios

- Simples antes de completo: cada tela resolve uma tarefa clara.
- Linguagem amigável e educativa no painel, adequada a jovens (ex.: "Quanto entrou este mês").
- Números sempre explicados: todo indicador do dashboard tem uma legenda curta dizendo o que significa.
