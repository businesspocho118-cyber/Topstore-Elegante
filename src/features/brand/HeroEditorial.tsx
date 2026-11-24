"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowDownRight, ArrowUpRight, Sparkles } from "lucide-react";
import type { StoreSettings } from "@/lib/types";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface HeroEditorialProps {
  settings: StoreSettings;
  productCount: number;
}

export function HeroEditorial({ settings, productCount }: HeroEditorialProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);

  const handleHeroPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse" || !visualRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;

    gsap.to("[data-hero-float-card]", {
      x: nx * -16,
      y: ny * -12,
      duration: 0.65,
      ease: "power2.out",
      overwrite: "auto",
    });
    gsap.to("[data-hero-seal]", {
      x: nx * 14,
      y: ny * 10,
      duration: 0.65,
      ease: "power2.out",
      overwrite: "auto",
    });
  };

  const handleHeroPointerLeave = () => {
    gsap.to("[data-hero-float-card], [data-hero-seal]", {
      x: 0,
      y: 0,
      duration: 0.8,
      ease: "power3.out",
      overwrite: "auto",
    });
  };

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.from("[data-hero-stagger]", {
          y: 28,
          opacity: 0,
          duration: 0.75,
          stagger: 0.1,
          clearProps: "transform,opacity",
        })
          .from(
            "[data-hero-main-frame]",
            {
              clipPath: "inset(8% 0% 0% 0% round 20px)",
              opacity: 0,
              duration: 0.95,
              clearProps: "clipPath,opacity",
            },
            "-=0.55"
          )
          .from(
            "[data-hero-accent-frame]",
            {
              y: 32,
              opacity: 0,
              duration: 0.8,
              clearProps: "transform,opacity",
            },
            "-=0.5"
          );

        gsap.to("[data-hero-parallax]", {
          yPercent: -6,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.6,
          },
        });
      });

      return () => mm.revert();
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="inicio"
      ref={sectionRef}
      onPointerMove={handleHeroPointerMove}
      onPointerLeave={handleHeroPointerLeave}
      className="relative overflow-hidden border-b border-line bg-canvas"
    >
      {/* Subtle warm radial light */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-0 h-[520px] w-[520px] rounded-full bg-champagne/40 blur-3xl"
      />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:py-20">
        {/* Editorial Copy */}
        <div className="lg:col-span-6 space-y-6 sm:space-y-7">
          <div
            data-hero-stagger
            className="inline-flex items-center gap-2 rounded-full border border-rose-gold/40 bg-surface/80 px-4 py-1.5 text-[11px] uppercase tracking-[0.22em] text-dusty-rose-deep font-semibold"
          >
            <Sparkles className="h-3.5 w-3.5 text-rose-gold-deep" aria-hidden="true" />
            <span>Nueva Línea Elegante · Por TOPSTORE Colombia</span>
          </div>

          <h1
            data-hero-stagger
            className="font-display text-5xl sm:text-6xl lg:text-[68px] font-medium leading-[1.03] tracking-tight text-ink text-balance"
          >
            Ropa premium{" "}
            <span className="italic font-normal rose-gold-text">para ella</span>,
            diseñada para perdurar.
          </h1>

          <p
            data-hero-stagger
            className="max-w-xl text-base sm:text-lg leading-relaxed text-ink-soft font-light"
          >
            Una curaduría femenina de siluetas limpias, tejidos delicados y
            acabados atemporales. El sello de calidad de{" "}
            <a
              href={settings.parent_brand_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-ink underline decoration-rose-gold underline-offset-4 hover:text-dusty-rose transition-colors"
            >
              topstorecolombia.com
            </a>{" "}
            ahora en una cápsula dedicada a la elegancia cotidiana.
          </p>

          <div
            data-hero-stagger
            className="flex flex-wrap items-center gap-4 pt-2"
          >
            <a
              href="#coleccion"
              data-magnetic
              className="inline-flex min-h-[48px] items-center gap-2.5 rounded-full bg-ink px-7 py-3.5 text-xs uppercase tracking-[0.2em] font-semibold text-canvas shadow-[0_10px_28px_rgba(43,31,27,0.16)] hover:bg-rose-gold-deep transition-colors duration-300 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-gold-deep"
            >
              <span>Ver Catálogo ({productCount})</span>
              <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
            </a>

            <a
              href={settings.parent_brand_url}
              target="_blank"
              rel="noopener noreferrer"
              data-magnetic
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-line-strong bg-card/70 px-6 py-3.5 text-xs uppercase tracking-[0.18em] font-medium text-ink hover:border-rose-gold-deep hover:bg-surface transition-colors duration-300 cursor-pointer"
            >
              <span>Línea Deportiva</span>
              <ArrowUpRight className="h-4 w-4 text-rose-gold-deep" aria-hidden="true" />
            </a>
          </div>

          {/* Quiet Luxury Trust Strip */}
          <div
            data-hero-stagger
            className="grid grid-cols-3 gap-4 border-t border-line pt-6 max-w-lg"
          >
            <div>
              <p className="font-display text-2xl font-semibold text-ink">100%</p>
              <p className="text-[11px] uppercase tracking-[0.14em] text-ink-soft mt-0.5">
                Online Colombia
              </p>
            </div>
            <div>
              <p className="font-display text-2xl font-semibold text-ink">Nacional</p>
              <p className="text-[11px] uppercase tracking-[0.14em] text-ink-soft mt-0.5">
                Envíos Seguros
              </p>
            </div>
            <div>
              <p className="font-display text-2xl font-semibold text-ink">Asesoría</p>
              <p className="text-[11px] uppercase tracking-[0.14em] text-ink-soft mt-0.5">
                Directa WhatsApp
              </p>
            </div>
          </div>
        </div>

        {/* Editorial Lookbook Visual Composition */}
        <div ref={visualRef} className="lg:col-span-6 relative">
          <div className="relative mx-auto max-w-md lg:max-w-none lg:pl-8">
            {/* Main Editorial Portrait */}
            <div
              data-hero-main-frame
              data-cursor="view"
              className="relative aspect-[3/4] w-full overflow-hidden rounded-[22px] border border-line bg-surface shadow-[0_24px_60px_rgba(43,31,27,0.12)]"
            >
              <div data-hero-parallax className="relative h-[106%] w-full top-0">
                <Image
                  src="/media/garments/b-1.0.jpeg"
                  alt="Trench Corto Cinturado Milano — Colección TOPSTORE WOMAN"
                  fill
                  priority
                  sizes="(max-width: 1024px) 92vw, 44vw"
                  className="object-cover object-top"
                />
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ink/60 via-ink/20 to-transparent" />
              <div className="absolute bottom-5 left-5 sm:left-48 right-5 flex items-end justify-between gap-2 text-canvas">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-champagne">
                    Edición Destacada
                  </p>
                  <p className="font-display text-xl sm:text-2xl font-medium">
                    Trench Corto Milano
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-canvas/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink">
                  2 Tonos
                </span>
              </div>
            </div>

            {/* Secondary Floating Detail Frame */}
            <div
              data-hero-accent-frame
              data-hero-float-card
              className="hidden sm:block absolute -bottom-6 -left-2 lg:-left-4 w-36 md:w-44 overflow-hidden rounded-2xl border-2 border-canvas bg-card shadow-[0_18px_40px_rgba(43,31,27,0.16)] will-change-transform"
            >
              <div className="relative aspect-[3/4] w-full">
                <Image
                  src="/media/garments/g-1.0.jpeg"
                  alt="Bolso Hobo Cherry Atelier en Monograma Café & Cereza"
                  fill
                  sizes="176px"
                  className="object-cover object-center"
                />
              </div>
            </div>

            {/* Logo Seal Badge */}
            <div
              data-hero-accent-frame
              data-hero-seal
              className="hidden sm:flex absolute -top-4 -right-3 items-center gap-2.5 rounded-2xl border border-rose-gold/40 bg-canvas/95 p-2.5 pr-4 shadow-[0_12px_30px_rgba(43,31,27,0.1)] backdrop-blur-md will-change-transform"
            >
              <div className="relative h-11 w-11 overflow-hidden rounded-xl border border-line">
                <Image
                  src="/media/logo.jpeg"
                  alt="Sello oficial TOPSTORE WOMAN"
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              </div>
              <div className="leading-tight">
                <p className="text-[10px] uppercase tracking-[0.2em] text-dusty-rose font-semibold">
                  Colección
                </p>
                <p className="font-display text-sm font-semibold text-ink">
                  Atelier Femenino
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
