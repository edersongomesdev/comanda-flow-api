# API Contract

This document defines the backend contract required by the current frontend state.

Scope rules:
- Only endpoints represented in `src/services/api.ts` are included.
- Response bodies are raw JSON objects or arrays, not `{ data: ... }` envelopes.
- Auth transport is not finalized in the frontend yet. The frontend currently consumes `User` JSON directly after login/signup.
- Authenticated tenant-scoped endpoints must resolve tenant from the authenticated user context, not from a tenant ID sent by the client.
- Public multi-tenant endpoints must resolve tenant from the `slug` path parameter.

## Shared JSON Shapes

### `User`

```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "owner | manager | staff",
  "tenantId": "string"
}
```

### `OnboardingStep`

```json
{
  "id": "string",
  "label": "string",
  "completed": true
}
```

### `Tenant`

```json
{
  "id": "string",
  "name": "string",
  "slug": "string",
  "logo": "string | undefined",
  "phone": "string",
  "whatsapp": "string",
  "address": "string",
  "plan": "START | ESSENCIAL | MESA | PREMIUM",
  "trialDaysLeft": 0,
  "onboardingProgress": 0,
  "onboardingSteps": ["OnboardingStep"],
  "deliveryNeighborhoods": ["string"],
  "paymentMethods": ["string"],
  "operatingHours": [
    {
      "day": "string",
      "open": "HH:mm",
      "close": "HH:mm",
      "active": true
    }
  ]
}
```

### `Category`

```json
{
  "id": "string",
  "name": "string",
  "order": 0
}
```

### `Modifier`

```json
{
  "id": "string",
  "name": "string",
  "price": 0
}
```

### `ModifierGroup`

```json
{
  "id": "string",
  "name": "string",
  "required": true,
  "min": 0,
  "max": 1,
  "modifiers": ["Modifier"]
}
```

