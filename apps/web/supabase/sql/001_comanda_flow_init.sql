-- Comanda Flow
-- Initial PostgreSQL schema for Supabase
-- Derived from the current backend contract and domain types present in this repository.

begin;

-- ============================================================
-- Extensions
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- Enums
-- ============================================================

do $$
begin
  create type public.plan_tier as enum ('start', 'essencial', 'mesa', 'premium');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.user_role as enum ('owner', 'manager', 'staff');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.table_status as enum ('free', 'occupied');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.event_type as enum ('menu_view', 'qr_scan', 'whatsapp_click', 'menu_item_click');
exception
  when duplicate_object then null;
end
$$;

-- ============================================================
-- Utility functions
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- Core tenant and user tables
-- ============================================================

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  logo_url text,
  phone text not null default '',
  whatsapp text not null default '',
  address text not null default '',
  plan_id public.plan_tier not null default 'start',
  onboarding_progress integer not null default 0,
  onboarding_steps jsonb not null default '[]'::jsonb,
  delivery_neighborhoods jsonb not null default '[]'::jsonb,
  payment_methods jsonb not null default '[]'::jsonb,
  operating_hours jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenants_slug_key unique (slug),
  constraint tenants_slug_format_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint tenants_onboarding_progress_check check (onboarding_progress between 0 and 100),
  constraint tenants_onboarding_steps_is_array check (jsonb_typeof(onboarding_steps) = 'array'),
  constraint tenants_delivery_neighborhoods_is_array check (jsonb_typeof(delivery_neighborhoods) = 'array'),
  constraint tenants_payment_methods_is_array check (jsonb_typeof(payment_methods) = 'array'),
  constraint tenants_operating_hours_is_array check (jsonb_typeof(operating_hours) = 'array')
);

create table public.users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  email text not null,
  role public.user_role not null default 'staff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_email_key unique (email)
);

-- ============================================================
-- Menu catalog tables
-- ============================================================

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_tenant_name_key unique (tenant_id, name),
  constraint categories_tenant_id_id_key unique (tenant_id, id),
  constraint categories_sort_order_check check (sort_order >= 0)
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  category_id uuid not null,
  name text not null,
  description text not null default '',
  price_cents integer not null,
  image_url text,
  best_seller boolean not null default false,
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint menu_items_tenant_id_id_key unique (tenant_id, id),
  constraint menu_items_price_cents_check check (price_cents >= 0),
  constraint menu_items_category_fk
    foreign key (tenant_id, category_id)
    references public.categories (tenant_id, id)
    on delete restrict
);

create table public.modifier_groups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  required boolean not null default false,
  min_selectable integer not null default 0,
  max_selectable integer not null default 1,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint modifier_groups_tenant_name_key unique (tenant_id, name),
  constraint modifier_groups_tenant_id_id_key unique (tenant_id, id),
  constraint modifier_groups_min_selectable_check check (min_selectable >= 0),
  constraint modifier_groups_max_selectable_check check (max_selectable >= min_selectable),
  constraint modifier_groups_sort_order_check check (sort_order >= 0)
);

create table public.modifier_options (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  modifier_group_id uuid not null,
  name text not null,
  price_delta_cents integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint modifier_options_group_name_key unique (modifier_group_id, name),
  constraint modifier_options_price_delta_cents_check check (price_delta_cents >= 0),
  constraint modifier_options_sort_order_check check (sort_order >= 0),
  constraint modifier_options_group_fk
    foreign key (tenant_id, modifier_group_id)
    references public.modifier_groups (tenant_id, id)
    on delete cascade
);

create table public.menu_item_modifier_groups (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  menu_item_id uuid not null,
  modifier_group_id uuid not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (menu_item_id, modifier_group_id),
  constraint menu_item_modifier_groups_sort_order_check check (sort_order >= 0),
  constraint menu_item_modifier_groups_menu_item_fk
    foreign key (tenant_id, menu_item_id)
    references public.menu_items (tenant_id, id)
    on delete cascade,
  constraint menu_item_modifier_groups_modifier_group_fk
    foreign key (tenant_id, modifier_group_id)
    references public.modifier_groups (tenant_id, id)
    on delete cascade
);

-- ============================================================
-- Restaurant tables and billing
-- ============================================================

create table public.tables (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  table_number integer not null,
  qr_code_url text not null default '',
  status public.table_status not null default 'free',
  clicks integer not null default 0,
  public_link text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tables_tenant_table_number_key unique (tenant_id, table_number),
  constraint tables_table_number_check check (table_number > 0),
  constraint tables_clicks_check check (clicks >= 0)
);

