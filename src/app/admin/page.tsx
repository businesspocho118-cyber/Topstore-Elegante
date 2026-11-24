import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_STORE_SETTINGS } from "@/lib/catalog-seed-data";
import { AdminDashboard } from "@/features/admin/AdminDashboard";
import type {
  Order,
  OrderItem,
  OrderWithItems,
  Product,
  ProductVariant,
  ProductWithVariants,
  StoreSettings,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panel Privado | TOPSTORE WOMAN",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/admin/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: adminRecord } = await supabase
    .from("woman_admin_users")
    .select("user_id, email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRecord) {
    redirect("/admin/login");
  }

  const [productsRes, variantsRes, ordersRes, orderItemsRes, settingsRes] =
    await Promise.all([
      supabase
        .from("woman_products")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("woman_product_variants")
        .select("*")
        .order("color_index", { ascending: true }),
      supabase
        .from("woman_orders")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("woman_order_items").select("*"),
      supabase
        .from("woman_store_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle(),
    ]);

  const variantsByProduct = new Map<string, ProductVariant[]>();
  for (const variant of (variantsRes.data ?? []) as ProductVariant[]) {
    const list = variantsByProduct.get(variant.product_id) ?? [];
    list.push(variant);
    variantsByProduct.set(variant.product_id, list);
  }

  const products: ProductWithVariants[] = (
    (productsRes.data ?? []) as Product[]
  ).map((p) => ({
    ...p,
    variants: variantsByProduct.get(p.id) ?? [],
  }));

  const itemsByOrder = new Map<string, OrderItem[]>();
  for (const item of (orderItemsRes.data ?? []) as OrderItem[]) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }

  const orders: OrderWithItems[] = ((ordersRes.data ?? []) as Order[]).map(
    (o) => ({
      ...o,
      items: itemsByOrder.get(o.id) ?? [],
    })
  );

  const settings: StoreSettings =
    (settingsRes.data as StoreSettings | null) ?? DEFAULT_STORE_SETTINGS;

  return (
    <AdminDashboard
      adminEmail={adminRecord.email}
      initialProducts={products}
      initialOrders={orders}
      initialSettings={settings}
    />
  );
}
