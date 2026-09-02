"use client";

import { useEffect, useRef } from "react";
import { useMotionOk } from "../hooks";

/**
 * L—04 · las dos cascadas de pérdidas ópticas.
 *
 * Cada paso multiplica lo que queda del anterior, así que el ancho de la
 * barra es `860 · v^0.42` — la raíz comprime cuatro órdenes de magnitud
 * en una lámina sin que los últimos escalones desaparezcan.
 *
 * Las barras arrancan colapsadas (`.espera`) y crecen cuando la lámina
 * entra en pantalla (`.anima`). Si no hay IntersectionObserver o el
 * usuario pidió menos movimiento, el estado inicial ya es el final.
 */

type Paso = [string, number];
type Tramo = { etiqueta: string; pct: string; y: number; w: number; op: number; delay: string };

const LUZ: Paso[] = [
  ["Luz que produce el LED", 1],
  ["Entra al embudo y a la fibra", 0.12],
  ["Se reparte entre 4 fibras", 0.25],
  ["Viaja 30 cm por la fibra", 0.99],
  ["Cruza la punta hacia el aire", 0.96],
];

const IR: Paso[] = [
  ["Luz que produce el emisor", 1],
  ["Entra al embudo y a la fibra", 0.12],
  ["Viaja 30 cm de subida", 0.71],
  ["Cruza la punta hacia el aire", 0.96],
  ["Rebota en el plato blanco", 0.7],
  ["La fibra recaptura el rebote", 0.25],
  ["Viaja 30 cm de bajada", 0.71],
  ["Cruza la punta de bajada", 0.96],
  ["El detector captura el rebote", 0.2],
];

const X = 20;
const ANCHO = 860;

/** Acumula el producto de los factores y deja cada tramo listo para
 *  dibujar. Corre una vez al cargar el módulo: nada que recalcular por
 *  render, y nada que mutar dentro del árbol. */
function tramos(pasos: Paso[], y0: number): Tramo[] {
  let v = 1;
  return pasos.map(([etiqueta, factor], i) => {
    v *= factor;
    return {
      etiqueta,
      pct: `${(v * 100).toFixed(2)} %`,
      y: y0 + i * 32,
      w: Number(Math.max(2, ANCHO * Math.pow(v, 0.42)).toFixed(1)),
      op: Number((0.28 + 0.5 * v).toFixed(2)),
      delay: `${(i * 0.09).toFixed(2)}s`,
    };
  });
}

const TRAMOS_LUZ = tramos(LUZ, 40);
const TRAMOS_IR = tramos(IR, 280);

function Cascada({ datos, color }: { datos: Tramo[]; color: string }) {
  return (
    <g>
      {datos.map((t, i) => (
        <g key={i}>
          <rect
            className="barra"
            style={{ animationDelay: t.delay }}
            x={X}
            y={t.y}
            width={t.w}
            height={18}
            rx={2}
            fill={color}
            opacity={t.op}
          />
          <text className="rot" x={X + 8} y={t.y + 13}>
            {t.etiqueta}
          </text>
          <text className="rot-cota" x={X + ANCHO + 10} y={t.y + 13} textAnchor="end">
            {t.pct}
          </text>
        </g>
      ))}
    </g>
  );
}

export function MesaCascadas() {
  const svg = useRef<SVGSVGElement>(null);
  const animar = useMotionOk();

  useEffect(() => {
    const host = svg.current;
    if (!host || !animar) return;

    const arranca = () => {
      host.classList.remove("espera");
      host.classList.add("anima");
    };

    host.classList.add("espera");
    if (!("IntersectionObserver" in window)) {
      arranca();
      return;
    }
    const io = new IntersectionObserver(
      (entradas) => {
        if (entradas[0].isIntersecting) {
          arranca();
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(host);
    // Red de seguridad: si el observer nunca dispara (contenedor sin
    // altura, pestaña en segundo plano al cargar), las barras crecen igual.
    const t = window.setTimeout(arranca, 6000);
    return () => {
      io.disconnect();
      window.clearTimeout(t);
    };
  }, [animar]);

  return (
    <div className="plano">
      <svg
        ref={svg}
        viewBox="0 0 900 600"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Cascada de pérdidas ópticas en iluminación y sensado"
      >
        <text className="rot-fuerte" x="20" y="26">
          Iluminación · cuánta luz del LED sale por la punta
        </text>
        <Cascada datos={TRAMOS_LUZ} color="var(--luz)" />
        <text className="rot-fuerte" x="20" y="266" fill="var(--ir)">
          Sensado · cuánta señal regresa con un plato blanco encima
        </text>
        <Cascada datos={TRAMOS_IR} color="var(--ir)" />
      </svg>
    </div>
  );
}
