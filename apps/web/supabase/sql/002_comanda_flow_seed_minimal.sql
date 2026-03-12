-- Comanda Flow
-- Minimal demo seed for local/demo Supabase environments.

begin;

-- ============================================================
-- Demo tenant
-- ============================================================

insert into public.tenants (
  id,
  name,
  slug,
  logo_url,
  phone,
  whatsapp,
  address,
  plan_id,
  onboarding_progress,
  onboarding_steps,
  delivery_neighborhoods,
  payment_methods,
  operating_hours
)
values (
  '11111111-1111-4111-8111-111111111111',
  'Demo Burguer',
  'demo-burguer',
  null,
  '(11) 99999-1111',
  '(11) 99999-1111',
  'Rua Demo, 100 - Sao Paulo, SP',
  'mesa',
  60,
  '[
    {"id":"signup","label":"Cadastro","completed":true},
    {"id":"menu","label":"Cardapio","completed":true},
    {"id":"whatsapp","label":"WhatsApp","completed":true},
    {"id":"tables","label":"Mesas","completed":false}
  ]'::jsonb,
  '["Centro","Jardins","Pinheiros"]'::jsonb,
  '["Pix","Cartao Credito","Cartao Debito","Dinheiro"]'::jsonb,
  '[
    {"day":"Segunda","open":"11:00","close":"23:00","active":true},
    {"day":"Terca","open":"11:00","close":"23:00","active":true},
    {"day":"Quarta","open":"11:00","close":"23:00","active":true},
    {"day":"Quinta","open":"11:00","close":"23:00","active":true},
    {"day":"Sexta","open":"11:00","close":"00:00","active":true},
    {"day":"Sabado","open":"11:00","close":"00:00","active":true},
    {"day":"Domingo","open":"12:00","close":"22:00","active":true}
  ]'::jsonb
)
on conflict on constraint tenants_slug_key
do update set
  name = excluded.name,
  logo_url = excluded.logo_url,
  phone = excluded.phone,
  whatsapp = excluded.whatsapp,
  address = excluded.address,
  plan_id = excluded.plan_id,
  onboarding_progress = excluded.onboarding_progress,
  onboarding_steps = excluded.onboarding_steps,
  delivery_neighborhoods = excluded.delivery_neighborhoods,
  payment_methods = excluded.payment_methods,
  operating_hours = excluded.operating_hours;

-- ============================================================
-- Demo owner user
-- ============================================================

with demo_tenant as (
  select id
  from public.tenants
  where slug = 'demo-burguer'
)
insert into public.users (id, tenant_id, name, email, role)
select
  '22222222-2222-4222-8222-222222222222',
  demo_tenant.id,
  'Demo Owner',
  'owner@demo-burguer.com',
  'owner'
from demo_tenant
on conflict on constraint users_email_key
do update set
  tenant_id = excluded.tenant_id,
  name = excluded.name,
  role = excluded.role;

-- ============================================================
-- Categories
-- ============================================================

with demo_tenant as (
  select id
  from public.tenants
  where slug = 'demo-burguer'
)
insert into public.categories (id, tenant_id, name, sort_order)
select seeded.id, demo_tenant.id, seeded.name, seeded.sort_order
from demo_tenant
cross join (
  values
    ('33333333-3333-4333-8333-333333333331'::uuid, 'Burgers'::text, 1),
    ('33333333-3333-4333-8333-333333333332'::uuid, 'Acompanhamentos'::text, 2),
    ('33333333-3333-4333-8333-333333333333'::uuid, 'Bebidas'::text, 3)
) as seeded(id, name, sort_order)
on conflict on constraint categories_tenant_name_key
do update set
  sort_order = excluded.sort_order;

-- ============================================================
-- Menu items
-- ============================================================

