"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Eye, EyeOff } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatCOP } from "@/lib/format";
import { ProductEditorModal } from "./ProductEditorModal";
import type { ProductWithVariants } from "@/lib/types";

interface ProductsPanelProps {
  products: ProductWithVariants[];
  onProductsChanged: () => Promise<void>;
}

export function ProductsPanel({
  products,
  onProductsChanged,
}: ProductsPanelProps) {
  const [editingProduct, setEditingProduct] = useState<
    ProductWithVariants | "new" | null
  >(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggleActive = async (product: ProductWithVariants) => {
    setTogglingId(product.id);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase
        .from("woman_products")
        .update({ is_active: !product.is_active })
        .eq("id", product.id);
      await onProductsChanged();
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-medium text-ink">
            Catálogo de Prendas
          </h2>
          <p className="text-xs text-ink-soft mt-1">
            Edita nombres, precios, descripciones, colores y fotografías en tiempo real.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setEditingProduct("new")}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-canvas hover:bg-rose-gold-deep transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva Prenda</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {products.map((product) => {
          const cover =
            product.variants[0]?.images?.[0] ?? "/media/logo.jpeg";

          return (
            <div
              key={product.id}
              className={`flex gap-4 rounded-2xl border p-4 transition-all ${
                product.is_active
                  ? "border-line bg-card"
                  : "border-line/60 bg-surface/50 opacity-75"
              }`}
            >
              <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-xl bg-surface border border-line/70">
                <Image
                  src={cover}
                  alt={product.name}
                  fill
                  sizes="96px"
                  className="object-cover object-top"
                />
                <span className="absolute top-1.5 left-1.5 rounded-full bg-canvas/90 px-2 py-0.5 text-[10px] font-bold text-ink">
                  {product.ref_code}
                </span>
              </div>

              <div className="flex flex-1 flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-dusty-rose">
                        {product.category}
                      </p>
                      <h3 className="font-display text-xl font-semibold text-ink truncate">
                        {product.name}
                      </h3>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                        product.is_active
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-stone-200 text-stone-700"
                      }`}
                    >
                      {product.is_active ? "Visible" : "Oculta"}
                    </span>
                  </div>

                  <div className="mt-1.5 flex items-baseline gap-2">
                    <span className="text-sm font-bold text-ink">
                      {formatCOP(product.price)}
                    </span>
                    {product.compare_at_price &&
                      product.compare_at_price > product.price && (
                        <span className="text-xs text-ink-muted line-through">
                          {formatCOP(product.compare_at_price)}
                        </span>
                      )}
                  </div>

                  {/* Variants dots */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    {product.variants.map((v) => (
                      <span
                        key={v.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas px-2 py-0.5 text-[11px] text-ink-soft"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full border border-ink/20"
                          style={{ backgroundColor: v.color_hex }}
                        />
                        {v.color_name} ({v.images.length})
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-line/70">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(product)}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 text-xs font-medium text-canvas hover:bg-rose-gold-deep transition-colors cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    disabled={togglingId === product.id}
                    onClick={() => handleToggleActive(product)}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-line-strong bg-canvas px-3.5 py-1.5 text-xs font-medium text-ink hover:border-rose-gold-deep transition-colors cursor-pointer"
                  >
                    {product.is_active ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" />
                        <span>Ocultar</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        <span>Publicar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editingProduct && (
        <ProductEditorModal
          product={editingProduct === "new" ? null : editingProduct}
          onClose={() => setEditingProduct(null)}
          onSaved={async () => {
            setEditingProduct(null);
            await onProductsChanged();
          }}
        />
      )}
    </div>
  );
}
