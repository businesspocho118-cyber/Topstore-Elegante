"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ShoppingBag, Menu, X, ArrowUpRight } from "lucide-react";
import { useCartStore } from "@/features/cart/useCartStore";
import type { StoreSettings } from "@/lib/types";

interface HeaderProps {
  settings: StoreSettings;
}

export function Header({ settings }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const items = useCartStore((state) => state.items);
  const openCart = useCartStore((state) => state.openCart);

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Top Announcement Bar */}
      <div className="bg-ink text-canvas px-4 py-2 text-center text-[11px] sm:text-xs tracking-[0.18em] uppercase font-medium">
        <span>{settings.announcement_bar}</span>
      </div>

      {/* Main Navigation */}
      <div
        className={`transition-all duration-300 border-b ${
          scrolled
            ? "editorial-glass border-line shadow-[0_6px_24px_rgba(43,31,27,0.06)]"
            : "bg-canvas/95 border-transparent"
        }`}
      >
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-surface transition-colors cursor-pointer md:hidden focus-visible:outline-2 focus-visible:outline-rose-gold-deep"
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Left nav desktop */}
          <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-8">
            <a
              href="#coleccion"
              className="text-xs uppercase tracking-[0.2em] text-ink-soft hover:text-ink transition-colors py-2 cursor-pointer"
            >
              Colección
            </a>
            <a
              href="#esencia"
              className="text-xs uppercase tracking-[0.2em] text-ink-soft hover:text-ink transition-colors py-2 cursor-pointer"
            >
              Nuestra Esencia
            </a>
          </nav>

          {/* Center Brand Identity */}
          <a
            href="#inicio"
            className="flex items-center gap-3 group cursor-pointer focus-visible:outline-2 focus-visible:outline-rose-gold-deep rounded-sm"
          >
            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-rose-gold/50 shadow-xs shrink-0">
              <Image
                src="/media/logo.jpeg"
                alt="Emblema TOPSTORE WOMAN"
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-xl sm:text-2xl font-semibold tracking-[0.16em] text-ink">
                TOPSTORE
              </span>
              <span className="text-[10px] tracking-[0.34em] uppercase text-dusty-rose font-semibold mt-0.5">
                WOMAN
              </span>
            </div>
          </a>

          {/* Right Actions */}
          <div className="flex items-center gap-3 sm:gap-5">
            <a
              href={settings.parent_brand_url}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.16em] text-ink-soft hover:text-dusty-rose transition-colors py-2 cursor-pointer"
            >
              <span>Topstore Deportiva</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>

            <button
              type="button"
              onClick={openCart}
              aria-label={`Abrir bolsa de compra, ${totalCount} prendas`}
              className="relative inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line-strong bg-card/80 px-4 py-2 text-xs uppercase tracking-[0.16em] text-ink hover:border-rose-gold-deep hover:bg-surface transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-rose-gold-deep"
            >
              <ShoppingBag className="h-4 w-4 text-rose-gold-deep" aria-hidden="true" />
              <span className="hidden sm:inline">Bolsa</span>
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-[10px] font-semibold text-canvas">
                {totalCount}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-line bg-canvas px-6 py-5 md:hidden">
            <nav className="flex flex-col gap-3">
              <a
                href="#coleccion"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 text-xs uppercase tracking-[0.2em] text-ink font-medium"
              >
                Colección Elegante
              </a>
              <a
                href="#esencia"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 text-xs uppercase tracking-[0.2em] text-ink font-medium"
              >
                Nuestra Esencia
              </a>
              <a
                href={settings.parent_brand_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 py-2.5 text-xs uppercase tracking-[0.18em] text-dusty-rose font-medium"
              >
                <span>Visitar TopstoreColombia.com</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
