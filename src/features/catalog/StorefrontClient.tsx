"use client";

import { useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DEFAULT_STORE_SETTINGS, SEED_PRODUCTS } from "@/lib/catalog-seed-data";
import { getPublicCatalogData } from "@/lib/supabase/queries";
import { Header } from "@/features/brand/Header";
import { HeroEditorial } from "@/features/brand/HeroEditorial";
import { EditorialMarquee } from "@/features/brand/EditorialMarquee";
import { CatalogSection } from "@/features/catalog/CatalogSection";
import { ParentBrandSection } from "@/features/brand/ParentBrandSection";
import { Footer } from "@/features/brand/Footer";
import { CartDrawer } from "@/features/cart/CartDrawer";
import { LuxuryExperienceLayer } from "@/features/motion/LuxuryExperienceLayer";
import type { ProductWithVariants, StoreSettings } from "@/lib/types";

gsap.registerPlugin(ScrollTrigger);

export function StorefrontClient() {
  const [products, setProducts] = useState<ProductWithVariants[]>(SEED_PRODUCTS);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  useEffect(() => {
    let active = true;

    getPublicCatalogData().then((payload) => {
      if (!active) return;
      setProducts(payload.products);
      setSettings(payload.settings);
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <LuxuryExperienceLayer />
      <Header settings={settings} />

      <main className="flex-1">
        <HeroEditorial settings={settings} productCount={products.length} />
        <EditorialMarquee />
        <CatalogSection products={products} settings={settings} />
        <ParentBrandSection settings={settings} />
      </main>

      <Footer settings={settings} />
      <CartDrawer settings={settings} />
    </div>
  );
}
