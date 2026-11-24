"use client";

import { useState } from "react";
import Image from "next/image";
import {
  X,
  Plus,
  Trash2,
  Upload,
  Loader2,
  Star,
  Save,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/format";
import type { ProductWithVariants } from "@/lib/types";

interface ProductEditorModalProps {
  product: ProductWithVariants | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

interface EditableVariant {
  id?: string;
  color_index: number;
  color_name: string;
  color_hex: string;
  images: string[];
  stock: number;
  is_active: boolean;
}

const DEFAULT_CATEGORIES = [
  "Abrigos y Chaquetas",
  "Blusas y Tejidos",
  "Pantalones y Jeans",
  "Bolsos",
  "Vestidos",
  "Conjuntos",
];

export function ProductEditorModal({
  product,
  onClose,
  onSaved,
}: ProductEditorModalProps) {
  const [refCode, setRefCode] = useState(product?.ref_code ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState(product?.category ?? "Blusas");
  const [price, setPrice] = useState(product?.price ?? 150000);
  const [compareAtPrice, setCompareAtPrice] = useState<string>(
    product?.compare_at_price ? String(product.compare_at_price) : ""
  );
  const [sizesText, setSizesText] = useState(
    (product?.sizes ?? ["S", "M", "L"]).join(", ")
  );
  const [description, setDescription] = useState(product?.description ?? "");
  const [fabricCare, setFabricCare] = useState(product?.fabric_care ?? "");
  const [sortOrder, setSortOrder] = useState(product?.sort_order ?? 10);
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false);
  const [isActive, setIsActive] = useState(product?.is_active ?? true);

  const [variants, setVariants] = useState<EditableVariant[]>(() =>
    product && product.variants.length > 0
      ? product.variants.map((v) => ({
          id: v.id,
          color_index: v.color_index,
          color_name: v.color_name,
          color_hex: v.color_hex,
          images: [...v.images],
          stock: v.stock,
          is_active: v.is_active,
        }))
      : [
          {
            color_index: 1,
            color_name: "Negro",
            color_hex: "#18181A",
            images: [],
            stock: 10,
            is_active: true,
          },
        ]
  );

  const [removedVariantIds, setRemovedVariantIds] = useState<string[]>([]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddVariant = () => {
    const nextIdx =
      variants.reduce((max, v) => Math.max(max, v.color_index), 0) + 1;
    setVariants((prev) => [
      ...prev,
      {
        color_index: nextIdx,
        color_name: `Color ${nextIdx}`,
        color_hex: "#C49377",
        images: [],
        stock: 10,
        is_active: true,
      },
    ]);
  };

  const handleRemoveVariant = (idx: number) => {
    const target = variants[idx];
    if (target?.id) {
      setRemovedVariantIds((prev) => [...prev, target.id!]);
    }
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUploadImages = async (variantIdx: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingIndex(variantIdx);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const safeRef = slugify(refCode || name || "prenda");
        const path = `${safeRef}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("topstore-woman-images")
          .upload(path, file, { upsert: true });

        if (uploadError) {
          throw uploadError;
        }

        const { data: pub } = supabase.storage
          .from("topstore-woman-images")
          .getPublicUrl(path);

        if (pub?.publicUrl) {
          uploadedUrls.push(pub.publicUrl);
        }
      }

      setVariants((prev) =>
        prev.map((v, i) =>
          i === variantIdx
            ? { ...v, images: [...v.images, ...uploadedUrls] }
            : v
        )
      );
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "No se pudo subir la imagen a Supabase Storage.";
      setError(msg);
    } finally {
      setUploadingIndex(null);
    }
  };

  const handlePromoteCover = (variantIdx: number, imgIdx: number) => {
    setVariants((prev) =>
      prev.map((v, i) => {
        if (i !== variantIdx) return v;
        const copy = [...v.images];
        const [selected] = copy.splice(imgIdx, 1);
        return { ...v, images: [selected, ...copy] };
      })
    );
  };

  const handleRemoveImage = (variantIdx: number, imgIdx: number) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === variantIdx
          ? { ...v, images: v.images.filter((_, j) => j !== imgIdx) }
          : v
      )
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const parsedSizes = sizesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      ref_code: refCode.trim().toUpperCase(),
      slug: product?.slug || slugify(`${name}-${refCode}`),
      name: name.trim(),
      category: category.trim(),
      price: Math.max(0, Math.round(Number(price) || 0)),
      compare_at_price: compareAtPrice.trim()
        ? Math.max(0, Math.round(Number(compareAtPrice) || 0))
        : null,
      sizes: parsedSizes.length > 0 ? parsedSizes : ["S", "M", "L"],
      description: description.trim(),
      fabric_care: fabricCare.trim(),
      sort_order: Number(sortOrder) || 0,
      is_featured: isFeatured,
      is_active: isActive,
    };

    try {
      const supabase = createSupabaseBrowserClient();
      let productId = product?.id;

      if (productId) {
        const { error: updateErr } = await supabase
          .from("woman_products")
          .update(payload)
          .eq("id", productId);
        if (updateErr) throw updateErr;
      } else {
        const { data: created, error: insertErr } = await supabase
          .from("woman_products")
          .insert(payload)
          .select("id")
          .single();
        if (insertErr || !created) throw insertErr ?? new Error("Error al crear prenda");
        productId = created.id;
      }

      if (removedVariantIds.length > 0) {
        const { error: delErr } = await supabase
          .from("woman_product_variants")
          .delete()
          .in("id", removedVariantIds);
        if (delErr) throw delErr;
      }

      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const variantPayload = {
          product_id: productId,
          color_index: i + 1,
          color_name: v.color_name.trim() || `Color ${i + 1}`,
          color_hex: v.color_hex.trim() || "#2B1F1B",
          images: v.images,
          stock: Math.max(0, Number(v.stock) || 0),
          is_active: v.is_active,
        };

        if (v.id) {
          const { error: vUpdateErr } = await supabase
            .from("woman_product_variants")
            .update(variantPayload)
            .eq("id", v.id);
          if (vUpdateErr) throw vUpdateErr;
        } else {
          const { error: vInsertErr } = await supabase
            .from("woman_product_variants")
            .insert(variantPayload);
          if (vInsertErr) throw vInsertErr;
        }
      }

      await onSaved();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron guardar los cambios."
      );
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!product) return;
    if (
      !window.confirm(
        `¿Eliminar definitivamente "${product.name}" (Ref. ${product.ref_code})?`
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: delErr } = await supabase
        .from("woman_products")
        .delete()
        .eq("id", product.id);
      if (delErr) throw delErr;
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar.");
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={product ? `Editar ${product.name}` : "Nueva prenda"}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-3 sm:p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-line bg-canvas p-6 sm:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar editor"
          className="absolute top-5 right-5 inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-dusty-rose">
              Editor de Catálogo
            </p>
            <h2 className="font-display text-3xl font-medium text-ink">
              {product ? `Editar: ${product.name}` : "Agregar Nueva Prenda"}
            </h2>
          </div>

          {error && (
            <div className="rounded-xl border border-dusty-rose bg-dusty-rose/10 px-4 py-3 text-xs font-medium text-dusty-rose-deep">
              {error}
            </div>
          )}

          {/* Main Product Fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
            <div className="sm:col-span-1">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink mb-1">
                Ref *
              </label>
              <input
                type="text"
                required
                value={refCode}
                onChange={(e) => setRefCode(e.target.value)}
                placeholder="G"
                className="w-full min-h-[42px] rounded-xl border border-line-strong bg-card px-3 text-sm uppercase"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink mb-1">
                Nombre de la prenda *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Blusa Seda Champagne"
                className="w-full min-h-[42px] rounded-xl border border-line-strong bg-card px-3 text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink mb-1">
                Categoría *
              </label>
              <input
                list="woman-categories-list"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-line-strong bg-card px-3 text-sm"
              />
              <datalist id="woman-categories-list">
                {DEFAULT_CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink mb-1">
                Precio actual (COP) *
              </label>
              <input
                type="number"
                min={0}
                step={1}
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value) || 0)}
                className="w-full min-h-[42px] rounded-xl border border-line-strong bg-card px-3 text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink mb-1">
                Precio anterior (opcional)
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                placeholder="Vacío si no hay oferta"
                className="w-full min-h-[42px] rounded-xl border border-line-strong bg-card px-3 text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink mb-1">
                Tallas (separadas por coma)
              </label>
              <input
                type="text"
                value={sizesText}
                onChange={(e) => setSizesText(e.target.value)}
                placeholder="XS, S, M, L"
                className="w-full min-h-[42px] rounded-xl border border-line-strong bg-card px-3 text-sm"
              />
            </div>

            <div className="sm:col-span-6">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink mb-1">
                Descripción
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-line-strong bg-card px-3 py-2 text-sm"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink mb-1">
                Tejido y Cuidados
              </label>
              <input
                type="text"
                value={fabricCare}
                onChange={(e) => setFabricCare(e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-line-strong bg-card px-3 text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink mb-1">
                Orden catálogo
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                className="w-full min-h-[42px] rounded-xl border border-line-strong bg-card px-3 text-sm"
              />
            </div>

            <div className="sm:col-span-6 flex flex-wrap gap-6 pt-1">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 accent-ink"
                />
                <span>Visible en el catálogo público</span>
              </label>

              <label className="inline-flex items-center gap-2 text-xs font-medium text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-4 w-4 accent-ink"
                />
                <span>Prenda destacada</span>
              </label>
            </div>
          </div>

          {/* Color Variants & Image Galleries */}
          <div className="space-y-4 border-t border-line pt-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-2xl font-medium text-ink">
                  Colores y Fotografías
                </h3>
                <p className="text-xs text-ink-soft">
                  Cada variante agrupa sus propias fotos. La primera foto es la portada de ese color.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-line-strong bg-card px-4 py-2 text-xs font-semibold text-ink hover:border-rose-gold-deep cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Agregar Color</span>
              </button>
            </div>

            {variants.map((variant, vIdx) => (
              <div
                key={variant.id ?? `new-v-${vIdx}`}
                className="rounded-2xl border border-line bg-card p-4 space-y-4"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 items-end">
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-semibold uppercase text-ink-soft mb-1">
                      Nombre del color
                    </label>
                    <input
                      type="text"
                      value={variant.color_name}
                      onChange={(e) =>
                        setVariants((prev) =>
                          prev.map((item, i) =>
                            i === vIdx
                              ? { ...item, color_name: e.target.value }
                              : item
                          )
                        )
                      }
                      className="w-full min-h-[40px] rounded-xl border border-line-strong bg-canvas px-3 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-semibold uppercase text-ink-soft mb-1">
                      Tono (Hex)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={variant.color_hex}
                        onChange={(e) =>
                          setVariants((prev) =>
                            prev.map((item, i) =>
                              i === vIdx
                                ? { ...item, color_hex: e.target.value }
                                : item
                            )
                          )
                        }
                        className="h-10 w-10 rounded-lg border border-line cursor-pointer"
                      />
                      <input
                        type="text"
                        value={variant.color_hex}
                        onChange={(e) =>
                          setVariants((prev) =>
                            prev.map((item, i) =>
                              i === vIdx
                                ? { ...item, color_hex: e.target.value }
                                : item
                            )
                          )
                        }
                        className="w-full min-h-[40px] rounded-xl border border-line-strong bg-canvas px-2.5 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold uppercase text-ink-soft mb-1">
                      Stock
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={variant.stock}
                      onChange={(e) =>
                        setVariants((prev) =>
                          prev.map((item, i) =>
                            i === vIdx
                              ? { ...item, stock: Number(e.target.value) || 0 }
                              : item
                          )
                        )
                      }
                      className="w-full min-h-[40px] rounded-xl border border-line-strong bg-canvas px-2.5 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2 flex justify-end">
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(vIdx)}
                        className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs text-dusty-rose-deep hover:bg-dusty-rose/10 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Quitar</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Variant Images */}
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-3">
                    {variant.images.map((imgUrl, imgIdx) => (
                      <div
                        key={`${imgUrl}-${imgIdx}`}
                        className="group relative h-24 w-18 overflow-hidden rounded-xl border border-line bg-surface"
                      >
                        <Image
                          src={imgUrl}
                          alt={`${variant.color_name} ${imgIdx + 1}`}
                          fill
                          sizes="72px"
                          className="object-cover object-top"
                        />
                        {imgIdx === 0 && (
                          <span className="absolute bottom-1 left-1 rounded bg-ink/80 px-1.5 py-0.5 text-[9px] font-semibold text-canvas">
                            Portada
                          </span>
                        )}
                        <div className="absolute top-1 right-1 flex gap-1">
                          {imgIdx > 0 && (
                            <button
                              type="button"
                              onClick={() => handlePromoteCover(vIdx, imgIdx)}
                              title="Usar como portada"
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-canvas/90 text-rose-gold-deep shadow-xs cursor-pointer"
                            >
                              <Star className="h-3 w-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(vIdx, imgIdx)}
                            title="Eliminar foto"
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-canvas/90 text-dusty-rose-deep shadow-xs cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Upload trigger */}
                    <label className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line-strong bg-canvas text-[10px] font-medium text-ink-soft hover:border-rose-gold-deep hover:text-ink transition-colors cursor-pointer">
                      {uploadingIndex === vIdx ? (
                        <Loader2 className="h-5 w-5 animate-spin text-rose-gold-deep" />
                      ) : (
                        <>
                          <Upload className="h-4 w-4 text-rose-gold-deep" />
                          <span>Subir foto</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        multiple
                        className="sr-only"
                        disabled={uploadingIndex === vIdx}
                        onChange={(e) => handleUploadImages(vIdx, e.target.files)}
                      />
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
            {product ? (
              <button
                type="button"
                disabled={saving}
                onClick={handleDeleteProduct}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium text-dusty-rose-deep hover:bg-dusty-rose/10 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Eliminar Prenda</span>
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] rounded-full border border-line-strong px-5 py-2 text-xs font-medium text-ink hover:bg-surface cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-canvas hover:bg-rose-gold-deep disabled:opacity-50 transition-colors cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
