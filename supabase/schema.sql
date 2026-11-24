-- ============================================================================
-- TOPSTORE WOMAN — Schema, RLS, Storage & Initial Catalog Seed
-- Isolated with `woman_` prefix so it coexists safely alongside existing tables
-- ============================================================================

-- 1. Admin users allowlist (links to Supabase Auth users)
create table if not exists public.woman_admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  created_at timestamptz not null default now()
);

-- 2. Products catalog
create table if not exists public.woman_products (
  id uuid primary key default gen_random_uuid(),
  ref_code text unique not null,
  slug text unique not null,
  name text not null,
  category text not null,
  description text not null default '',
  fabric_care text not null default '',
  price integer not null default 0 check (price >= 0),
  compare_at_price integer check (compare_at_price is null or compare_at_price >= 0),
  sizes text[] not null default array['S','M','L'],
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Product color variants & ordered gallery images
create table if not exists public.woman_product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.woman_products(id) on delete cascade,
  color_index integer not null default 1,
  color_name text not null,
  color_hex text not null default '#2B1F1B',
  images text[] not null default '{}',
  stock integer not null default 10 check (stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (product_id, color_index)
);

-- 4. Orders (created from web checkout or manually in Admin)
create sequence if not exists public.woman_order_seq start 1;

create table if not exists public.woman_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_name text not null,
  customer_phone text not null,
  customer_city text not null default '',
  customer_address text not null default '',
  payment_method text not null default 'WhatsApp / Transferencia',
  status text not null default 'pendiente'
    check (status in ('pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado')),
  source text not null default 'web'
    check (source in ('web', 'admin', 'whatsapp', 'instagram')),
  subtotal integer not null default 0 check (subtotal >= 0),
  shipping_cost integer not null default 0 check (shipping_cost >= 0),
  total integer not null default 0 check (total >= 0),
  tracking_code text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Order line items
create table if not exists public.woman_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.woman_orders(id) on delete cascade,
  product_id uuid references public.woman_products(id) on delete set null,
  variant_id uuid references public.woman_product_variants(id) on delete set null,
  product_name text not null,
  color_name text not null,
  size text not null,
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  line_total integer not null check (line_total >= 0),
  image_url text
);

-- 6. Store settings (singleton row id = 1)
create table if not exists public.woman_store_settings (
  id integer primary key default 1 check (id = 1),
  brand_name text not null default 'TOPSTORE WOMAN',
  tagline text not null default 'Ropa Premium Para Ella',
  whatsapp_number text not null default '573205172484',
  instagram_handle text not null default '@topstore_18',
  parent_brand_url text not null default 'https://topstorecolombia.com',
  announcement_bar text not null default 'Envíos a todo Colombia · Nueva Colección Elegante TOPSTORE WOMAN',
  shipping_note text not null default 'Envíos seguros desde Pasto a todo Colombia. Atención personalizada vía WhatsApp.',
  default_shipping_cost integer not null default 0 check (default_shipping_cost >= 0),
  updated_at timestamptz not null default now()
);

-- Indexes for query performance & FK joins
create index if not exists idx_woman_products_active_sort
  on public.woman_products (is_active, sort_order);

create index if not exists idx_woman_variants_product_id
  on public.woman_product_variants (product_id, color_index);

create index if not exists idx_woman_orders_status_created
  on public.woman_orders (status, created_at desc);

create index if not exists idx_woman_order_items_order_id
  on public.woman_order_items (order_id);

create index if not exists idx_woman_order_items_product_id
  on public.woman_order_items (product_id);

-- Updated_at trigger function (SECURITY INVOKER with pinned search_path)
create or replace function public.woman_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_woman_products_updated_at on public.woman_products;
create trigger trg_woman_products_updated_at
  before update on public.woman_products
  for each row execute function public.woman_set_updated_at();

drop trigger if exists trg_woman_orders_updated_at on public.woman_orders;
create trigger trg_woman_orders_updated_at
  before update on public.woman_orders
  for each row execute function public.woman_set_updated_at();

drop trigger if exists trg_woman_store_settings_updated_at on public.woman_store_settings;
create trigger trg_woman_store_settings_updated_at
  before update on public.woman_store_settings
  for each row execute function public.woman_set_updated_at();

-- Explicit Data API grants (paired with strict RLS below)
grant select on public.woman_products, public.woman_product_variants, public.woman_store_settings to anon, authenticated;
grant insert, update, delete on public.woman_products, public.woman_product_variants, public.woman_store_settings to authenticated;
grant select, insert, update, delete on public.woman_orders, public.woman_order_items to authenticated;
grant select on public.woman_admin_users to authenticated;
grant usage, select on sequence public.woman_order_seq to authenticated;

-- Enable Row Level Security on every table
alter table public.woman_admin_users enable row level security;
alter table public.woman_products enable row level security;
alter table public.woman_product_variants enable row level security;
alter table public.woman_orders enable row level security;
alter table public.woman_order_items enable row level security;
alter table public.woman_store_settings enable row level security;

