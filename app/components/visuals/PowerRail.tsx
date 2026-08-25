"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "../portfolio-visuals";
import { useViewportWidth } from "../hooks";

type Node = { id: string; label: string };

/**
 * PowerRail — fixed lateral "power line" with one node per section.
 * Nodes light up via IntersectionObserver; click jumps (smooth, or
 * instant under reduced motion). Discovers sections from the DOM so it
 * can never drift out of sync with Portfolio.tsx.
 */
export function PowerRail() {
  const width = useViewportWidth();
  const reduced = useReducedMotion();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("#main-scene section[id]")
    );
    const sync = () =>
      setNodes(
        sections.map((s) => ({ id: s.id, label: s.id.replace(/-/g, " ") }))
      );
    sync();
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive((e.target as HTMLElement).id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  if (width < 1100 || nodes.length === 0) return null;

  return (
    <nav className="power-rail" aria-label="Section navigation">
      {nodes.map((n) => (
        <button
          key={n.id}
          type="button"
          data-magnetic
          className={`power-rail-node${active === n.id ? " active" : ""}`}
          aria-label={n.label}
          onClick={() =>
            document
              .getElementById(n.id)
              ?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" })
          }
        />
      ))}
    </nav>
  );
}
