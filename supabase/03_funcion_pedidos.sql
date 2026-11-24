-- BLOQUE 3: Función segura de pedidos desde la web (35 líneas)
create or replace function public.create_woman_order(
  p_customer_name text, p_customer_phone text, p_customer_city text,
  p_customer_address text, p_payment_method text, p_notes text, p_items jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_oid uuid; v_num text; v_sub integer := 0; v_ship integer := 0; v_tot integer := 0;
  v_it jsonb; v_p record; v_v record; v_q integer; v_lt integer;
begin
  if trim(coalesce(p_customer_name,'')) = '' or trim(coalesce(p_customer_phone,'')) = '' then raise exception 'Nombre y teléfono obligatorios'; end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then raise exception 'Agrega al menos una prenda'; end if;
  select coalesce(default_shipping_cost, 0) into v_ship from public.woman_store_settings where id = 1;
  v_num := 'TSW-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.woman_order_seq')::text, 4, '0');
  insert into public.woman_orders (order_number, customer_name, customer_phone, customer_city, customer_address, payment_method, status, source, subtotal, shipping_cost, total, notes)
  values (v_num, left(trim(p_customer_name),120), left(trim(p_customer_phone),40), left(trim(coalesce(p_customer_city,'')),80), left(trim(coalesce(p_customer_address,'')),240), left(trim(coalesce(p_payment_method,'WhatsApp')),80), 'pendiente', 'web', 0, coalesce(v_ship,0), 0, left(trim(coalesce(p_notes,'')),500))
  returning id into v_oid;
  for v_it in select * from jsonb_array_elements(p_items) loop
    v_q := coalesce((v_it->>'quantity')::integer, 0);
    if v_q <= 0 or v_q > 50 then raise exception 'Cantidad inválida'; end if;
    select id, name, price into v_p from public.woman_products where id = (v_it->>'product_id')::uuid and is_active = true;
    if not found then raise exception 'Prenda no disponible'; end if;
    select id, color_name, images into v_v from public.woman_product_variants where id = (v_it->>'variant_id')::uuid and product_id = v_p.id;
    v_lt := v_p.price * v_q; v_sub := v_sub + v_lt;
    insert into public.woman_order_items (order_id, product_id, variant_id, product_name, color_name, size, quantity, unit_price, line_total, image_url)
    values (v_oid, v_p.id, v_v.id, v_p.name, coalesce(v_v.color_name, coalesce(v_it->>'color_name','Único')), left(coalesce(v_it->>'size','M'),20), v_q, v_p.price, v_lt, case when array_length(v_v.images,1) > 0 then v_v.images[1] else null end);
  end loop;
  v_tot := v_sub + coalesce(v_ship, 0);
  update public.woman_orders set subtotal = v_sub, total = v_tot where id = v_oid;
  return jsonb_build_object('id', v_oid, 'order_number', v_num, 'subtotal', v_sub, 'shipping_cost', coalesce(v_ship,0), 'total', v_tot);
end; $$;
revoke all on function public.create_woman_order(text,text,text,text,text,text,jsonb) from public;
grant execute on function public.create_woman_order(text,text,text,text,text,text,jsonb) to anon, authenticated;
