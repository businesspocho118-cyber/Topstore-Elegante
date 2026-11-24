"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight, ShieldCheck, Sparkles, Truck } from "lucide-react";
import type { StoreSettings } from "@/lib/types";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface ParentBrandSectionProps {
  settings: StoreSettings;
}

export function ParentBrandSection({ settings }: ParentBrandSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-brand-line]", {
          scaleX: 0,
          duration: 0.9,
          ease: "power2.out",
          transformOrigin: "left center",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            once: true,
          },
        });

        gsap.from("[data-brand-reveal]", {
          y: 22,
          opacity: 0,
          duration: 0.65,
          stagger: 0.1,
          ease: "power2.out",
          clearProps: "transform,opacity",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 78%",
            once: true,
          },
        });
      });
      return () => mm.revert();
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="esencia"
      ref={sectionRef}
      className="relative overflow-hidden border-y border-line bg-surface/65 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          data-brand-line
          className="editorial-hairline h-px w-full mb-14 opacity-70"
        />

        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          {/* Left: Brand Logo & Dual-Line Story */}
          <div data-brand-reveal className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-rose-gold/40 bg-card p-3 shadow-[0_20px_50px_rgba(43,31,27,0.1)]">
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
                <Image
                  src="/media/logo.jpeg"
                  alt="TOPSTORE WOMAN — Ropa Premium Para Ella"
                  fill
                  sizes="(max-width: 1024px) 90vw, 360px"
                  className="object-cover"
                />
              </div>
              <div className="mt-3 flex items-center justify-between px-2 pb-1 text-[11px] uppercase tracking-[0.2em] text-ink-soft">
                <span>Familia TOPSTORE</span>
                <span className="text-dusty-rose font-semibold">Colombia</span>
              </div>
            </div>
          </div>

          {/* Right: Editorial Narrative */}
          <div className="lg:col-span-7 space-y-6">
            <p
              data-brand-reveal
              className="text-[11px] font-semibold uppercase tracking-[0.28em] text-dusty-rose"
            >
              Dos Universos, Un Mismo Sello
            </p>

            <h2
              data-brand-reveal
              className="font-display text-4xl sm:text-5xl font-medium leading-[1.08] text-ink"
            >
              La nueva faceta elegante de{" "}
              <span className="italic rose-gold-text">TOPSTORE Colombia</span>
            </h2>

            <p
              data-brand-reveal
              className="text-base leading-relaxed text-ink-soft font-light"
            >
              Nacimos como tienda 100% digital desde Pasto llevando ropa deportiva
              de alto rendimiento a cada rincón del país en{" "}
              <strong className="font-medium text-ink">topstorecolombia.com</strong>.
              Hoy ampliamos nuestra visión con{" "}
              <strong className="font-medium text-ink">TOPSTORE WOMAN</strong>: una
              línea independiente creada exclusivamente para mujeres que buscan
              sofisticación, corte impecable y prendas atemporales.
            </p>

            {/* 3 Pillars */}
            <div
              data-brand-reveal
              className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3"
            >
              <div className="rounded-2xl border border-line bg-canvas/90 p-4">
                <Sparkles className="h-5 w-5 text-rose-gold-deep mb-2.5" aria-hidden="true" />
                <h3 className="font-display text-xl font-semibold text-ink">
                  Curaduría Selecta
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                  Texturas cálidas, siluetas estructuradas y tonos neutros fáciles de combinar.
                </p>
              </div>

              <div className="rounded-2xl border border-line bg-canvas/90 p-4">
                <Truck className="h-5 w-5 text-rose-gold-deep mb-2.5" aria-hidden="true" />
                <h3 className="font-display text-xl font-semibold text-ink">
                  Envíos Nacionales
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                  Despachamos con seguimiento a Bogotá, Medellín, Cali, Pasto y toda Colombia.
                </p>
              </div>

              <div className="rounded-2xl border border-line bg-canvas/90 p-4">
                <ShieldCheck className="h-5 w-5 text-rose-gold-deep mb-2.5" aria-hidden="true" />
                <h3 className="font-display text-xl font-semibold text-ink">
                  Respaldo Real
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                  La misma confianza y atención cercana de TOPSTORE Colombia en cada pedido.
                </p>
              </div>
            </div>

            <div data-brand-reveal className="pt-2">
              <a
                href={settings.parent_brand_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] items-center gap-2.5 rounded-full border border-ink bg-transparent px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink hover:bg-ink hover:text-canvas transition-all duration-300 cursor-pointer"
              >
                <span>Conocer también TOPSTORE Deportiva</span>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
