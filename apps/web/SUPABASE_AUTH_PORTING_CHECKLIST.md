# Supabase Auth Porting Checklist

Este arquivo descreve exatamente o que precisa ser levado para um repositorio de frontend separado para fechar a fase 2 da migracao de auth.

## Premissas

- O backend ja contem:
  - `user_profiles` ligada a `auth.users`
  - `POST /auth/register` com dual-write
  - `GET /auth/me` aceitando token Supabase
  - `POST /auth/login` descontinuado, sem fallback legado no backend atual
- O frontend separado usa Vite + React e possui um ponto central de auth/contexto e um cliente HTTP.

## Ordem Recomendada

1. Adicionar envs do Supabase
2. Instalar `@supabase/supabase-js`
3. Criar o client/helper de auth do Supabase
4. Trocar a resolucao do bearer token no cliente HTTP
5. Refatorar o `auth-context` para login/bootstrap/logout Supabase-first
6. Atualizar a tela de login
7. Criar tela de forgot password
8. Criar tela de reset password
9. Registrar as rotas novas
10. Validar login, refresh, logout e reset

## Env Vars

Adicionar no frontend separado:

```env
VITE_API_BASE_URL=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_URL=
```

Observacoes:

- `VITE_API_BASE_URL` deve apontar para a API que ja aceita token Supabase.
- `VITE_APP_URL` deve ser a URL publica do frontend, usada no `redirectTo` do reset de senha.
- A mesma URL precisa estar liberada no painel do Supabase em Auth > URL Configuration.

## Dependencia

Instalar:

```bash
npm install @supabase/supabase-js@2.57.4
```

## Arquivos Para Portar

### 1. Criar helper do Supabase

Criar um arquivo equivalente a:

- `apps/web/src/services/supabase.ts`

Responsabilidades dele:

- inicializar `createClient(...)`
- `getSupabaseAccessToken()`
- `getSupabaseSession()`
- `signInWithSupabasePassword(email, password)`
- `sendPasswordResetEmail(email)`
- `updateSupabasePassword(password)`
- `signOutSupabaseSession()`
- `subscribeToSupabaseAuth(listener)`

Referencia no monorepo:

- `apps/web/src/services/supabase.ts`

### 2. Atualizar o cliente HTTP

No seu arquivo de HTTP central:

- priorizar `access_token` do Supabase
- cair para token legado so durante a transicao
- continuar enviando `Authorization: Bearer ...`

Referencia:

- `apps/web/src/services/http.ts`

Trecho conceitual:

```ts
const supabaseToken = await getSupabaseAccessToken();
if (supabaseToken) return supabaseToken;
return legacyToken;
```

### 3. Refatorar o contexto de auth

No contexto/global state de auth do frontend separado:

- bootstrap Supabase-first no carregamento
- se existir sessao Supabase, chamar `/auth/me`
- montar o usuario do app a partir do backend
- login:
  - tentar `supabase.auth.signInWithPassword`
  - depois chamar `/auth/me`
  - se a conta ainda nao existir no Supabase, mostrar erro explicando que o backfill de usuarios antigos ainda nao ocorreu
- logout:
  - `supabase.auth.signOut()`
  - limpar estado local
  - limpar qualquer token legado residual
- signup:
  - manter chamada ao backend
  - depois tentar abrir sessao Supabase com email/senha recem-criados

Referencia:

- `apps/web/src/state/auth-context.tsx`

### 4. Atualizar a tela de login

Na tela de auth:

- manter o submit chamando o `login(...)` do contexto
- adicionar link para "Esqueci minha senha"
- ajustar a mensagem de ajuda para deixar claro que o fallback legado ainda e temporario

Referencia:

- `apps/web/src/pages/Auth.tsx`

### 5. Criar tela de forgot password

Criar rota/pagina:

- `/auth/forgot-password`

Fluxo:

- usuario informa email
- frontend chama `supabase.auth.resetPasswordForEmail(email, { redirectTo })`

Referencia:

- `apps/web/src/pages/ForgotPassword.tsx`

### 6. Criar tela de reset password

Criar rota/pagina:

- `/auth/reset-password`

Fluxo:

- detectar sessao de recovery via Supabase
- permitir definicao da nova senha
- chamar `supabase.auth.updateUser({ password })`
- encerrar sessao
- redirecionar para `/auth`

Referencia:

- `apps/web/src/pages/ResetPassword.tsx`

### 7. Registrar as rotas

Adicionar no roteador principal:

- `/auth/forgot-password`
- `/auth/reset-password`

Referencia:

- `apps/web/src/App.tsx`

## O Que Pode Ser Copiado Quase Direto

Se o frontend separado tiver estrutura parecida, estes arquivos podem ser usados como base quase integral:

- `apps/web/src/services/supabase.ts`
- `apps/web/src/pages/ForgotPassword.tsx`
- `apps/web/src/pages/ResetPassword.tsx`

Os que normalmente exigem adaptacao:

- `apps/web/src/services/http.ts`
- `apps/web/src/state/auth-context.tsx`
- `apps/web/src/pages/Auth.tsx`
- `apps/web/src/App.tsx`

## Pontos de Ajuste No Repo Separado

- aliases de import, por exemplo `@/services/...`
- biblioteca de UI usada no login/reset
- roteador e estrutura de layouts
- nome do storage key legado, se existir outro
- shape do usuario retornado por `/auth/me`

## Checklist de Validacao

Depois do port:

1. Login com usuario novo criado pelo backend entra via Supabase e carrega `/auth/me`.
2. Refresh de pagina mantem sessao e reidrata o usuario.
3. Logout encerra sessao Supabase e limpa estado local.
4. Forgot password envia email com link valido.
5. Link de reset abre a tela correta do frontend.
6. Reset salva a nova senha e volta para login.
7. Usuario legado antigo recebe uma mensagem clara dizendo que a conta ainda precisa ser migrada para o Supabase.

## Debitos Tecnicos Que Ficam Apos O Port

- Criar e executar o backfill de usuarios antigos para o Supabase
- Remover `email_confirm: true` no cadastro via Admin API
- Eliminar `passwordHash` e JWT legado no backend

## Se Quiser Levar Como Patch

No monorepo atual, os arquivos alterados do frontend sao:

- `apps/web/src/services/supabase.ts`
- `apps/web/src/services/http.ts`
- `apps/web/src/state/auth-context.tsx`
- `apps/web/src/pages/Auth.tsx`
- `apps/web/src/pages/ForgotPassword.tsx`
- `apps/web/src/pages/ResetPassword.tsx`
- `apps/web/src/App.tsx`

Se o frontend separado tiver historico Git proprio, gere patches a partir desses arquivos e aplique manualmente no repo de destino.
