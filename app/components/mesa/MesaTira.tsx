"use client";

import { useEffect, useRef } from "react";
import { useMotionOk } from "../hooks";

/**
 * Tira de portada — la superficie de terrazo vista de frente, con las
 * puntas de fibra encendidas en gradiente hacia el centro.
 *
 * Los puntos son deterministas (posición, radio, opacidad y desfase del
 * parpadeo salen de la coordenada), así que se emiten en el HTML del
 * servidor. Los destellos ocasionales —la mesa "despertando"— sí usan
 * azar, por lo que viven en un efecto post-montaje y se inyectan como
 * nodos sueltos: son decorativos y no deben re-renderizar los 230
 * puntos en cada latido.
 */

type PuntoTira = { x: number; y: number; r: number; o: number; delay: number | null };

const PUNTOS_TIRA: PuntoTira[] = (() => {
  const out: PuntoTira[] = [];
  for (let x = 26; x < 1200; x += 26) {
    for (let y = 22; y < 150; y += 26) {
      const f = Math.max(0, 1 - Math.abs(x - 470) / 300);
      out.push({
        x,
        y,
        r: Number((1.7 + f * 2.1).toFixed(1)),
        o: Number((0.14 + f * 0.82).toFixed(2)),
        delay: f > 0.18 ? ((x * 7 + y * 13) % 45) / 10 : null,
      });
    }
  }
  return out;
})();

const NS = "http://www.w3.org/2000/svg";

export function MesaTira() {
  const svg = useRef<SVGSVGElement>(null);
  const animar = useMotionOk();

  useEffect(() => {
    const host = svg.current;
    if (!host || !animar) return;

    const pendientes = new Set<number>();
    const intervalo = window.setInterval(() => {
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", (60 + Math.random() * 1080).toFixed(0));
      c.setAttribute("cy", (30 + Math.random() * 90).toFixed(0));
      c.setAttribute("r", "24");
      c.setAttribute("fill", "var(--luz)");
      c.setAttribute("class", "flor");
      host.appendChild(c);
      const t = window.setTimeout(() => {
        c.remove();
        pendientes.delete(t);
      }, 2800);
      pendientes.add(t);
    }, 2600);

    return () => {
      window.clearInterval(intervalo);
      pendientes.forEach((t) => window.clearTimeout(t));
    };
  }, [animar]);

  return (
    <div className="tira">
      <svg
        ref={svg}
        viewBox="0 0 1200 150"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Superficie de terrazo con puntos de fibra encendidos"
      >
        <defs>
          <pattern id="terrazoTira" width="52" height="52" patternUnits="userSpaceOnUse">
            <rect width="52" height="52" fill="var(--cemento)" />
            <polygon points="6,10 16,6 20,15 10,19" fill="var(--chip-pale)" opacity=".78" />
            <polygon points="30,4 41,9 36,17 28,13" fill="var(--chip-verde)" opacity=".62" />
            <polygon points="12,32 22,29 26,39 15,42" fill="var(--chip-rosa)" opacity=".55" />
            <polygon points="36,30 46,34 42,44 34,40" fill="var(--chip-pale)" opacity=".45" />
            <polygon points="2,44 9,42 11,49 3,50" fill="var(--chip-verde)" opacity=".4" />
          </pattern>
        </defs>
        <rect width="1200" height="150" fill="url(#terrazoTira)" />
        <g>
          {PUNTOS_TIRA.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={p.r}
              fill="var(--luz)"
              opacity={p.o}
              className={p.delay !== null ? "parpadea" : undefined}
              style={p.delay !== null ? { animationDelay: `${p.delay}s` } : undefined}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