with demo_tenant as (
  select id
  from public.tenants
  where slug = 'demo-burguer'
),
burgers_category as (
  select id
  from public.categories
  where tenant_id = (select id from demo_tenant)
    and name = 'Burgers'
),
sides_category as (
  select id
  from public.categories
  where tenant_id = (select id from demo_tenant)
    and name = 'Acompanhamentos'
),
drinks_category as (
  select id
  from public.categories
  where tenant_id = (select id from demo_tenant)
    and name = 'Bebidas'
)
insert into public.menu_items (
  id,
  tenant_id,
  category_id,
  name,
  description,
  price_cents,
  image_url,
  best_seller,
  available
)
select
  '44444444-4444-4444-8444-444444444441',
  demo_tenant.id,
  burgers_category.id,
  'Smash Classico',
  'Dois smash burgers, cheddar, cebola caramelizada, picles e molho da casa.',
  3290,
  null,
  true,
  true
from demo_tenant
cross join burgers_category
where not exists (
  select 1
  from public.menu_items
  where tenant_id = demo_tenant.id
    and name = 'Smash Classico'
);

with demo_tenant as (
  select id
  from public.tenants
  where slug = 'demo-burguer'
),
burgers_category as (
  select id
  from public.categories
  where tenant_id = (select id from demo_tenant)
    and name = 'Burgers'
)
insert into public.menu_items (
  id,
  tenant_id,
  category_id,
  name,
  description,
  price_cents,
  image_url,
  best_seller,
  available
)
select
  '44444444-4444-4444-8444-444444444442',
  demo_tenant.id,
  burgers_category.id,
  'General Burguer',
  'Hamburguer artesanal, provolone, rucula, tomate seco e maionese trufada.',
  3990,
  null,
  true,
  true
from demo_tenant
cross join burgers_category
where not exists (
  select 1
  from public.menu_items
  where tenant_id = demo_tenant.id
    and name = 'General Burguer'
);

with demo_tenant as (
  select id
  from public.tenants
  where slug = 'demo-burguer'
),
sides_category as (
  select id
  from public.categories
  where tenant_id = (select id from demo_tenant)
    and name = 'Acompanhamentos'
)
insert into public.menu_items (
  id,
  tenant_id,
  category_id,
  name,
  description,
  price_cents,
  image_url,
  best_seller,
  available
)
select
  '44444444-4444-4444-8444-444444444443',
  demo_tenant.id,
  sides_category.id,
  'Batata Rustica',
  'Batatas rusticas com alecrim e flor de sal.',
  1890,
  null,
  true,
  true
from demo_tenant
cross join sides_category
where not exists (
  select 1
  from public.menu_items
  where tenant_id = demo_tenant.id
    and name = 'Batata Rustica'
);

with demo_tenant as (
  select id
  from public.tenants
  where slug = 'demo-burguer'
),
drinks_category as (
  select id
  from public.categories
  where tenant_id = (select id from demo_tenant)
    and name = 'Bebidas'
)
insert into public.menu_items (
  id,
  tenant_id,
  category_id,
  name,
  description,
  price_cents,
  image_url,
  best_seller,
  available
)
select
  '44444444-4444-4444-8444-444444444444',
  demo_tenant.id,
  drinks_category.id,
  'Coca-Cola',
  'Lata 350ml.',
  790,
  null,
  false,
  true
from demo_tenant
cross join drinks_category
where not exists (
  select 1
  from public.menu_items
  where tenant_id = demo_tenant.id
    and name = 'Coca-Cola'
);

-- ============================================================
-- Modifier group and options
-- ============================================================

with demo_tenant as (
  select id
  from public.tenants
  where slug = 'demo-burguer'
)
insert into public.modifier_groups (
  id,
  tenant_id,
  name,
  required,
  min_selectable,
  max_selectable,
  sort_order
)
select
  '55555555-5555-4555-8555-555555555551',
  demo_tenant.id,
  'Adicionais',
  false,
  0,
  3,
  1
from demo_tenant
on conflict on constraint modifier_groups_tenant_name_key
do update set
  required = excluded.required,
  min_selectable = excluded.min_selectable,
  max_selectable = excluded.max_selectable,
  sort_order = excluded.sort_order;

