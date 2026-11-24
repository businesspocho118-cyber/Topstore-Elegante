"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function LuxuryExperienceLayer() {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    let scrollTriggerInstance: ScrollTrigger | null = null;
    if (progressRef.current && !reducedMotion) {
      gsap.set(progressRef.current, { scaleX: 0, transformOrigin: "left center" });
      scrollTriggerInstance = ScrollTrigger.create({
        start: 0,
        end: () =>
          Math.max(1, document.documentElement.scrollHeight - window.innerHeight),
        scrub: 0.25,
        onUpdate: (self) => {
          if (progressRef.current) {
            gsap.set(progressRef.current, { scaleX: self.progress });
          }
        },
      });
    }

    if (reducedMotion || !finePointer) {
      return () => {
        scrollTriggerInstance?.kill();
      };
    }

    // Subtle magnetic pull on primary CTA buttons (keeps native mouse cursor untouched)
    let activeMagneticEl: HTMLElement | null = null;

    const onPointerMove = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      const magneticEl = target?.closest<HTMLElement>("[data-magnetic]");

      if (activeMagneticEl && activeMagneticEl !== magneticEl) {
        gsap.to(activeMagneticEl, {
          x: 0,
          y: 0,
          duration: 0.55,
          ease: "elastic.out(1, 0.45)",
        });
        activeMagneticEl = null;
      }

      if (magneticEl) {
        activeMagneticEl = magneticEl;
        const rect = magneticEl.getBoundingClientRect();
        const relX = (e.clientX - (rect.left + rect.width / 2)) * 0.22;
        const relY = (e.clientY - (rect.top + rect.height / 2)) * 0.22;
        gsap.to(magneticEl, {
          x: gsap.utils.clamp(-10, 10, relX),
          y: gsap.utils.clamp(-8, 8, relY),
          duration: 0.28,
          ease: "power2.out",
        });
      }
    };

    const onPointerLeave = () => {
      if (activeMagneticEl) {
        gsap.to(activeMagneticEl, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: "elastic.out(1, 0.45)",
        });
        activeMagneticEl = null;
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("mouseleave", onPointerLeave);

    return () => {
      scrollTriggerInstance?.kill();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("mouseleave", onPointerLeave);
      if (activeMagneticEl) {
        gsap.set(activeMagneticEl, { x: 0, y: 0 });
      }
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2.5px] bg-transparent"
    >
      <div
        ref={progressRef}
        className="h-full w-full rose-gold-gradient origin-left"
      />
    </div>
  );
}
