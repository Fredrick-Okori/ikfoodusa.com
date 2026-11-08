"use client";

import { useEffect, useRef, useState } from "react";

export function ScrollBrandBanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.85);
  const [opacity, setOpacity] = useState(0.6);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate visibility ratio when banner approaches bottom of screen
      const totalDistance = windowHeight + rect.height;
      const currentPos = windowHeight - rect.top;
      const rawProgress = currentPos / totalDistance;
      const progress = Math.max(0, Math.min(1, rawProgress));

      // Compute smooth scale and opacity
      const computedScale = 0.8 + progress * 0.4; // Scale 0.8 -> 1.2
      const computedOpacity = 0.4 + progress * 0.6; // Opacity 0.4 -> 1.0

      setScale(computedScale);
      setOpacity(computedOpacity);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check on mount

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative z-20 w-full overflow-hidden bg-forest-950 border-t border-forest-600/20 py-10 lg:py-20 select-none"
    >
      <div
        className="will-change-transform transition-transform duration-150 ease-out text-center"
        style={{
          transform: `scale(${scale})`,
          opacity,
        }}
      >
        <p className="font-serif text-[11vw] sm:text-[13vw] font-black uppercase tracking-tighter leading-none text-forest-600 text-gold-gradient drop-shadow-[0_10px_35px_rgba(212,175,55,0.3)] whitespace-nowrap px-4 select-none">
          MAGNUM LIQUORS
        </p>
      </div>
    </div>
  );
}
