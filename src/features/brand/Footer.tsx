"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowUpRight, Instagram, MessageCircle } from "lucide-react";
import { sanitizeWhatsAppNumber } from "@/lib/format";
import type { StoreSettings } from "@/lib/types";

interface FooterProps {
  settings: StoreSettings;
}

export function Footer({ settings }: FooterProps) {
  const router = useRouter();
  const clickCountRef = useRef(0);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hidden shortcut: Ctrl + Shift + A opens /admin
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "a") {
        event.preventDefault();
        router.push("/admin");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [router]);

  // Hidden footer access: 3 consecutive clicks on the brand star ornament (✦)
  const handleHiddenTriggerClick = () => {
    clickCountRef.current += 1;
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);

    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      router.push("/admin");
      return;
    }

    resetTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 1800);
  };

  const whatsappHref = `https://wa.me/${sanitizeWhatsAppNumber(
    settings.whatsapp_number
  )}`;
  const instagramClean = settings.instagram_handle.replace(/^@/, "");
  const instagramHref = `https://instagram.com/${instagramClean}`;

  return (
    <footer className="bg-ink text-canvas">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 pb-12 border-b border-canvas/15">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="relative h-12 w-12 overflow-hidden rounded-full border border-rose-gold/60">
                <Image
                  src="/media/logo.jpeg"
                  alt="TOPSTORE WOMAN"
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div>
                <p className="font-display text-2xl font-semibold tracking-[0.16em] text-canvas">
                  TOPSTORE
                </p>
                <p className="text-[10px] uppercase tracking-[0.34em] text-rose-gold-light">
                  WOMAN · {settings.tagline}
                </p>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-champagne/80 font-light">
              Línea femenina de moda elegante respaldada por TOPSTORE Colombia.
              Tienda 100% online con envíos seguros a todo el país.
            </p>
          </div>

          {/* Navigation */}
          <div className="md:col-span-3 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-gold-light">
              Navegación
            </p>
            <ul className="space-y-2.5 text-sm text-champagne/85">
              <li>
                <a href="#inicio" className="hover:text-canvas transition-colors">
                  Inicio
                </a>
              </li>
              <li>
                <a href="#coleccion" className="hover:text-canvas transition-colors">
                  Colección Elegante
                </a>
              </li>
              <li>
                <a href="#esencia" className="hover:text-canvas transition-colors">
                  Nuestra Esencia
                </a>
              </li>
              <li>
                <a
                  href={settings.parent_brand_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-rose-gold-light hover:text-canvas transition-colors"
                >
                  <span>TopstoreColombia.com</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </li>
            </ul>
          </div>

          {/* Direct Contact */}
          <div className="md:col-span-4 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-gold-light">
              Atención Personalizada
            </p>
            <p className="text-sm text-champagne/80 font-light">
              {settings.shipping_note}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-rose-gold/50 bg-canvas/5 px-4 py-2 text-xs uppercase tracking-[0.16em] text-canvas hover:bg-rose-gold-deep hover:border-rose-gold-deep transition-colors cursor-pointer"
              >
                <MessageCircle className="h-4 w-4 text-rose-gold-light" aria-hidden="true" />
                <span>WhatsApp</span>
              </a>
              <a
                href={instagramHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-canvas/20 bg-canvas/5 px-4 py-2 text-xs uppercase tracking-[0.16em] text-canvas hover:border-rose-gold-light transition-colors cursor-pointer"
              >
                <Instagram className="h-4 w-4 text-rose-gold-light" aria-hidden="true" />
                <span>{settings.instagram_handle}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar with Hidden Admin Ornament Trigger */}
        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-xs text-champagne/65 sm:flex-row">
          <p className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} TOPSTORE WOMAN</span>
            <button
              type="button"
              onClick={handleHiddenTriggerClick}
              aria-label="Emblema decorativo"
              title=""
              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-rose-gold/75 hover:text-rose-gold-light transition-colors select-none cursor-default focus:outline-none"
            >
              ✦
            </button>
            <span>Una línea de TOPSTORE Colombia</span>
          </p>

          <p className="text-[11px] tracking-[0.16em] uppercase text-champagne/55">
            Pasto · Envíos a todo Colombia
          </p>
        </div>
      </div>
    </footer>
  );
}
