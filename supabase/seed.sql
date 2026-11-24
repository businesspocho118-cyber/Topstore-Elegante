-- ============================================================================
-- TOPSTORE WOMAN — Seed inicial de las 6 prendas (A–F) y 13 variantes de color
-- ============================================================================

with p_a as (
  insert into public.woman_products (ref_code, slug, name, category, description, fabric_care, price, compare_at_price, sizes, is_featured, is_active, sort_order)
  values (
    'A',
    'blusa-capa-asimetrica-aura',
    'Blusa Capa Asimétrica Aura',
    'Blusas',
    'Silueta fluida estilo capa con caída asimétrica en gasa ligera y cintura drapeada que estiliza la figura con elegancia natural. Ideal para cenas, eventos y looks de noche sofisticados.',
    'Chifón crepé de caída suave. Lavar a mano con agua fría, no retorcer, planchar al vapor a temperatura baja.',
    145000,
    175000,
    array['XS','S','M','L'],
    true,
    true,
    1
  )
  on conflict (ref_code) do update set name = excluded.name
  returning id
),
p_b as (
  insert into public.woman_products (ref_code, slug, name, category, description, fabric_care, price, compare_at_price, sizes, is_featured, is_active, sort_order)
  values (
    'B',
    'trench-corto-cinturado-milano',
    'Trench Corto Cinturado Milano',
    'Abrigos y Chaquetas',
    'Gabardina corta estructurada de cuello alto con doble botonadura carey dorada, mangas abullonadas con puño elástico y cinturón lazo que define la cintura con aire parisino.',
    'Paño ligero de tacto suave con forro interior. Limpieza en seco o lavado delicado en frío.',
    235000,
    279000,
    array['S','M','L'],
    true,
    true,
    2
  )
  on conflict (ref_code) do update set name = excluded.name
  returning id
),
p_c as (
  insert into public.woman_products (ref_code, slug, name, category, description, fabric_care, price, compare_at_price, sizes, is_featured, is_active, sort_order)
  values (
    'C',
    'sueter-trenzado-cuello-v-heritage',
    'Suéter Trenzado Cuello V Heritage',
    'Tejidos',
    'Suéter clásico de punto trenzado cable-knit con escote en V, puños y pretina acanalados y bordado ecuestre sutil. Una pieza atemporal de lujo silencioso para elevar cualquier outfit.',
    'Tejido de punto suave mezcla algodón premium. Lavar en ciclo delicado en frío y secar en plano.',
    165000,
    null,
    array['XS','S','M','L'],
    true,
    true,
    3
  )
  on conflict (ref_code) do update set name = excluded.name
  returning id
),
p_d as (
  insert into public.woman_products (ref_code, slug, name, category, description, fabric_care, price, compare_at_price, sizes, is_featured, is_active, sort_order)
  values (
    'D',
    'chaqueta-cropped-presillas-velvet',
    'Chaqueta Cropped Presillas Velvet',
    'Abrigos y Chaquetas',
    'Chaqueta bomber corta de textura aterciopelada con cuello alto, cremallera metálica dorada frontal, mangas con volumen y presillas decorativas estilo brandeburgo.',
    'Tejido tipo gamuza aterciopelada de tacto cálido. Lavar a mano o en ciclo suave con prenda al revés.',
    215000,
    249000,
    array['S','M','L'],
    false,
    true,
    4
  )
  on conflict (ref_code) do update set name = excluded.name
  returning id
),
p_e as (
  insert into public.woman_products (ref_code, slug, name, category, description, fabric_care, price, compare_at_price, sizes, is_featured, is_active, sort_order)
  values (
    'E',
    'chaqueta-ecocuero-asimetrica-luxe',
    'Chaqueta Ecocuero Asimétrica Luxe',
    'Abrigos y Chaquetas',
    'Chaqueta biker estructurada en ecocuero con sutil textura grabada, cuello alto con doble broche, cierre diagonal asimétrico y mangas globo que aportan carácter y distinción.',
    'Ecocuero texturizado de alta durabilidad. Limpiar con paño húmedo suave; no usar blanqueador ni plancha.',
    255000,
    295000,
    array['S','M','L'],
    true,
    true,
    5
  )
  on conflict (ref_code) do update set name = excluded.name
  returning id
),
p_f as (
  insert into public.woman_products (ref_code, slug, name, category, description, fabric_care, price, compare_at_price, sizes, is_featured, is_active, sort_order)
  values (
    'F',
    'jean-flare-tiro-alto-silhouette',
    'Jean Flare Tiro Alto Silhouette',
    'Pantalones y Jeans',
    'Jean bota campana de tiro alto con horma estilizada de realce natural que alarga visualmente las piernas. Confección en denim estructurado con confort elástico para uso diario o elegante.',
    'Denim premium stretch. Lavar al revés con agua fría y colores similares; secar a la sombra.',
    179000,
    null,
    array['6','8','10','12','14'],
    false,
    true,
    6
  )
  on conflict (ref_code) do update set name = excluded.name
  returning id
)
insert into public.woman_product_variants (product_id, color_index, color_name, color_hex, images, stock, is_active)
select id, 1, 'Negro Ónix', '#141414', array['/media/garments/a-1.0.jpeg'], 12, true from p_a
union all
select id, 2, 'Blanco Marfil', '#F8F7F4', array['/media/garments/a-2.0.jpeg'], 12, true from p_a
union all
select id, 1, 'Café Espresso', '#3E2723', array['/media/garments/b-1.0.jpeg', '/media/garments/b-1.1.jpeg'], 10, true from p_b
union all
select id, 2, 'Beige Arena', '#CBB9A1', array['/media/garments/b-2.0.jpeg', '/media/garments/b-2.1.jpeg'], 10, true from p_b
union all
select id, 1, 'Crema Vainilla', '#EDE4D3', array['/media/garments/c-1.0.jpeg', '/media/garments/c-1.1.jpeg', '/media/garments/c-1.2.jpeg'], 14, true from p_c
union all
select id, 2, 'Azul Marino Real', '#18254A', array['/media/garments/c-2.0.jpeg', '/media/garments/c-2.1.jpeg', '/media/garments/c-2.2.jpeg'], 14, true from p_c
union all
select id, 1, 'Café Moka', '#422B22', array['/media/garments/d-1.0.jpeg', '/media/garments/d-1.1.jpeg'], 10, true from p_d
union all
select id, 2, 'Beige Champaña', '#D9CEBE', array['/media/garments/d-2.0.jpeg', '/media/garments/d-2.1.jpeg'], 10, true from p_d
union all
select id, 1, 'Vino Borgoña', '#5A1A26', array['/media/garments/e-1.0.jpeg'], 8, true from p_e
union all
select id, 2, 'Café Chocolate', '#44261C', array['/media/garments/e-2.0.jpeg'], 8, true from p_e
union all
select id, 3, 'Negro Nocturno', '#18181A', array['/media/garments/e-3.0.jpeg'], 8, true from p_e
union all
select id, 1, 'Denim Índigo Oscuro', '#1F3557', array['/media/garments/f-1.1.jpeg', '/media/garments/f-1.0.jpeg'], 15, true from p_f
union all
select id, 2, 'Crudo Marfil', '#EAE3D2', array['/media/garments/f-2.1.jpeg', '/media/garments/f-2.0.jpeg'], 15, true from p_f
on conflict (product_id, color_index) do nothing;
