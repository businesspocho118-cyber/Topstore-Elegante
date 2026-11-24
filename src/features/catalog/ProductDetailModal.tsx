"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  MessageCircle,
  Check,
  Minus,
  Plus,
  Truck,
} from "lucide-react";
import { buildWhatsAppInquiryUrl, formatCOP } from "@/lib/format";
import { useCartStore } from "@/features/cart/useCartStore";
import type {
  ProductVariant,
  ProductWithVariants,
  StoreSettings,
} from "@/lib/types";

interface ProductDetailModalProps {
  product: ProductWithVariants;
  initialVariant: ProductVariant;
  settings: StoreSettings;
  onClose: () => void;
}

export function ProductDetailModal({
  product,
  initialVariant,
  settings,
  onClose,
}: ProductDetailModalProps) {
  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariant>(initialVariant);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes[1] ?? product.sizes[0] ?? "M"
  );
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const addItem = useCartStore((state) => state.addItem);

  const images =
    selectedVariant.images.length > 0
      ? selectedVariant.images
      : ["/media/logo.jpeg"];

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const maxStock = Math.max(1, Math.min(10, selectedVariant.stock || 1));

  const handleVariantSwitch = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setActiveImageIndex(0);
    setQuantity((q) => Math.min(q, Math.max(1, variant.stock || 1)));
  };

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleAddToCart = () => {
    addItem({
      product_id: product.id,
      variant_id: selectedVariant.id,
      ref_code: product.ref_code,
      product_name: product.name,
      color_name: selectedVariant.color_name,
      color_hex: selectedVariant.color_hex,
      size: selectedSize,
      unit_price: product.price,
      quantity,
      image_url: images[0],
    });
    setAddedFeedback(true);
    setTimeout(() => {
      setAddedFeedback(false);
      onClose();
    }, 450);
  };

  const whatsappUrl = buildWhatsAppInquiryUrl(
    settings.whatsapp_number,
    product.name,
    selectedVariant.color_name,
    selectedSize
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-3 sm:p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative grid max-h-[92vh] w-full max-w-5xl grid-cols-1 overflow-y-auto rounded-3xl border border-line bg-canvas shadow-[0_32px_80px_rgba(43,31,27,0.3)] md:grid-cols-12 md:overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalle de prenda"
          className="absolute top-4 right-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-canvas/90 text-ink border border-line hover:bg-surface transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-rose-gold-deep"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Left Column: Multi-Angle Gallery */}
        <div className="md:col-span-6 bg-surface/70 p-4 sm:p-6 flex flex-col gap-3 justify-center">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-surface border border-line/70">
            <Image
              src={images[activeImageIndex] ?? images[0]}
              alt={`${product.name} — ${selectedVariant.color_name} vista ${activeImageIndex + 1}`}
              fill
              sizes="(max-width: 768px) 95vw, 45vw"
              className="object-cover object-top"
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  aria-label="Imagen anterior"
                  className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-canvas/90 text-ink shadow-md hover:bg-card transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  aria-label="Imagen siguiente"
                  className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-canvas/90 text-ink shadow-md hover:bg-card transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center justify-center gap-2.5 overflow-x-auto py-1">
              {images.map((imgUrl, idx) => (
                <button
                  key={`${selectedVariant.id}-${idx}`}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  aria-label={`Ver foto ${idx + 1} de ${selectedVariant.color_name}`}
                  className={`relative h-16 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition-all cursor-pointer ${
                    idx === activeImageIndex
                      ? "border-rose-gold-deep ring-2 ring-rose-gold/40"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={imgUrl}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover object-top"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Editorial Info & Purchase Actions */}
        <div className="md:col-span-6 md:max-h-[92vh] md:overflow-y-auto p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.22em] text-dusty-rose font-semibold">
                <span>{product.category}</span>
                <span aria-hidden="true">·</span>
                <span>Ref. {product.ref_code}</span>
              </div>
              <h2
                id="product-modal-title"
                className="mt-1.5 font-display text-3xl sm:text-4xl font-medium text-ink leading-tight pr-10"
              >
                {product.name}
              </h2>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-xl font-semibold text-ink">
                  {formatCOP(product.price)}
                </span>
                {product.compare_at_price &&
                  product.compare_at_price > product.price && (
                    <span className="text-sm text-ink-muted line-through">
                      {formatCOP(product.compare_at_price)}
                    </span>
                  )}
              </div>
            </div>

            <p className="text-sm leading-relaxed text-ink-soft">
              {product.description}
            </p>

            {/* Color Selector */}
            <div>
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em]">
                <span className="font-semibold text-ink">Color</span>
                <span className="text-ink-soft">{selectedVariant.color_name}</span>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                {product.variants.map((variant) => {
                  const isActive = variant.id === selectedVariant.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => handleVariantSwitch(variant)}
                      className={`inline-flex min-h-[44px] items-center gap-2.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? "border-rose-gold-deep bg-surface text-ink shadow-xs"
                          : "border-line bg-card text-ink-soft hover:border-rose-gold"
                      }`}
                    >
                      <span
                        className="h-4 w-4 rounded-full border border-ink/20"
                        style={{ backgroundColor: variant.color_hex }}
                      />
                      <span>{variant.color_name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Selector */}
            <div>
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em]">
                <span className="font-semibold text-ink">Talla</span>
                <span className="text-ink-soft">Seleccionada: {selectedSize}</span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {product.sizes.map((size) => {
                  const active = size === selectedSize;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`min-h-[44px] min-w-[48px] rounded-xl border px-3.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                        active
                          ? "border-ink bg-ink text-canvas"
                          : "border-line bg-card text-ink hover:border-rose-gold-deep"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-ink">
                  Cantidad
                </span>
                {selectedVariant.stock === 1 && (
                  <p className="text-[11px] text-dusty-rose font-medium mt-0.5">
                    Pieza exclusiva · 1 unidad disponible en este color
                  </p>
                )}
              </div>
              <div className="inline-flex items-center rounded-full border border-line bg-card">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Disminuir cantidad"
                  className="inline-flex h-11 w-11 items-center justify-center text-ink hover:text-rose-gold-deep cursor-pointer"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-sm font-semibold text-ink">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={quantity >= maxStock}
                  onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                  aria-label="Aumentar cantidad"
                  className="inline-flex h-11 w-11 items-center justify-center text-ink hover:text-rose-gold-deep disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Fabric & Care */}
            {product.fabric_care && (
              <div className="rounded-2xl border border-line bg-surface/60 p-4 text-xs leading-relaxed text-ink-soft">
                <p className="font-semibold uppercase tracking-[0.16em] text-ink mb-1">
                  Tejido y Cuidados
                </p>
                <p>{product.fabric_care}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 border-t border-line pt-5">
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex min-h-[50px] w-full items-center justify-center gap-2.5 rounded-full bg-ink px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-canvas hover:bg-rose-gold-deep transition-all duration-300 cursor-pointer"
            >
              {addedFeedback ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Agregada a tu bolsa</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  <span>Agregar a mi bolsa · {formatCOP(product.price * quantity)}</span>
                </>
              )}
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full border border-line-strong bg-card px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-ink hover:border-rose-gold-deep hover:bg-surface transition-colors cursor-pointer"
            >
              <MessageCircle className="h-4 w-4 text-dusty-rose" />
              <span>Consultar por WhatsApp</span>
            </a>

            <p className="flex items-center justify-center gap-2 text-[11px] text-ink-soft pt-1">
              <Truck className="h-3.5 w-3.5 text-rose-gold-deep shrink-0" />
              <span>{settings.shipping_note}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
