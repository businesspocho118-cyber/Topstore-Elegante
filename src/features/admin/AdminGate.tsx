"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DEFAULT_STORE_SETTINGS } from "@/lib/catalog-seed-data";
import { createSupabaseBrowserClient, getSupabaseEnv } from "@/lib/supabase/client";
import { AdminDashboard } from "./AdminDashboard";
import type {
  Order,
  OrderItem,
  OrderWithItems,
  Product,
  ProductVariant,
  ProductWithVariants,
  StoreSettings,
} from "@/lib/types";

interface AdminState {
  adminEmail: string;
  products: ProductWithVariants[];
  orders: OrderWithItems[];
  settings: StoreSettings;
}

export function AdminGate() {
  const router = useRouter();
  const [adminState, setAdminState] = useState<AdminState | null>(null);

  useEffect(() => {
    let active = true;

    async function verifyAndLoad() {
      if (!getSupabaseEnv()) {
        router.replace("/admin/login");
        return;
      }

      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/admin/login");
          return;
        }

        const { data: adminRecord } = await supabase
          .from("woman_admin_users")
          .select("user_id, email")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!adminRecord) {
          await supabase.auth.signOut();
          router.replace("/admin/login");
          return;
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

        if (!active) return;

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

        setAdminState({
          adminEmail: adminRecord.email,
          products,
          orders,
          settings,
        });
      } catch {
        if (active) {
          router.replace("/admin/login");
        }
      }
    }

    verifyAndLoad();

    return () => {
      active = false;
    };
  }, [router]);

  if (!adminState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-rose-gold-deep" />
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-soft">
            Verificando acceso...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminDashboard
      adminEmail={adminState.adminEmail}
      initialProducts={adminState.products}
      initialOrders={adminState.orders}
      initialSettings={adminState.settings}
    />
  );
}