### `MenuItem`

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "price": 0,
  "image": "string | undefined",
  "categoryId": "string",
  "bestSeller": true,
  "available": true,
  "modifierGroups": ["ModifierGroup"]
}
```

### `PublicMenuData`

```json
{
  "tenant": "Tenant",
  "categories": ["Category"],
  "items": ["MenuItem"]
}
```

### `Table`

```json
{
  "id": "string",
  "number": 0,
  "qrCode": "string",
  "status": "free | occupied",
  "clicks": 0,
  "link": "string"
}
```

### `PipelineLead`

```json
{
  "id": "string",
  "name": "string",
  "phone": "string",
  "source": "string",
  "stage": "new | contacted | negotiating | closed",
  "value": 0,
  "createdAt": "YYYY-MM-DD"
}
```

### `Plan`

```json
{
  "id": "START | ESSENCIAL | MESA | PREMIUM",
  "name": "string",
  "price": 0,
  "description": "string",
  "features": ["string"],
  "popular": true,
  "maxTables": 0,
  "maxItems": 0,
  "whatsapp": true,
  "pipeline": false
}
```

### `DashboardSummary`

```json
{
  "menuViews": 0,
  "menuViewsChange": 0,
  "qrScans": 0,
  "qrScansChange": 0,
  "whatsappClicks": 0,
  "whatsappClicksChange": 0,
  "topItemClicks": 0,
  "topItemClicksChange": 0,
  "topItems": [
    {
      "name": "string",
      "clicks": 0
    }
  ],
  "viewsByCategory": [
    {
      "name": "string",
      "value": 0
    }
  ],
  "viewsByDay": [
    {
      "day": "string",
      "views": 0,
      "clicks": 0
    }
  ]
}
```

## Endpoint Matrix

| Frontend function | Method | Route | Auth | Tenant resolution | Public | Billing-related |
| --- | --- | --- | --- | --- | --- | --- |
| `login` | `POST` | `/api/auth/login` | No | None | Yes | No |
| `signup` | `POST` | `/api/auth/signup` | No | None during request; create and attach tenant server-side | Yes | Yes |
| `getTenant` | `GET` | `/api/tenant` | Yes | From authenticated user `tenantId` | No | No |
| `updateTenant` | `PATCH` | `/api/tenant` | Yes | From authenticated user `tenantId` | No | No |
| `getPublicMenu` | `GET` | `/api/public/:slug/menu` | No | From `slug` path param | Yes | No |
| `getCategories` | `GET` | `/api/menu/categories` | Yes | From authenticated user `tenantId` | No | No |
| `getMenuItems` | `GET` | `/api/menu/items` | Yes | From authenticated user `tenantId` | No | No |
| `createMenuItem` | `POST` | `/api/menu/items` | Yes | From authenticated user `tenantId` | No | No |
| `updateMenuItem` | `PATCH` | `/api/menu/items/:id` | Yes | From authenticated user `tenantId` | No | No |
| `deleteMenuItem` | `DELETE` | `/api/menu/items/:id` | Yes | From authenticated user `tenantId` | No | No |
| `getTables` | `GET` | `/api/tables` | Yes | From authenticated user `tenantId` | No | No |
| `createTable` | `POST` | `/api/tables` | Yes | From authenticated user `tenantId` | No | No |
| `getPipelineLeads` | `GET` | `/api/pipeline/leads` | Yes | From authenticated user `tenantId` | No | No |
| `updateLeadStage` | `PATCH` | `/api/pipeline/leads/:id/stage` | Yes | From authenticated user `tenantId` | No | No |
| `getPlans` | `GET` | `/api/plans` | Yes | Global catalog, not tenant-scoped | No | Yes |
| `getDashboardSummary` | `GET` | `/api/dashboard/summary` | Yes | From authenticated user `tenantId` | No | No |

## Detailed Endpoint Contracts

### 1. `POST /api/auth/login`

Frontend function: `login(email, password)`

Auth requirement:
- Public

Tenant resolution rule:
- None at request time
- Backend identifies the user and returns a `User` whose `tenantId` becomes the frontend tenant context anchor

Request JSON:

```json
{
  "email": "string",
  "password": "string"
}
```

Response JSON:
- `User`

### 2. `POST /api/auth/signup`

Frontend function: `signup({ name, email, password, planId })`

Auth requirement:
- Public

Tenant resolution rule:
- None at request time
- Backend should create the initial tenant/subscription state for the new account, but the current frontend only requires the returned `User`

Request JSON:

```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "planId": "START | ESSENCIAL | MESA | PREMIUM"
}
```

Response JSON:
- `User`

Billing note:
- This is billing-related because `planId` is selected during signup

### 3. `GET /api/tenant`

Frontend function: `getTenant()`

Auth requirement:
- Authenticated

Tenant resolution rule:
- Resolve from authenticated user `tenantId`

Request JSON:
- None

Response JSON:
- `Tenant`

### 4. `PATCH /api/tenant`

Frontend function: `updateTenant(data)`

Auth requirement:
- Authenticated

Tenant resolution rule:
- Resolve from authenticated user `tenantId`

Request JSON:
- Partial `Tenant`
- Only changed fields should be required

Response JSON:
- `Tenant`

Frontend note:
- Service exists, but current settings UI is not wired to persist yet

### 5. `GET /api/public/:slug/menu`

Frontend function: `getPublicMenu(slug)`

Auth requirement:
- Public

Tenant resolution rule:
- Resolve tenant by `slug` path param

Request JSON:
- None

Path params:

```json
{
  "slug": "string"
}
```

Response JSON:
- `PublicMenuData`

Multi-tenant public endpoint:
- Yes

### 6. `GET /api/menu/categories`

Frontend function: `getCategories()`

Auth requirement:
- Authenticated

Tenant resolution rule:
- Resolve from authenticated user `tenantId`

Request JSON:
- None

Response JSON:
- `Category[]`

### 7. `GET /api/menu/items`

Frontend function: `getMenuItems()`

Auth requirement:
- Authenticated

Tenant resolution rule:
- Resolve from authenticated user `tenantId`

Request JSON:
- None

Response JSON:
- `MenuItem[]`

### 8. `POST /api/menu/items`

Frontend function: `createMenuItem(item)`

Auth requirement:
- Authenticated

Tenant resolution rule:
- Resolve from authenticated user `tenantId`

Request JSON:
- `MenuItem` without `id`

```json
{
  "name": "string",
  "description": "string",
  "price": 0,
  "image": "string | undefined",
  "categoryId": "string",
  "bestSeller": true,
  "available": true,
  "modifierGroups": ["ModifierGroup"]
}
```

Response JSON:
- `MenuItem`

Frontend note:
- Service exists, but the current admin UI dialog does not submit to the API yet

### 9. `PATCH /api/menu/items/:id`

Frontend function: `updateMenuItem(id, data)`

Auth requirement:
- Authenticated

Tenant resolution rule:
- Resolve from authenticated user `tenantId`
- Backend must also verify that `:id` belongs to the same tenant

Request JSON:
- Partial `MenuItem`

Response JSON:
- `MenuItem`

Frontend note:
- Service exists, but edit actions are not wired yet

### 10. `DELETE /api/menu/items/:id`

Frontend function: `deleteMenuItem(id)`

Auth requirement:
- Authenticated

Tenant resolution rule:
- Resolve from authenticated user `tenantId`
- Backend must also verify that `:id` belongs to the same tenant

Request JSON:
- None

Response JSON:
- Empty body or `204 No Content`

Frontend note:
- Service exists, but delete action is not wired yet

### 11. `GET /api/tables`

Frontend function: `getTables()`

Auth requirement:
- Authenticated

Tenant resolution rule:
- Resolve from authenticated user `tenantId`

Request JSON:
- None

Response JSON:
- `Table[]`

### 12. `POST /api/tables`

Frontend function: `createTable(number)`

Auth requirement:
- Authenticated

Tenant resolution rule:
- Resolve from authenticated user `tenantId`

Request JSON:

```json
{
  "number": 0
}
```

Response JSON:
- `Table`

Frontend note:
- Service exists, but the "Nova Mesa" action is not wired yet

### 13. `GET /api/pipeline/leads`

Frontend function: `getPipelineLeads()`

Auth requirement:
- Authenticated

Tenant resolution rule:
- Resolve from authenticated user `tenantId`

Request JSON:
- None

Response JSON:
- `PipelineLead[]`

### 14. `PATCH /api/pipeline/leads/:id/stage`

Frontend function: `updateLeadStage(id, stage)`

Auth requirement:
- Authenticated

Tenant resolution rule:
- Resolve from authenticated user `tenantId`
- Backend must also verify that `:id` belongs to the same tenant

Request JSON:

```json
{
  "stage": "new | contacted | negotiating | closed"
}
```

Response JSON:
- `PipelineLead`

Frontend note:
- The current pipeline screen updates local state only; API update is prepared but not wired yet

### 15. `GET /api/plans`

Frontend function: `getPlans()`

Auth requirement:
- Authenticated in current frontend flow

Tenant resolution rule:
- None required for the query itself
- This is a global plan catalog

Request JSON:
- None

Response JSON:
- `Plan[]`

Billing-related:
- Yes

### 16. `GET /api/dashboard/summary`

Frontend function: `getDashboardSummary()`

Auth requirement:
- Authenticated

Tenant resolution rule:
- Resolve from authenticated user `tenantId`

Request JSON:
- None

Response JSON:
- `DashboardSummary`

## Public vs Authenticated Summary

Public endpoints:
- `POST /api/auth/login`
- `POST /api/auth/signup`
- `GET /api/public/:slug/menu`

Authenticated endpoints:
- `GET /api/tenant`
- `PATCH /api/tenant`
- `GET /api/menu/categories`
- `GET /api/menu/items`
- `POST /api/menu/items`
- `PATCH /api/menu/items/:id`
- `DELETE /api/menu/items/:id`
- `GET /api/tables`
- `POST /api/tables`
- `GET /api/pipeline/leads`
- `PATCH /api/pipeline/leads/:id/stage`
- `GET /api/plans`
- `GET /api/dashboard/summary`

Billing-related endpoints:
- `POST /api/auth/signup`
- `GET /api/plans`

Multi-tenant public endpoints:
- `GET /api/public/:slug/menu`

## Implementation Constraints For Backend

- Do not require tenant ID in request bodies for authenticated tenant-scoped endpoints.
- Do not wrap successful responses in a `data` envelope unless the frontend service layer is updated first.
- Keep `getPublicMenu` response aggregated as `{ tenant, categories, items }`, because the public menu screen depends on all three pieces arriving together.
- Stripe checkout, billing portal, webhook, analytics, and other billing endpoints are intentionally excluded here because the current frontend does not call them yet.
