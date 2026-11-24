"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  ShoppingBag,
  Settings,
  LogOut,
  ExternalLink,
  RefreshCw,
  Clock,
  DollarSign,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatCOP } from "@/lib/format";
import { OrdersPanel } from "./OrdersPanel";
import { ProductsPanel } from "./ProductsPanel";
import { SettingsPanel } from "./SettingsPanel";
import type {
  Order,
  OrderItem,
  OrderWithItems,
  Product,
  ProductVariant,
  ProductWithVariants,
  StoreSettings,
} from "@/lib/types";

interface AdminDashboardProps {
  adminEmail: string;
  initialProducts: ProductWithVariants[];
  initialOrders: OrderWithItems[];
  initialSettings: StoreSettings;
}

type AdminTab = "orders" | "products" | "settings";

export function AdminDashboard({
  adminEmail,
  initialProducts,
  initialOrders,
  initialSettings,
}: AdminDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("orders");
  const [products, setProducts] = useState<ProductWithVariants[]>(initialProducts);
  const [orders, setOrders] = useState<OrderWithItems[]>(initialOrders);
  const [settings, setSettings] = useState<StoreSettings>(initialSettings);
  const [refreshing, setRefreshing] = useState(false);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const supabase = createSupabaseBrowserClient();
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

      if (!productsRes.error && !variantsRes.error) {
        const variantsMap = new Map<string, ProductVariant[]>();
        for (const v of (variantsRes.data ?? []) as ProductVariant[]) {
          const list = variantsMap.get(v.product_id) ?? [];
          list.push(v);
          variantsMap.set(v.product_id, list);
        }
        setProducts(
          ((productsRes.data ?? []) as Product[]).map((p) => ({
            ...p,
            variants: variantsMap.get(p.id) ?? [],
          }))
        );
      }

      if (!ordersRes.error && !orderItemsRes.error) {
        const itemsMap = new Map<string, OrderItem[]>();
        for (const i of (orderItemsRes.data ?? []) as OrderItem[]) {
          const list = itemsMap.get(i.order_id) ?? [];
          list.push(i);
          itemsMap.set(i.order_id, list);
        }
        setOrders(
          ((ordersRes.data ?? []) as Order[]).map((o) => ({
            ...o,
            items: itemsMap.get(o.id) ?? [],
          }))
        );
      }

      if (!settingsRes.error && settingsRes.data) {
        setSettings(settingsRes.data as StoreSettings);
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  const pendingCount = orders.filter((o) => o.status === "pendiente").length;
  const activeProductsCount = products.filter((p) => p.is_active).length;
  const revenueTotal = orders
    .filter((o) => o.status !== "cancelado")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 border-b border-line bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-rose-gold/60">
              <Image
                src="/media/logo.jpeg"
                alt="TOPSTORE WOMAN"
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold text-ink leading-none">
                TOPSTORE WOMAN · Admin
              </h1>
              <p className="text-xs text-ink-soft mt-0.5">{adminEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={refreshAll}
              disabled={refreshing}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-line bg-canvas px-3.5 py-2 text-xs font-medium text-ink hover:border-rose-gold-deep transition-colors cursor-pointer"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            <Link
              href="/"
              target="_blank"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-line bg-canvas px-3.5 py-2 text-xs font-medium text-ink hover:border-rose-gold-deep transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 text-rose-gold-deep" />
              <span className="hidden sm:inline">Ver Catálogo</span>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-medium text-canvas hover:bg-dusty-rose-deep transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* KPI Overview */}
        <section
          aria-label="Resumen de tienda"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="rounded-2xl border border-line bg-card p-5">
            <div className="flex items-center justify-between text-ink-soft">
              <span className="text-xs uppercase tracking-[0.14em] font-medium">
                Pedidos Totales
              </span>
              <ShoppingBag className="h-4 w-4 text-rose-gold-deep" />
            </div>
            <p className="mt-2 font-display text-4xl font-semibold text-ink">
              {orders.length}
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-card p-5">
            <div className="flex items-center justify-between text-ink-soft">
              <span className="text-xs uppercase tracking-[0.14em] font-medium">
                Pendientes
              </span>
              <Clock className="h-4 w-4 text-dusty-rose" />
            </div>
            <p className="mt-2 font-display text-4xl font-semibold text-dusty-rose-deep">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-card p-5">
            <div className="flex items-center justify-between text-ink-soft">
              <span className="text-xs uppercase tracking-[0.14em] font-medium">
                Volumen Pedidos
              </span>
              <DollarSign className="h-4 w-4 text-rose-gold-deep" />
            </div>
            <p className="mt-2 font-display text-3xl font-semibold text-ink">
              {formatCOP(revenueTotal)}
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-card p-5">
            <div className="flex items-center justify-between text-ink-soft">
              <span className="text-xs uppercase tracking-[0.14em] font-medium">
                Prendas Activas
              </span>
              <Package className="h-4 w-4 text-rose-gold-deep" />
            </div>
            <p className="mt-2 font-display text-4xl font-semibold text-ink">
              {activeProductsCount}{" "}
              <span className="text-base font-sans font-normal text-ink-soft">
                / {products.length}
              </span>
            </p>
          </div>
        </section>

        {/* Tab Bar */}
        <div
          role="tablist"
          aria-label="Secciones del panel administrador"
          className="flex flex-wrap gap-2 border-b border-line pb-4"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "orders"}
            onClick={() => setActiveTab("orders")}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] transition-all cursor-pointer ${
              activeTab === "orders"
                ? "bg-ink text-canvas"
                : "border border-line bg-card text-ink-soft hover:text-ink hover:border-rose-gold"
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Pedidos ({orders.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "products"}
            onClick={() => setActiveTab("products")}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] transition-all cursor-pointer ${
              activeTab === "products"
                ? "bg-ink text-canvas"
                : "border border-line bg-card text-ink-soft hover:text-ink hover:border-rose-gold"
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Productos y Precios ({products.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] transition-all cursor-pointer ${
              activeTab === "settings"
                ? "bg-ink text-canvas"
                : "border border-line bg-card text-ink-soft hover:text-ink hover:border-rose-gold"
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Ajustes de Tienda</span>
          </button>
        </div>

        {/* Active Panel */}
        {activeTab === "orders" && (
          <OrdersPanel
            orders={orders}
            products={products}
            onOrdersChanged={refreshAll}
          />
        )}

        {activeTab === "products" && (
          <ProductsPanel products={products} onProductsChanged={refreshAll} />
        )}

        {activeTab === "settings" && (
          <SettingsPanel
            settings={settings}
            onSaved={(updated) => setSettings(updated)}
          />
        )}
      </main>
    </div>
  );
}
