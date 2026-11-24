import { getPublicCatalogData } from "@/lib/supabase/queries";
import { Header } from "@/features/brand/Header";
import { HeroEditorial } from "@/features/brand/HeroEditorial";
import { EditorialMarquee } from "@/features/brand/EditorialMarquee";
import { CatalogSection } from "@/features/catalog/CatalogSection";
import { ParentBrandSection } from "@/features/brand/ParentBrandSection";
import { Footer } from "@/features/brand/Footer";
import { CartDrawer } from "@/features/cart/CartDrawer";
import { LuxuryExperienceLayer } from "@/features/motion/LuxuryExperienceLayer";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { products, settings } = await getPublicCatalogData();

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
