"use client";

import { useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ProductCard } from "./ProductCard";
import { ProductDetailModal } from "./ProductDetailModal";
import { slugify } from "@/lib/format";
import type {
  ProductVariant,
  ProductWithVariants,
  StoreSettings,
} from "@/lib/types";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface CatalogSectionProps {
  products: ProductWithVariants[];
  settings: StoreSettings;
}

const SECTION_ORDER = [
  "Abrigos y Chaquetas",
  "Blusas y Tejidos",
  "Pantalones y Jeans",
  "Bolsos",
];

const SECTION_SUBTITLES: Record<string, string> = {
  "Abrigos y Chaquetas":
    "Trenchs estructurados, gamuzas suaves y ecocuero texturizado diseñados para ser protagonistas.",
  "Blusas y Tejidos":
    "Blusas de caída fluida y suéteres trenzados de lujo silencioso para elevar cualquier look.",
  "Pantalones y Jeans":
    "Siluetas flare de tiro alto confeccionadas para alargar y definir la figura con comodidad.",
  Bolsos:
    "Bolsos hobo estructurados con herrajes dorados y dije de cerezas. Talla única, una unidad exclusiva por color.",
};

function resolveDisplaySection(category: string): string {
  const normalized = category.trim().toLowerCase();
  if (
    normalized === "blusas" ||
    normalized === "tejidos" ||
    normalized === "blusas y tejidos"
  ) {
    return "Blusas y Tejidos";
  }
  return category.trim();
}

export function CatalogSection({ products, settings }: CatalogSectionProps) {
  const [activeSectionId, setActiveSectionId] = useState<string>("");
  const [modalSelection, setModalSelection] = useState<{
    product: ProductWithVariants;
    variant: ProductVariant;
  } | null>(null);

  const containerRef = useRef<HTMLElement>(null);

  const sections = useMemo(() => {
    const grouped = new Map<string, ProductWithVariants[]>();
    for (const product of products) {
      const displaySection = resolveDisplaySection(product.category);
      const list = grouped.get(displaySection) ?? [];
      list.push(product);
      grouped.set(displaySection, list);
    }

    const orderedNames = [
      ...SECTION_ORDER.filter((name) => grouped.has(name)),
      ...Array.from(grouped.keys()).filter(
        (name) => !SECTION_ORDER.includes(name)
      ),
    ];

    return orderedNames.map((name) => ({
      id: `cat-${slugify(name)}`,
      name,
      subtitle:
        SECTION_SUBTITLES[name] ??
        "Piezas seleccionadas con acabados finos y estética atemporal.",
      items: grouped.get(name) ?? [],
    }));
  }, [products]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const sectionEls = gsap.utils.toArray<HTMLElement>(
          "[data-catalog-section]"
        );

        sectionEls.forEach((sectionEl) => {
          const sectionId = sectionEl.getAttribute("id") ?? "";
          const hairline = sectionEl.querySelector("[data-section-line]");
          const headingItems = sectionEl.querySelectorAll("[data-section-head]");
          const cards = sectionEl.querySelectorAll("[data-catalog-card]");

          ScrollTrigger.create({
            trigger: sectionEl,
            start: "top 45%",
            end: "bottom 45%",
            onEnter: () => setActiveSectionId(sectionId),
            onEnterBack: () => setActiveSectionId(sectionId),
          });

          if (hairline) {
            gsap.from(hairline, {
              scaleX: 0,
              duration: 0.9,
              ease: "power3.out",
              transformOrigin: "left center",
              scrollTrigger: {
                trigger: sectionEl,
                start: "top 86%",
                once: true,
              },
            });
          }

          if (headingItems.length > 0) {
            gsap.from(headingItems, {
              y: 24,
              opacity: 0,
              duration: 0.7,
              stagger: 0.08,
              ease: "power3.out",
              clearProps: "transform,opacity",
              scrollTrigger: {
                trigger: sectionEl,
                start: "top 84%",
                once: true,
              },
            });
          }

          if (cards.length > 0) {
            gsap.from(cards, {
              y: 36,
              opacity: 0,
              scale: 0.97,
              duration: 0.72,
              stagger: 0.12,
              ease: "power3.out",
              clearProps: "transform,opacity",
              scrollTrigger: {
                trigger: sectionEl,
                start: "top 80%",
                once: true,
              },
            });
          }
        });
      });

      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [sections.length] }
  );

  return (
    <section
      id="coleccion"
      ref={containerRef}
      className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
    >
      {/* Intro Header */}
      <div className="mb-14 max-w-2xl space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-dusty-rose">
          Catálogo TOPSTORE WOMAN
        </p>
        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium text-ink leading-[1.06]">
          Nuestra Colección Completa
        </h2>
        <p className="text-sm sm:text-base text-ink-soft font-light leading-relaxed">
          Desliza para recorrer todas las prendas y accesorios disponibles,
          organizados por categoría con sus tonos interactivos.
        </p>
      </div>

      {/* Scroll-Synced Side Navigation Rail (desktop XL) */}
      {sections.length > 1 && (
        <aside
          aria-label="Secciones del catálogo"
          className="hidden xl:flex fixed right-6 top-1/2 -translate-y-1/2 z-30 flex-col items-end gap-2.5"
        >
          {sections.map((sec) => {
            const isCurrent = (activeSectionId || sections[0]?.id) === sec.id;
            return (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                className="group flex items-center gap-2.5 py-1 cursor-pointer"
              >
                <span
                  className={`text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${
                    isCurrent
                      ? "opacity-100 text-ink font-semibold translate-x-0"
                      : "opacity-0 group-hover:opacity-100 text-ink-soft translate-x-1 group-hover:translate-x-0"
                  }`}
                >
                  {sec.name}
                </span>
                <span
                  className={`block rounded-full transition-all duration-300 ${
                    isCurrent
                      ? "h-2.5 w-6 bg-rose-gold-deep"
                      : "h-2 w-2 bg-rose-gold/55 group-hover:bg-rose-gold-deep"
                  }`}
                />
              </a>
            );
          })}
        </aside>
      )}

      {/* Continuous Scroll Sections — Uniform Clean Grid */}
      <div className="space-y-20 sm:space-y-24">
        {sections.map((sec) => (
          <div
            key={sec.id}
            id={sec.id}
            data-catalog-section
            className="scroll-mt-28 space-y-8"
          >
            {/* Clean Editorial Section Header */}
            <div>
              <div
                data-section-line
                className="editorial-hairline h-px w-full opacity-75 mb-7"
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1.5 max-w-xl">
                  <h3
                    data-section-head
                    className="font-display text-4xl sm:text-5xl font-medium text-ink leading-none"
                  >
                    {sec.name}
                  </h3>
                  <p
                    data-section-head
                    className="text-sm text-ink-soft font-light leading-relaxed"
                  >
                    {sec.subtitle}
                  </p>
                </div>

                <span
                  data-section-head
                  className="self-start sm:self-end rounded-full border border-line bg-surface/80 px-3.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-soft"
                >
                  {sec.items.length}{" "}
                  {sec.items.length === 1 ? "diseño" : "diseños"}
                </span>
              </div>
            </div>

            {/* Uniform 3-Column Grid (same clean style as Abrigos y Chaquetas) */}
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {sec.items.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelectProduct={(prod, variant) =>
                    setModalSelection({ product: prod, variant })
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Product Detail Modal */}
      {modalSelection && (
        <ProductDetailModal
          product={modalSelection.product}
          initialVariant={modalSelection.variant}
          settings={settings}
          onClose={() => setModalSelection(null)}
        />
      )}
    </section>
  );
}
