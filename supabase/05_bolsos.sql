-- BLOQUE 5: Agregar Bolso Hobo Cherry Atelier (Ref. G) — $69.900 COP, Talla Única, 1 unidad por color (12 líneas)
with pg as (
  insert into public.woman_products (ref_code, slug, name, category, description, fabric_care, price, compare_at_price, sizes, is_featured, is_active, sort_order)
  values (
    'G', 'bolso-hobo-cherry-atelier', 'Bolso Hobo Cherry Atelier', 'Bolsos',
    'Bolso de hombro de silueta curva estructurada con herrajes dorados, cremallera metálica superior, correa intercambiable y dije decorativo de cerezas con brillo sutil. Edición limitada: una unidad exclusiva por color.',
    'Cuero sintético granulado y lona monograma de alta resistencia. Limpiar con paño suave seco.',
    69900, null, array['Talla Única'], true, true, 7
  ) on conflict (ref_code) do update set name = excluded.name, price = excluded.price, sizes = excluded.sizes, category = excluded.category returning id
)
insert into public.woman_product_variants (product_id, color_index, color_name, color_hex, images, stock, is_active)
select id, 1, 'Monograma Café & Cereza', '#4E342E', array['/media/garments/g-1.0.jpeg','/media/garments/g-1.1.jpeg','/media/garments/g-1.2.jpeg'], 1, true from pg union all
select id, 2, 'Blanco Marfil & Rosa', '#F5F2EB', array['/media/garments/g-2.0.jpeg','/media/garments/g-2.1.jpeg','/media/garments/g-2.2.jpeg'], 1, true from pg union all
select id, 3, 'Negro Ónix & Cereza', '#171719', array['/media/garments/g-3.0.jpeg','/media/garments/g-3.1.jpeg','/media/garments/g-3.2.jpeg'], 1, true from pg
on conflict (product_id, color_index) do update set stock = 1, images = excluded.images;
