-- BLOQUE 2: Seguridad RLS + Storage (32 líneas)
create index if not exists idx_woman_variants_prod on public.woman_product_variants (product_id, color_index);
create index if not exists idx_woman_items_order on public.woman_order_items (order_id);
grant select on public.woman_products, public.woman_product_variants, public.woman_store_settings to anon, authenticated;
grant insert, update, delete on public.woman_products, public.woman_product_variants, public.woman_store_settings to authenticated;
grant select, insert, update, delete on public.woman_orders, public.woman_order_items to authenticated;
grant select on public.woman_admin_users to authenticated;
grant usage, select on sequence public.woman_order_seq to authenticated;
alter table public.woman_admin_users enable row level security;
alter table public.woman_products enable row level security;
alter table public.woman_product_variants enable row level security;
alter table public.woman_orders enable row level security;
alter table public.woman_order_items enable row level security;
alter table public.woman_store_settings enable row level security;
create policy "admin_own" on public.woman_admin_users for select to authenticated using ((select auth.uid()) = user_id);
create policy "prod_read_anon" on public.woman_products for select to anon using (is_active);
create policy "prod_read_auth" on public.woman_products for select to authenticated using (is_active or exists (select 1 from public.woman_admin_users where user_id = (select auth.uid())));
create policy "prod_admin" on public.woman_products for all to authenticated using (exists (select 1 from public.woman_admin_users where user_id = (select auth.uid()))) with check (exists (select 1 from public.woman_admin_users where user_id = (select auth.uid())));
create policy "var_read_anon" on public.woman_product_variants for select to anon using (is_active);
create policy "var_read_auth" on public.woman_product_variants for select to authenticated using (is_active or exists (select 1 from public.woman_admin_users where user_id = (select auth.uid())));
create policy "var_admin" on public.woman_product_variants for all to authenticated using (exists (select 1 from public.woman_admin_users where user_id = (select auth.uid()))) with check (exists (select 1 from public.woman_admin_users where user_id = (select auth.uid())));
create policy "set_read" on public.woman_store_settings for select to anon, authenticated using (true);
create policy "set_admin" on public.woman_store_settings for all to authenticated using (exists (select 1 from public.woman_admin_users where user_id = (select auth.uid()))) with check (exists (select 1 from public.woman_admin_users where user_id = (select auth.uid())));
create policy "ord_admin" on public.woman_orders for all to authenticated using (exists (select 1 from public.woman_admin_users where user_id = (select auth.uid()))) with check (exists (select 1 from public.woman_admin_users where user_id = (select auth.uid())));
create policy "item_admin" on public.woman_order_items for all to authenticated using (exists (select 1 from public.woman_admin_users where user_id = (select auth.uid()))) with check (exists (select 1 from public.woman_admin_users where user_id = (select auth.uid())));
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('topstore-woman-images', 'topstore-woman-images', true, 10485760, array['image/jpeg','image/png','image/webp','image/avif']) on conflict (id) do nothing;
create policy "img_read" on storage.objects for select to anon, authenticated using (bucket_id = 'topstore-woman-images');
create policy "img_admin" on storage.objects for all to authenticated using (bucket_id = 'topstore-woman-images' and exists (select 1 from public.woman_admin_users where user_id = (select auth.uid()))) with check (bucket_id = 'topstore-woman-images' and exists (select 1 from public.woman_admin_users where user_id = (select auth.uid())));