-- RLS Policies: woman_admin_users
drop policy if exists "woman_admin_users_select_own" on public.woman_admin_users;
create policy "woman_admin_users_select_own"
  on public.woman_admin_users
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- RLS Policies: woman_products
drop policy if exists "woman_products_select_public" on public.woman_products;
create policy "woman_products_select_public"
  on public.woman_products
  for select
  to anon, authenticated
  using (
    is_active = true
    or exists (
      select 1 from public.woman_admin_users au
      where au.user_id = (select auth.uid())
    )
  );

drop policy if exists "woman_products_admin_insert" on public.woman_products;
create policy "woman_products_admin_insert"
  on public.woman_products
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.woman_admin_users au
      where au.user_id = (select auth.uid())
    )
  );

drop policy if exists "woman_products_admin_update" on public.woman_products;
create policy "woman_products_admin_update"
  on public.woman_products
  for update
  to authenticated
  using (
    exists (
      select 1 from public.woman_admin_users au
      where au.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.woman_admin_users au
      where au.user_id = (select auth.uid())
    )
  );

drop policy if exists "woman_products_admin_delete" on public.woman_products;
create policy "woman_products_admin_delete"
  on public.woman_products
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.woman_admin_users au
      where au.user_id = (select auth.uid())
    )
  );

-- RLS Policies: woman_product_variants
drop policy if exists "woman_variants_select_public" on public.woman_product_variants;
create policy "woman_variants_select_public"
  on public.woman_product_variants
  for select
  to anon, authenticated
  using (
    is_active = true
    or exists (
      select 1 from public.woman_admin_users au
      where au.user_id = (select auth.uid())
    )
  );

drop policy if exists "woman_variants_admin_insert" on public.woman_product_variants;
create policy "woman_variants_admin_insert"
  on public.woman_product_variants
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.woman_admin_users au
      where au.user_id = (select auth.uid())
    )
  );

drop policy if exists "woman_variants_admin_update" on public.woman_product_variants;
create policy "woman_variants_admin_update"
  on public.woman_product_variants
  for update
  to authenticated
  using (
    exists (
      select 1 from public.woman_admin_users au
      where au.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.woman_admin_users au
      where au.user_id = (select auth.uid())
    )
  );

drop policy if exists "woman_variants_admin_delete" on public.woman_product_variants;
create policy "woman_variants_admin_delete"
  on public.woman_product_variants
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.woman_admin_users au
      where au.user_id = (select auth.uid())
    )
  );

-- RLS Policies: woman_store_settings
drop policy if exists "woman_settings_select_public" on public.woman_store_settings;
create policy "woman_settings_select_public"
  on public.woman_store_settings
  for select
  to anon, authenticated
  using (true);

drop policy if exists "woman_settings_admin_update" on public.woman_store_settings;
create policy "woman_settings_admin_update"
  on public.woman_store_settings
  for update
  to authenticated
  using (
    exists (
      select 1 from public.woman_admin_users au
      where au.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.woman_admin_users au
      where au.user_id = (select auth.uid())
    )
  );

-- RLS Policies: woman_orders (admin-only direct table access; public submits via RPC)
drop policy if exists "woman_orders_admin_select" on public.woman_orders;
create policy "woman_orders_admin_select"
  on public.woman_orders
  for select
  to authenticated
  using (
    exists (
      select 1 from public.woman_admin_users au
      where au.user_id = (select auth.uid())
    )
  );

drop policy if exists "woman_orders_admin_insert" on public.woman_orders;
create policy "woman_orders_admin_insert"
  on public.woman_orders
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.woman_admin_users au
      where au.user_id = (select auth.uid())
    )
  );

drop policy if exists "woman_orders_admin_update" on public.woman_orders;
create policy "woman_orders_admin_update"
  on public.woman_orders
  for update
  to authenticated
  using (
    exists (
      select 1 from public.woman_admin_users au
      where au.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.woman_admin_users au
      where au.user_id = (select auth.uid())
    )
  );

drop policy if exists "woman_orders_admin_delete" on public.woman_orders;
create policy "woman_orders_admin_delete"
  on public.woman_orders
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.woman_admin_users au
      where au.user_id = (select auth.uid())
    )
  );

-- RLS Policies: woman_order_items (admin-only direct table access)
drop policy if exists "woman_order_items_admin_select" on public.woman_order_items;
create policy "woman_order_items_admin_select"
  on public.woman_order_items
  for select
  to authenticated
  using (
    exists (
      select 1 from public.woman_admin_users au
      where au.user_id = (select auth.uid())
    )
  );

drop policy if exists "woman_order_items_admin_insert" on public.woman_order_items;
create policy "woman_order_items_admin_insert"
  on public.woman_order_items
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.woman_admin_users au
      where au.user_id = (select auth.uid())
    )
  );

drop policy if exists "woman_order_items_admin_update" on public.woman_order_items;
create policy "woman_order_items_admin_update"
  on public.woman_order_items
  for update
  to authenticated
  using (
    exists (
      select 1 from public.woman_admin_users au
      where au.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.woman_admin_users au
      where au.user_id = (select auth.uid())
    )
  );

