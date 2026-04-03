"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type FadeInSectionProps = {
  children: ReactNode;
  className?: string;
};

export function FadeInSection({ children, className = "" }: FadeInSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setRevealed(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit) {
          setRevealed(true);
          obs.disconnect();
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none motion-safe:transition-[opacity,transform] motion-safe:duration-200 motion-safe:ease-out ${
        revealed ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
