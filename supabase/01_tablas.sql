-- BLOQUE 1: Tablas (27 líneas)
create table if not exists public.woman_admin_users (user_id uuid primary key references auth.users(id) on delete cascade, email text unique not null, created_at timestamptz not null default now());
create table if not exists public.woman_products (
  id uuid primary key default gen_random_uuid(), ref_code text unique not null, slug text unique not null, name text not null, category text not null,
  description text not null default '', fabric_care text not null default '', price integer not null default 0 check (price >= 0), compare_at_price integer,
  sizes text[] not null default array['S','M','L'], is_featured boolean not null default false, is_active boolean not null default true, sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.woman_product_variants (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.woman_products(id) on delete cascade, color_index integer not null default 1,
  color_name text not null, color_hex text not null default '#2B1F1B', images text[] not null default '{}', stock integer not null default 10 check (stock >= 0),
  is_active boolean not null default true, created_at timestamptz not null default now(), unique (product_id, color_index)
);
create sequence if not exists public.woman_order_seq start 1;
create table if not exists public.woman_orders (
  id uuid primary key default gen_random_uuid(), order_number text unique not null, customer_name text not null, customer_phone text not null,
  customer_city text not null default '', customer_address text not null default '', payment_method text not null default 'WhatsApp / Transferencia',
  status text not null default 'pendiente' check (status in ('pendiente','confirmado','enviado','entregado','cancelado')),
  source text not null default 'web' check (source in ('web','admin','whatsapp','instagram')), subtotal integer not null default 0, shipping_cost integer not null default 0,
  total integer not null default 0, tracking_code text, notes text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.woman_order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.woman_orders(id) on delete cascade,
  product_id uuid references public.woman_products(id) on delete set null, variant_id uuid references public.woman_product_variants(id) on delete set null,
  product_name text not null, color_name text not null, size text not null, quantity integer not null check (quantity > 0), unit_price integer not null, line_total integer not null, image_url text
);
create table if not exists public.woman_store_settings (
  id integer primary key default 1 check (id = 1), brand_name text not null default 'TOPSTORE WOMAN', tagline text not null default 'Ropa Premium Para Ella',
  whatsapp_number text not null default '573205172484', instagram_handle text not null default '@topstore_18', parent_brand_url text not null default 'https://topstorecolombia.com',
  announcement_bar text not null default 'Envíos a todo Colombia · Nueva Colección Elegante TOPSTORE WOMAN',
  shipping_note text not null default 'Envíos seguros desde Pasto a todo Colombia. Atención personalizada vía WhatsApp.',
  default_shipping_cost integer not null default 0, updated_at timestamptz not null default now()
);
insert into public.woman_store_settings (id) values (1) on conflict (id) do nothing;
