# TOPSTORE WOMAN — Catálogo de Moda Elegante

Catálogo web oficial de **TOPSTORE WOMAN — Ropa Premium Para Ella**, la línea elegante femenina de **TOPSTORE Colombia** (`topstorecolombia.com`).

## Stack Técnico

- **Framework:** Next.js 15 (App Router) + TypeScript Strict
- **Estilos:** Tailwind CSS v4 + sistema de diseño generado con `ui-ux-pro-max-skill` (`design-system/topstore-woman/MASTER.md`) y paleta extraída del logo oficial (Rose Gold, Dusty Rose, Champagne Sand y Warm Ivory)
- **Animaciones:** GSAP + ScrollTrigger + `@gsap/react` (con soporte `prefers-reduced-motion`)
- **Estado del Carrito:** Zustand con persistencia local
- **Base de Datos, Auth y Storage:** Supabase (`@supabase/ssr` + `@supabase/supabase-js`)

## Configuración de Supabase (Proyecto Independiente)

1. Crea un proyecto nuevo de Supabase exclusivo para **TOPSTORE WOMAN** (totalmente separado de la tienda deportiva) y pega su `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.local`.
2. Abre el **SQL Editor** del nuevo proyecto y ejecuta primero `supabase/schema.sql` (crea tablas, índices, políticas RLS, RPC seguro `create_woman_order` y el bucket `topstore-woman-images`).
3. Ejecuta luego `supabase/seed.sql` para cargar las 6 prendas iniciales (`A` a `F`) con sus 13 variantes de color y 23 fotografías.
4. Crea tu usuario administrador en **Authentication → Users** (correo + contraseña) y autorízalo ejecutando en SQL Editor:

```sql
insert into public.woman_admin_users (user_id, email)
select id, email from auth.users where email = 'tu-correo@ejemplo.com';
```

## Acceso Oculto al Panel de Administrador

- Haz **3 clics seguidos** sobre el símbolo de estrella (`✦`) en el pie de página (`© 2026 TOPSTORE WOMAN ✦ Una línea de TOPSTORE Colombia`), o
- Presiona **`Ctrl + Shift + A`** desde cualquier sección del catálogo.
- También puedes acceder directamente a `/admin` (protegido con Supabase Auth y bloqueado para buscadores en `robots.txt`).

## Desarrollo Local

```bash
npm install
npm run dev
```

## Verificación

```bash
npm run typecheck
npm test
npm run build
```
