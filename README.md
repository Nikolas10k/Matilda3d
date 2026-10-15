# Matilde3D

Site e painel gerencial da Matilde3D, marca de peças impressas em 3D de Maria Clara e Tharik. Desenvolvido pela Givance Tech.

- **Site público:** vitrine, pedido pelo WhatsApp e encomendas personalizadas.
- **Painel (`/admin`):** produtos, calculadora de preço, vendas, caixa, encomendas, clientes e dashboard.

A especificação completa está em [`CLAUDE.md`](CLAUDE.md) e na pasta [`docs/`](docs/).

## Como rodar

Requisitos: Node 20+ e pnpm 10.

```bash
pnpm install
cp .env.example .env.local   # preencha com os dados do Supabase
pnpm dev                     # http://localhost:3000
```

## Scripts

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Checagem de tipos do TypeScript |
| `pnpm test` | Testes unitários (Vitest) |
| `pnpm build` | Build de produção |

O guia de uso para a família (registrar venda, lançar despesa, ler o dashboard) entra na Fase 8.
