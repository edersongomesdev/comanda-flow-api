# Comanda Flow API

Backend NestJS multi-tenant para o Comanda Flow.

## Auth

O backend usa `Supabase Auth` como fonte única de identidade.

- O frontend autentica o usuário com Supabase.
- O frontend envia o `access_token` do Supabase como `Authorization: Bearer <token>`.
- A API valida o token no Supabase e resolve o contexto interno em `user_profiles`.
- Tenant, role e permissões continuam vindo do banco da aplicação via Prisma.

`POST /auth/login` não emite mais JWT e responde `410 Gone`.
`POST /auth/register` e `POST /storage/upload-url` respondem `503 Service Unavailable` quando `SUPABASE_SERVICE_ROLE_KEY` não está configurada.

## Endpoints principais

- `GET /health`: liveness sem autenticação.
- `POST /auth/register`: cria usuário no Supabase Auth, tenant interno, subscription inicial e `userProfile`.
- `GET /auth/me`: exige bearer token do Supabase e retorna o perfil interno resolvido para o usuário autenticado.
- `POST /auth/login`: descontinuado. O frontend deve autenticar diretamente no Supabase.

## Variáveis de ambiente

Obrigatórias:

- `PORT`
- `NODE_ENV`
- `FRONTEND_URL`
- `DATABASE_URL`
- `DIRECT_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Obrigatórias apenas para rotas/serviços administrativos:

- `SUPABASE_SERVICE_ROLE_KEY`
  - necessária para `POST /auth/register`
  - necessária para signed upload URLs no módulo de storage
  - se ausente, a aplicação sobe normalmente, mas essas rotas respondem `503`

Opcionais:

- `FRONTEND_URLS`
- `FRONTEND_VERCEL_PROJECTS`
- `SUPABASE_STORAGE_BUCKET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_START`
- `STRIPE_PRICE_ESSENCIAL`
- `STRIPE_PRICE_MESA`
- `STRIPE_PRICE_PREMIUM`

Consulte [`apps/api/.env.example`](/home/gomesederson159/comanda-flow-api/apps/api/.env.example).

## Desenvolvimento

```bash
npm install
npm --workspace apps/api run build
npm --workspace apps/api run start:dev
```

## SQL e Prisma

```bash
npm --workspace apps/api run prisma:generate
npm --workspace apps/api run prisma:migrate:deploy
npm --workspace apps/api run prisma:sql:generate
```

`User` permanece no schema apenas como legado. O fluxo ativo de autenticação usa `user_profiles` vinculando `public.user_profiles.id` ao `auth.users.id` do Supabase.
O seed mínimo não cria mais login local nem popula a tabela `User`.

## Fluxo do frontend

1. No cadastro, chame `POST /auth/register` com `name`, `email`, `password`, `planId` e, opcionalmente, `tenantName`/`tenantSlug`.
2. Após sucesso no cadastro, faça login no Supabase no frontend com `supabase.auth.signInWithPassword`.
3. Envie o access token retornado pelo Supabase para a API.
4. Use `GET /auth/me` para hidratar o contexto do usuário autenticado.
5. Se `GET /auth/me` responder `401`, trate como token inválido/expirado ou usuário sem `userProfile` provisionado.

## Observações de deploy

- Não configure `JWT_SECRET`: ele não é mais usado.
- Não exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend.
- Se `SUPABASE_ANON_KEY` ou `SUPABASE_URL` estiverem ausentes, o bootstrap falha na validação de ambiente antes da API subir.
- Se `SUPABASE_SERVICE_ROLE_KEY` estiver ausente, a API ainda sobe e responde `GET /health`, mas `POST /auth/register` e rotas de storage assinadas respondem `503` com mensagem explícita de configuração.
- `GET /auth/me` responde `401` para token Supabase inválido/expirado e também para usuários sem `userProfile`.
- Em `NODE_ENV=production`, o Swagger não é exposto. Fora de produção, ele fica em `/docs`.