with demo_tenant as (
  select id
  from public.tenants
  where slug = 'demo-burguer'
),
adicionais_group as (
  select id
  from public.modifier_groups
  where tenant_id = (select id from demo_tenant)
    and name = 'Adicionais'
)
insert into public.modifier_options (
  id,
  tenant_id,
  modifier_group_id,
  name,
  price_delta_cents,
  sort_order
)
select
  seeded.id,
  demo_tenant.id,
  adicionais_group.id,
  seeded.name,
  seeded.price_delta_cents,
  seeded.sort_order
from demo_tenant
cross join adicionais_group
cross join (
  values
    ('66666666-6666-4666-8666-666666666661'::uuid, 'Bacon extra'::text, 500, 1),
    ('66666666-6666-4666-8666-666666666662'::uuid, 'Cheddar extra'::text, 400, 2)
) as seeded(id, name, price_delta_cents, sort_order)
on conflict on constraint modifier_options_group_name_key
do update set
  price_delta_cents = excluded.price_delta_cents,
  sort_order = excluded.sort_order;

with demo_tenant as (
  select id
  from public.tenants
  where slug = 'demo-burguer'
),
smash_item as (
  select id
  from public.menu_items
  where tenant_id = (select id from demo_tenant)
    and name = 'Smash Classico'
),
adicionais_group as (
  select id
  from public.modifier_groups
  where tenant_id = (select id from demo_tenant)
    and name = 'Adicionais'
)
insert into public.menu_item_modifier_groups (
  tenant_id,
  menu_item_id,
  modifier_group_id,
  sort_order
)
select
  demo_tenant.id,
  smash_item.id,
  adicionais_group.id,
  1
from demo_tenant
cross join smash_item
cross join adicionais_group
on conflict (menu_item_id, modifier_group_id)
do update set
  sort_order = excluded.sort_order;

-- ============================================================
-- Demo restaurant tables
-- ============================================================

with demo_tenant as (
  select id
  from public.tenants
  where slug = 'demo-burguer'
)
insert into public.tables (
  id,
  tenant_id,
  table_number,
  qr_code_url,
  status,
  clicks,
  public_link
)
select
  seeded.id,
  demo_tenant.id,
  seeded.table_number,
  seeded.qr_code_url,
  seeded.status,
  seeded.clicks,
  seeded.public_link
from demo_tenant
cross join (
  values
    (
      '77777777-7777-4777-8777-777777777771'::uuid,
      1,
      'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://app.comandaflow.com/m/demo-burguer/menu/1'::text,
      'free'::public.table_status,
      0,
      '/m/demo-burguer/menu/1'::text
    ),
    (
      '77777777-7777-4777-8777-777777777772'::uuid,
      2,
      'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://app.comandaflow.com/m/demo-burguer/menu/2'::text,
      'free'::public.table_status,
      0,
      '/m/demo-burguer/menu/2'::text
    )
) as seeded(id, table_number, qr_code_url, status, clicks, public_link)
on conflict on constraint tables_tenant_table_number_key
do update set
  qr_code_url = excluded.qr_code_url,
  status = excluded.status,
  clicks = excluded.clicks,
  public_link = excluded.public_link;

-- ============================================================
-- Demo subscription
-- ============================================================

with demo_tenant as (
  select id
  from public.tenants
  where slug = 'demo-burguer'
)
insert into public.subscriptions (
  id,
  tenant_id,
  plan_id,
  status,
  trial_ends_at,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  canceled_at,
  metadata
)
select
  '88888888-8888-4888-8888-888888888888',
  demo_tenant.id,
  'mesa',
  'trialing',
  now() + interval '14 days',
  now(),
  now() + interval '14 days',
  false,
  null,
  '{"provider":"manual","seeded":true}'::jsonb
from demo_tenant
on conflict on constraint subscriptions_tenant_id_key
do update set
  plan_id = excluded.plan_id,
  status = excluded.status,
  trial_ends_at = coalesce(public.subscriptions.trial_ends_at, excluded.trial_ends_at),
  current_period_start = coalesce(public.subscriptions.current_period_start, excluded.current_period_start),
  current_period_end = coalesce(public.subscriptions.current_period_end, excluded.current_period_end),
  cancel_at_period_end = excluded.cancel_at_period_end,
  canceled_at = excluded.canceled_at,
  metadata = excluded.metadata;

commit;
