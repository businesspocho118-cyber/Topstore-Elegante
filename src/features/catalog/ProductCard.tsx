"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { Eye, Layers, Sparkles } from "lucide-react";
import { formatCOP } from "@/lib/format";
import type { ProductVariant, ProductWithVariants } from "@/lib/types";

interface ProductCardProps {
  product: ProductWithVariants;
  onSelectProduct: (product: ProductWithVariants, variant: ProductVariant) => void;
}

export function ProductCard({ product, onSelectProduct }: ProductCardProps) {
  const activeVariants = product.variants.length > 0 ? product.variants : [];
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    activeVariants[0]?.id ?? ""
  );
  const cardRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const selectedVariant =
    activeVariants.find((v) => v.id === selectedVariantId) ?? activeVariants[0];

  const primaryImage = selectedVariant?.images?.[0] ?? "/media/logo.jpeg";
  const secondaryImage = selectedVariant?.images?.[1] ?? null;
  const imageCount = selectedVariant?.images?.length ?? 0;

  const hasDiscount =
    typeof product.compare_at_price === "number" &&
    product.compare_at_price > product.price;

  const isSingleUnit = selectedVariant && selectedVariant.stock === 1;

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse" || !cardRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    const rotY = (px - 0.5) * 6;
    const rotX = (0.5 - py) * 5;

    gsap.to(cardRef.current, {
      rotateX: rotX,
      rotateY: rotY,
      transformPerspective: 900,
      duration: 0.35,
      ease: "power2.out",
      overwrite: "auto",
    });

    if (glowRef.current) {
      glowRef.current.style.background = `radial-gradient(360px circle at ${
        px * 100
      }% ${py * 100}%, rgba(215, 166, 134, 0.22), transparent 65%)`;
      glowRef.current.style.opacity = "1";
    }
  };

  const handlePointerLeave = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.6,
        ease: "power3.out",
        overwrite: "auto",
      });
    }
    if (glowRef.current) {
      glowRef.current.style.opacity = "0";
    }
  };

  return (
    <article
      ref={cardRef}
      data-catalog-card
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="group relative flex flex-col rounded-2xl border border-line/80 bg-card transition-[border-color,box-shadow] duration-300 hover:border-rose-gold/90 hover:shadow-[0_22px_52px_rgba(43,31,27,0.11)] overflow-hidden will-change-transform"
    >
      {/* Pointer-following subtle rose-gold specular glow */}
      <div
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300"
      />

      {/* Portrait Studio Image Frame */}
      <div
        role="button"
        tabIndex={0}
        data-cursor="view"
        onClick={() => selectedVariant && onSelectProduct(product, selectedVariant)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && selectedVariant) {
            e.preventDefault();
            onSelectProduct(product, selectedVariant);
          }
        }}
        aria-label={`Ver detalles de ${product.name} en color ${selectedVariant?.color_name ?? ""}`}
        className="relative aspect-[3/4] w-full overflow-hidden bg-surface cursor-pointer focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-rose-gold-deep"
      >
        <Image
          src={primaryImage}
          alt={`${product.name} — ${selectedVariant?.color_name ?? ""}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`object-cover object-top transition-all duration-700 ease-out ${
            secondaryImage
              ? "group-hover:opacity-0 group-hover:scale-[1.04]"
              : "group-hover:scale-[1.05]"
          }`}
        />

        {secondaryImage && (
          <Image
            src={secondaryImage}
            alt={`${product.name} — vista alternativa ${selectedVariant?.color_name ?? ""}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover object-top opacity-0 transition-all duration-700 ease-out group-hover:opacity-100 group-hover:scale-[1.04]"
          />
        )}

        {/* Top Badges */}
        <div className="pointer-events-none absolute top-3.5 left-3.5 right-3.5 flex items-start justify-between gap-2">
          <span className="rounded-full bg-canvas/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink backdrop-blur-sm border border-line/70">
            Ref. {product.ref_code}
          </span>

          <div className="flex flex-col items-end gap-1.5">
            {hasDiscount && (
              <span className="rounded-full bg-dusty-rose px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-canvas">
                Especial
              </span>
            )}
            {isSingleUnit && (
              <span className="inline-flex items-center gap-1 rounded-full bg-ink/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-champagne backdrop-blur-sm">
                <Sparkles className="h-2.5 w-2.5 text-rose-gold-light" />
                Última unidad
              </span>
            )}
          </div>
        </div>

        {/* Bottom quick preview bar */}
        <div className="pointer-events-none absolute inset-x-3.5 bottom-3.5 flex items-center justify-between gap-2">
          {imageCount > 1 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-ink/70 px-2.5 py-1 text-[10px] font-medium tracking-[0.12em] text-canvas backdrop-blur-sm">
              <Layers className="h-3 w-3" aria-hidden="true" />
              {imageCount} fotos
            </span>
          ) : (
            <span />
          )}

          <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas/95 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink shadow-sm translate-y-1 opacity-95 sm:opacity-0 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 transition-all duration-300">
            <Eye className="h-3.5 w-3.5 text-rose-gold-deep" aria-hidden="true" />
            Ver pieza
          </span>
        </div>
      </div>

      {/* Product Info & Interactive Swatches */}
      <div className="relative z-20 flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] uppercase tracking-[0.22em] text-dusty-rose font-semibold">
              {product.category}
            </p>
            {product.sizes.length === 1 && (
              <span className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                {product.sizes[0]}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => selectedVariant && onSelectProduct(product, selectedVariant)}
            className="mt-1 text-left font-display text-2xl font-medium leading-snug text-ink hover:text-rose-gold-deep transition-colors cursor-pointer"
          >
            {product.name}
          </button>

          {/* Price */}
          <div className="mt-2 flex items-baseline gap-2.5">
            <span className="text-sm font-semibold tracking-wide text-ink">
              {formatCOP(product.price)}
            </span>
            {hasDiscount && product.compare_at_price && (
              <span className="text-xs text-ink-muted line-through">
                {formatCOP(product.compare_at_price)}
              </span>
            )}
          </div>
        </div>

        {/* Color Swatches */}
        {activeVariants.length > 0 && (
          <div className="mt-4 pt-4 border-t border-line/70 flex items-center justify-between gap-3">
            <div
              className="flex items-center gap-2"
              role="group"
              aria-label={`Colores disponibles de ${product.name}`}
            >
              {activeVariants.map((variant) => {
                const isSelected = variant.id === selectedVariant?.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setSelectedVariantId(variant.id)}
                    aria-label={`Seleccionar color ${variant.color_name}`}
                    aria-pressed={isSelected}
                    title={variant.color_name}
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-rose-gold-deep ${
                      isSelected
                        ? "ring-2 ring-rose-gold-deep ring-offset-2 ring-offset-card scale-105"
                        : "hover:scale-110 opacity-85 hover:opacity-100"
                    }`}
                  >
                    <span
                      className="h-6 w-6 rounded-full border border-ink/20 shadow-inner"
                      style={{ backgroundColor: variant.color_hex }}
                    />
                  </button>
                );
              })}
            </div>

            <span className="text-[11px] text-ink-soft truncate max-w-[155px]">
              {selectedVariant?.color_name}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
