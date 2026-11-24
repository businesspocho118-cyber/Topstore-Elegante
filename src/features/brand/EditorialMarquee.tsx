"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const MARQUEE_ITEMS = [
  "TOPSTORE WOMAN",
  "ROPA PREMIUM PARA ELLA",
  "SILUETAS ATEMPORALES",
  "NUEVA CÁPSULA DE BOLSOS",
  "ENVÍOS A TODO COLOMBIA",
  "POR TOPSTORE COLOMBIA",
];

export function EditorialMarquee() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (!trackRef.current) return;

        const loop = gsap.to(trackRef.current, {
          xPercent: -50,
          duration: 28,
          ease: "none",
          repeat: -1,
        });

        ScrollTrigger.create({
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            const boost = Math.min(2.6, 1 + Math.abs(self.getVelocity()) / 900);
            gsap.to(loop, { timeScale: boost, duration: 0.35, overwrite: true });
            gsap.to(loop, {
              timeScale: 1,
              duration: 0.9,
              delay: 0.25,
              ease: "power2.out",
            });
          },
        });
      });

      return () => mm.revert();
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="relative overflow-hidden border-b border-line bg-surface/80 py-4 select-none"
    >
      <div ref={trackRef} className="flex w-max items-center">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex shrink-0 items-center">
            {MARQUEE_ITEMS.map((text, idx) => (
              <span
                key={`${dup}-${idx}`}
                className="inline-flex items-center gap-8 px-4 text-[11px] font-medium uppercase tracking-[0.28em] text-ink-soft"
              >
                <span>{text}</span>
                <span className="text-rose-gold-deep">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
