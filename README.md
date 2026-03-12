# Comanda Flow Monorepo

Estrutura:

- `apps/web`: frontend atual
- `apps/api`: backend atual

## Instalação

```bash
npm install
```

## Comandos da raiz

```bash
npm run dev:web
npm run dev:api
npm run build:web
npm run build:api
npm run build
```

## Variáveis de ambiente

- frontend: `apps/web/.env` e `apps/web/.env.local`
- backend: `apps/api/.env`
- arquivos `.env*` continuam fora do git

## Manual steps

- se a Vercel apontar para este repositório, use `apps/web` como `Root Directory`
- se você já tinha processos/scripts apontando para a raiz antiga do backend, passe a usar `apps/api`
# comanda-flow-api