-- Plan catalog currently lives in application code; the database stores only the current plan id.
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  plan_id public.plan_tier not null,
  status public.subscription_status not null,
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_tenant_id_key unique (tenant_id),
  constraint subscriptions_trialing_requires_trial_end
    check (status <> 'trialing' or trial_ends_at is not null),
  constraint subscriptions_period_bounds_check
    check (
      current_period_start is null
      or current_period_end is null
      or current_period_end >= current_period_start
    ),
  constraint subscriptions_metadata_is_object check (jsonb_typeof(metadata) = 'object')
);

-- ============================================================
-- Analytics events
-- ============================================================

create table public.events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  event_type public.event_type not null,
  user_id uuid references public.users(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  table_id uuid references public.tables(id) on delete set null,
  session_id text,
  visitor_id text,
  source text,
  path text,
  ip_address text,
  user_agent text,
  referrer text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  constraint events_metadata_is_object check (jsonb_typeof(metadata) = 'object'),
  constraint events_menu_item_click_requires_menu_item
    check (event_type <> 'menu_item_click' or menu_item_id is not null),
  constraint events_qr_scan_requires_table
    check (event_type <> 'qr_scan' or table_id is not null)
);

-- ============================================================
-- Indexes
-- ============================================================

create index idx_tenants_plan_id on public.tenants (plan_id);

create index idx_users_tenant_id on public.users (tenant_id);
create index idx_users_tenant_role on public.users (tenant_id, role);

create index idx_categories_tenant_sort_order on public.categories (tenant_id, sort_order, name);

create index idx_menu_items_tenant_category on public.menu_items (tenant_id, category_id);
create index idx_menu_items_tenant_available on public.menu_items (tenant_id, available);
create index idx_menu_items_tenant_best_seller on public.menu_items (tenant_id, best_seller);

create index idx_modifier_groups_tenant_sort_order on public.modifier_groups (tenant_id, sort_order);

create index idx_modifier_options_group_sort_order on public.modifier_options (modifier_group_id, sort_order);

create index idx_menu_item_modifier_groups_menu_item_sort_order
  on public.menu_item_modifier_groups (menu_item_id, sort_order);
create index idx_menu_item_modifier_groups_modifier_group_id
  on public.menu_item_modifier_groups (modifier_group_id);

create index idx_tables_tenant_status on public.tables (tenant_id, status);

create index idx_subscriptions_status on public.subscriptions (status);
create index idx_subscriptions_plan_id on public.subscriptions (plan_id);

create index idx_events_tenant_occurred_at on public.events (tenant_id, occurred_at desc);
create index idx_events_tenant_event_type_occurred_at
  on public.events (tenant_id, event_type, occurred_at desc);
create index idx_events_tenant_menu_item_occurred_at
  on public.events (tenant_id, menu_item_id, occurred_at desc)
  where menu_item_id is not null;
create index idx_events_tenant_table_occurred_at
  on public.events (tenant_id, table_id, occurred_at desc)
  where table_id is not null;
create index idx_events_tenant_category_occurred_at
  on public.events (tenant_id, category_id, occurred_at desc)
  where category_id is not null;

-- ============================================================
-- updated_at triggers
-- ============================================================

create trigger set_tenants_updated_at
before update on public.tenants
for each row
execute function public.set_updated_at();

create trigger set_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

create trigger set_categories_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

create trigger set_menu_items_updated_at
before update on public.menu_items
for each row
execute function public.set_updated_at();

create trigger set_modifier_groups_updated_at
before update on public.modifier_groups
for each row
execute function public.set_updated_at();

create trigger set_modifier_options_updated_at
before update on public.modifier_options
for each row
execute function public.set_updated_at();

create trigger set_tables_updated_at
before update on public.tables
for each row
execute function public.set_updated_at();

create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row
execute function public.set_updated_at();

commit;

-- ============================================================
-- Verification
-- ============================================================

select schemaname, tablename
from pg_tables
where schemaname = 'public'
  and tablename in (
    'users',
    'tenants',
    'categories',
    'menu_items',
    'modifier_groups',
    'modifier_options',
    'menu_item_modifier_groups',
    'tables',
    'subscriptions',
    'events'
  )
order by tablename;

select table_name, column_name, data_type, udt_name
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'users',
    'tenants',
    'categories',
    'menu_items',
    'modifier_groups',
    'modifier_options',
    'menu_item_modifier_groups',
    'tables',
    'subscriptions',
    'events'
  )
order by table_name, ordinal_position;

select tablename, indexname
from pg_indexes
where schemaname = 'public'
  and tablename in (
    'users',
    'tenants',
    'categories',
    'menu_items',
    'modifier_groups',
    'modifier_options',
    'menu_item_modifier_groups',
    'tables',
    'subscriptions',
    'events'
  )
order by tablename, indexname;
