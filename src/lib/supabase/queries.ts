import { DEFAULT_STORE_SETTINGS, SEED_PRODUCTS } from "@/lib/catalog-seed-data";
import type {
  Product,
  ProductVariant,
  ProductWithVariants,
  StoreSettings,
} from "@/lib/types";
import { createSupabaseBrowserClient, getSupabaseEnv } from "./client";

export interface CatalogPayload {
  products: ProductWithVariants[];
  settings: StoreSettings;
  dataSource: "supabase" | "local-fallback";
}

export async function getPublicCatalogData(): Promise<CatalogPayload> {
  if (!getSupabaseEnv()) {
    return {
      products: SEED_PRODUCTS,
      settings: DEFAULT_STORE_SETTINGS,
      dataSource: "local-fallback",
    };
  }

  const supabase = createSupabaseBrowserClient();

  try {
    const [productsRes, variantsRes, settingsRes] = await Promise.all([
      supabase
        .from("woman_products")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("woman_product_variants")
        .select("*")
        .eq("is_active", true)
        .order("color_index", { ascending: true }),
      supabase
        .from("woman_store_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle(),
    ]);

    if (productsRes.error || variantsRes.error) {
      return {
        products: SEED_PRODUCTS,
        settings: DEFAULT_STORE_SETTINGS,
        dataSource: "local-fallback",
      };
    }

    const rawProducts = (productsRes.data ?? []) as Product[];
    const rawVariants = (variantsRes.data ?? []) as ProductVariant[];

    if (rawProducts.length === 0) {
      return {
        products: SEED_PRODUCTS,
        settings: (settingsRes.data as StoreSettings | null) ?? DEFAULT_STORE_SETTINGS,
        dataSource: "local-fallback",
      };
    }

    const variantsByProduct = new Map<string, ProductVariant[]>();
    for (const variant of rawVariants) {
      const list = variantsByProduct.get(variant.product_id) ?? [];
      list.push(variant);
      variantsByProduct.set(variant.product_id, list);
    }

    const products: ProductWithVariants[] = rawProducts.map((product) => ({
      ...product,
      variants: variantsByProduct.get(product.id) ?? [],
    }));

    return {
      products,
      settings: (settingsRes.data as StoreSettings | null) ?? DEFAULT_STORE_SETTINGS,
      dataSource: "supabase",
    };
  } catch {
    return {
      products: SEED_PRODUCTS,
      settings: DEFAULT_STORE_SETTINGS,
      dataSource: "local-fallback",
    };
  }
}
