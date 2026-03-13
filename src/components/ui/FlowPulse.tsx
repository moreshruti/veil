"use client";

import { useEffect, useRef } from "react";

const COLORS = [
  "var(--c5)",
  "var(--c5)",
  "var(--c6)",
  "var(--c6)",
  "var(--c7)",
  "var(--c7)",
  "var(--c8)",
  "var(--c8)",
  "var(--c9)",
  "var(--c9)",
];

function getColorForPosition(element: Element): string {
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const normalizedY = Math.min(1, Math.max(0, rect.top / viewportHeight));
  const index = Math.floor(normalizedY * (COLORS.length - 1));
  return COLORS[index];
}

export function FlowPulse() {
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    const horizontals = document.querySelectorAll(".flow-line");
    const verticals = document.querySelectorAll(".flow-line-v");

    if (horizontals.length === 0 && verticals.length === 0) return;

    horizontals.forEach((el, i) => {
      const htmlEl = el as HTMLElement;
      const delay = i * 0.3;
      const color = getColorForPosition(el);

      htmlEl.style.setProperty("--pulse-delay", `${delay}s`);
      htmlEl.style.setProperty("--pulse-duration", "1s");
      htmlEl.style.setProperty("--pulse-color", color);
    });

    verticals.forEach((el, i) => {
      const htmlEl = el as HTMLElement;
      const delay = i * 0.5 + 0.15;
      const color = getColorForPosition(el);

      htmlEl.style.setProperty("--pulse-delay", `${delay}s`);
      htmlEl.style.setProperty("--pulse-duration", "2s");
      htmlEl.style.setProperty("--pulse-color", color);
    });

    // Inject supplementary keyframes for staggered comet trails
    const style = document.createElement("style");
    style.setAttribute("data-flow-pulse", "");

    const totalElements = horizontals.length + verticals.length;
    let css = "";

    for (let i = 0; i < totalElements; i++) {
      const offset = i * 0.2;
      css += `
        @keyframes flow-cascade-${i} {
          0% { opacity: 0; }
          ${10 + offset}% { opacity: 0.6; }
          ${50 + offset}% { opacity: 0.8; }
          ${90 - offset}% { opacity: 0.4; }
          100% { opacity: 0; }
        }
      `;
    }

    style.textContent = css;
    document.head.appendChild(style);
    styleRef.current = style;

    return () => {
      if (styleRef.current) {
        document.head.removeChild(styleRef.current);
        styleRef.current = null;
      }
    };
  }, []);

  return null;
}