drop policy if exists "woman_order_items_admin_delete" on public.woman_order_items;
create policy "woman_order_items_admin_delete"
  on public.woman_order_items
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.woman_admin_users au
      where au.user_id = (select auth.uid())
    )
  );

-- Atomic public order checkout function (server-side price validation, zero PII exposure)
create or replace function public.create_woman_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_city text,
  p_customer_address text,
  p_payment_method text,
  p_notes text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_subtotal integer := 0;
  v_shipping integer := 0;
  v_total integer := 0;
  v_item jsonb;
  v_prod record;
  v_variant record;
  v_qty integer;
  v_line_total integer;
begin
  if trim(coalesce(p_customer_name, '')) = '' or trim(coalesce(p_customer_phone, '')) = '' then
    raise exception 'Nombre y teléfono son obligatorios';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido debe contener al menos una prenda';
  end if;

  select coalesce(default_shipping_cost, 0)
    into v_shipping
    from public.woman_store_settings
    where id = 1;

  v_order_number := 'TSW-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.woman_order_seq')::text, 4, '0');

  insert into public.woman_orders (
    order_number,
    customer_name,
    customer_phone,
    customer_city,
    customer_address,
    payment_method,
    status,
    source,
    subtotal,
    shipping_cost,
    total,
    notes
  ) values (
    v_order_number,
    left(trim(p_customer_name), 120),
    left(trim(p_customer_phone), 40),
    left(trim(coalesce(p_customer_city, '')), 80),
    left(trim(coalesce(p_customer_address, '')), 240),
    left(trim(coalesce(p_payment_method, 'WhatsApp / Transferencia')), 80),
    'pendiente',
    'web',
    0,
    coalesce(v_shipping, 0),
    0,
    left(trim(coalesce(p_notes, '')), 500)
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := coalesce((v_item->>'quantity')::integer, 0);
    if v_qty <= 0 or v_qty > 50 then
      raise exception 'Cantidad inválida en el pedido';
    end if;

    select id, name, price
      into v_prod
      from public.woman_products
      where id = (v_item->>'product_id')::uuid
        and is_active = true;

    if not found then
      raise exception 'Una de las prendas seleccionadas ya no está disponible';
    end if;

    select id, color_name, images
      into v_variant
      from public.woman_product_variants
      where id = (v_item->>'variant_id')::uuid
        and product_id = v_prod.id;

    v_line_total := v_prod.price * v_qty;
    v_subtotal := v_subtotal + v_line_total;

    insert into public.woman_order_items (
      order_id,
      product_id,
      variant_id,
      product_name,
      color_name,
      size,
      quantity,
      unit_price,
      line_total,
      image_url
    ) values (
      v_order_id,
      v_prod.id,
      v_variant.id,
      v_prod.name,
      coalesce(v_variant.color_name, left(coalesce(v_item->>'color_name', 'Único'), 60)),
      left(trim(coalesce(v_item->>'size', 'M')), 20),
      v_qty,
      v_prod.price,
      v_line_total,
      case
        when v_variant.images is not null and array_length(v_variant.images, 1) > 0
          then v_variant.images[1]
        else null
      end
    );
  end loop;

  v_total := v_subtotal + coalesce(v_shipping, 0);

  update public.woman_orders
    set subtotal = v_subtotal,
        total = v_total
    where id = v_order_id;

  return jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'shipping_cost', coalesce(v_shipping, 0),
    'total', v_total
  );
end;
$$;

revoke all on function public.create_woman_order(text, text, text, text, text, text, jsonb) from public;
grant execute on function public.create_woman_order(text, text, text, text, text, text, jsonb) to anon, authenticated;

-- Storage bucket for garment photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'topstore-woman-images',
  'topstore-woman-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

drop policy if exists "woman_storage_public_read" on storage.objects;
create policy "woman_storage_public_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'topstore-woman-images');

drop policy if exists "woman_storage_admin_insert" on storage.objects;
create policy "woman_storage_admin_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'topstore-woman-images'
    and exists (
      select 1 from public.woman_admin_users au
      where au.user_id = (select auth.uid())
    )
  );

drop policy if exists "woman_storage_admin_update" on storage.objects;
create policy "woman_storage_admin_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'topstore-woman-images'
    and exists (
      select 1 from public.woman_admin_users au
      where au.user_id = (select auth.uid())
    )
  )
  with check (
    bucket_id = 'topstore-woman-images'
    and exists (
      select 1 from public.woman_admin_users au
      where au.user_id = (select auth.uid())
    )
  );

drop policy if exists "woman_storage_admin_delete" on storage.objects;
create policy "woman_storage_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'topstore-woman-images'
    and exists (
      select 1 from public.woman_admin_users au
      where au.user_id = (select auth.uid())
    )
  );

-- Seed default store settings
insert into public.woman_store_settings (id)
values (1)
on conflict (id) do nothing;
