"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMotionOk } from "../hooks";

/**
 * L—03 · planta interactiva de la mesa.
 *
 * Puerto del `<canvas>`-SVG del documento original a estado de React:
 * los vasos son estado, y la opacidad/el radio de cada punto de fibra
 * se derivan en el render en vez de mutarse por atributo. La retícula
 * (893 puntos + 234 celdas) es determinista y se calcula una sola vez a
 * nivel de módulo, así el SSR y la hidratación coinciden byte a byte.
 */

const MARGEN = 46;
const ANCHO = 1200;
const ALTO = 600;
const PASO = 20;
const BANDA_SUP = 190;
const BANDA_INF = 470;
const RADIO_VASO = 42;
const R_NUCLEO = 52;
const R_HALO = 132;
const R_CELDA = 46;
/** Tope de objetos simultáneos; el más viejo cede su lugar. */
const MAX_VASOS = 6;

type Punto = { x: number; y: number; densa: boolean };
type Celda = { x: number; y: number; abierta?: boolean };
type Vaso = { x: number; y: number };
type Onda = { id: number; x: number; y: number };

/** Banda central cada 20 mm; orillas cada 60 mm en cinco renglones. */
const PUNTOS: Punto[] = (() => {
  const out: Punto[] = [];
  const orillaY = new Set([46, 106, 166, 506, 566]);
  for (let x = MARGEN; x <= ANCHO - MARGEN + 20; x += PASO) {
    for (let y = MARGEN; y <= ALTO - MARGEN + 20; y += PASO) {
      const densa = y >= BANDA_SUP && y <= BANDA_INF;
      if (!densa) {
        const ix = Math.round((x - MARGEN) / PASO);
        if (ix % 3 !== 0) continue;
        if (!orillaY.has(y)) continue;
      }
      out.push({ x, y, densa });
    }
  }
  return out;
})();

/** Un cabezal por cada haz de 4 fibras: retícula de 40 mm en la banda
 *  central, y cabezales de alcance ancho en las dos orillas. */
const CELDAS: Celda[] = (() => {
  const out: Celda[] = [];
  for (let cx = 66; cx <= 1166; cx += 40) {
    for (let cy = 210; cy <= 460; cy += 40) out.push({ x: cx, y: cy });
  }
  for (let ox = 76; ox <= 1156; ox += 60) {
    out.push({ x: ox, y: 76, abierta: true });
    out.push({ x: ox, y: 536, abierta: true });
  }
  return out;
})();

/** Núcleo intenso bajo el objeto + halo que cae con exponente 1.7. */
function nivelEn(p: { x: number; y: number }, vasos: Vaso[]): number {
  let mejor = 0;
  for (const v of vasos) {
    const d = Math.hypot(p.x - v.x, p.y - v.y);
    let nivel = 0;
    if (d <= R_NUCLEO) nivel = 1;
    else if (d <= R_HALO)
      nivel = Math.pow(1 - (d - R_NUCLEO) / (R_HALO - R_NUCLEO), 1.7) * 0.78;
    if (nivel > mejor) mejor = nivel;
  }
  return mejor;
}

function cabezalVe(c: Celda, vasos: Vaso[]): boolean {
  const alcance = c.abierta ? 84 : R_CELDA;
  return vasos.some((v) => Math.hypot(c.x - v.x, c.y - v.y) <= alcance);
}

export function MesaPlanta() {
  // Dos objetos de arranque: la mesa nunca se ve "apagada" al cargar,
  // y el SSR emite exactamente lo mismo que la primera hidratación.
  const [vasos, setVasos] = useState<Vaso[]>([
    { x: 430, y: 300 },
    { x: 880, y: 390 },
  ]);
  const [ondas, setOndas] = useState<Onda[]>([]);
  const animar = useMotionOk();
  const lienzo = useRef<SVGSVGElement>(null);
  const ondaId = useRef(0);
  const timers = useRef<number[]>([]);

  // Las ondas se autodestruyen por temporizador; si el componente se va
  // antes, no dejamos setState pendientes apuntando a un árbol muerto.
  useEffect(() => {
    const pendientes = timers.current;
    return () => pendientes.forEach((t) => window.clearTimeout(t));
  }, []);

  /** Onda de impacto al posar un objeto. Se autodestruye al terminar la
   *  animación; bajo movimiento reducido nunca se emite. */
  const emitirOnda = useCallback(
    (x: number, y: number) => {
      if (!animar) return;
      const id = ondaId.current++;
      setOndas((prev) => [...prev, { id, x, y }]);
      const t = window.setTimeout(() => {
        setOndas((prev) => prev.filter((o) => o.id !== id));
      }, 850);
      timers.current.push(t);
    },
    [animar]
  );

  const ponerVaso = useCallback(
    (x: number, y: number) => {
      setVasos((prev) => [...prev.slice(prev.length >= MAX_VASOS ? 1 : 0), { x, y }]);
      emitirOnda(x, y);
    },
    [emitirOnda]
  );

  const onClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const caja = lienzo.current?.getBoundingClientRect();
    if (!caja) return;
    const x = ((e.clientX - caja.left) / caja.width) * 1240;
    const y = ((e.clientY - caja.top) / caja.height) * 660;
    if (x < 30 || x > 1210 || y < 30 || y > 610) return;
    // Clic sobre un objeto existente = levantarlo de la mesa.
    const i = vasos.findIndex((v) => Math.hypot(v.x - x, v.y - y) < RADIO_VASO);
    if (i >= 0) {
      setVasos((prev) => prev.filter((_, j) => j !== i));
      return;
    }
    ponerVaso(x, y);
  };

  const onKeyDown = (e: React.KeyboardEvent<SVGSVGElement>) => {
    const k = e.key;
    if (k === "Enter" || k === " ") {
      ponerVaso(620, 330);
    } else if (k === "Delete" || k === "Backspace") {
      setVasos((prev) => prev.slice(0, -1));
    } else if (
      vasos.length > 0 &&
      (k === "ArrowLeft" || k === "ArrowRight" || k === "ArrowUp" || k === "ArrowDown")
    ) {
      const paso = e.shiftKey ? 60 : 20;
      const dx = k === "ArrowLeft" ? -paso : k === "ArrowRight" ? paso : 0;
      const dy = k === "ArrowUp" ? -paso : k === "ArrowDown" ? paso : 0;
      setVasos((prev) =>
        prev.map((v, i) =>
          i === prev.length - 1
            ? {
                x: Math.min(1200, Math.max(40, v.x + dx)),
                y: Math.min(600, Math.max(40, v.y + dy)),
              }
            : v
        )
      );
    } else {
      return;
    }
    e.preventDefault();
  };

  const activos = CELDAS.reduce((n, c) => n + (cabezalVe(c, vasos) ? 1 : 0), 0);
  const reposo = vasos.length === 0;
  const lectura =
    `${vasos.length} ${vasos.length === 1 ? "objeto" : "objetos"} · ` +
    `${activos} ${activos === 1 ? "cabezal activo" : "cabezales activos"}` +
    (reposo ? " · modo de reposo" : "");

  return (
    <>
      <div className="mando">
        <button className="boton" type="button" onClick={() => setVasos([])}>
          Quitar todo
        </button>
        <span aria-live="polite">{lectura}</span>
        <span style={{ color: "var(--cota)" }}>
          Teclado: Entrar pone · Supr quita · flechas mueven
        </span>
      </div>

      <div className="plano">
        <svg
          viewBox="0 0 1240 660"
          xmlns="http://www.w3.org/2000/svg"
          id="lienzoPlanta"
          ref={lienzo}
          tabIndex={0}
          role="application"
          aria-label="Planta de la mesa. Clic para poner o quitar un vaso. Con teclado: Entrar pone un vaso, Suprimir quita el último, las flechas lo mueven."
          onClick={onClick}
          onKeyDown={onKeyDown}
        >
          <defs>
            <pattern
              id="terrazoPlanta"
              width="46"
              height="46"
              patternUnits="userSpaceOnUse"
            >
              <rect width="46" height="46" fill="var(--cemento)" />
              <polygon points="6,10 15,6 19,14 9,18" fill="var(--chip-pale)" opacity=".5" />
              <polygon points="28,5 38,9 33,17 26,13" fill="var(--chip-verde)" opacity=".42" />
              <polygon points="11,29 20,26 24,36 13,38" fill="var(--chip-rosa)" opacity=".38" />
              <polygon points="33,30 42,34 38,43 31,39" fill="var(--chip-pale)" opacity=".28" />
            </pattern>
          </defs>
          <rect x="20" y="20" width="1200" height="600" fill="url(#terrazoPlanta)" rx="3" />
          <rect
            x="20"
            y="20"
            width="1200"
            height="600"
            fill="none"
            stroke="var(--cemento-claro)"
            strokeWidth="3"
            rx="3"
          />
          <g stroke="var(--linea)" strokeWidth="1" strokeDasharray="6 7" opacity=".35">
            <line x1="320" y1="20" x2="320" y2="620" />
            <line x1="620" y1="20" x2="620" y2="620" />
            <line x1="920" y1="20" x2="920" y2="620" />
            <line x1="20" y1="320" x2="1220" y2="320" />
          </g>

          {/* Cabezales: morado sólido = está viendo un objeto. */}
          <g className="capa-celdas">
            {CELDAS.map((c, i) => {
              const visto = cabezalVe(c, vasos);
              return (
                <rect
                  key={i}
                  x={c.x - 14}
                  y={c.y - 14}
                  width={28}
                  height={28}
                  rx={4}
                  fill={visto ? "rgba(200,107,224,0.18)" : "none"}
                  stroke="var(--ir)"
                  strokeWidth={visto ? 1.8 : 1.2}
                  opacity={visto ? 0.95 : 0.2}
                />
              );
            })}
          </g>

          {/* Puntas de fibra: núcleo + halo calculados por distancia. */}
          <g className={`capa-puntos${reposo && animar ? " reposo" : ""}`}>
            {PUNTOS.map((p, i) => {
              const nivel = nivelEn(p, vasos);
              const base = p.densa ? 2.6 : 3.6;
              return (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={Number((base + nivel * 1.6).toFixed(2))}
                  fill="var(--luz)"
                  opacity={Number((0.1 + nivel * 0.9).toFixed(3))}
                />
              );
            })}
          </g>

          <g>
            {vasos.map((v, i) => (
              <g key={i}>
                <circle
                  cx={v.x}
                  cy={v.y}
                  r={RADIO_VASO}
                  fill="var(--fibra)"
                  fillOpacity="0.14"
                  stroke="var(--fibra)"
                  strokeWidth="1.6"
                />
                <circle
                  cx={v.x}
                  cy={v.y}
                  r={RADIO_VASO - 9}
                  fill="none"
                  stroke="var(--fibra)"
                  strokeWidth="1"
                  strokeOpacity="0.45"
                />
              </g>
            ))}
          </g>

          <g>
            {ondas.map((o) => (
              <circle
                key={o.id}
                className="onda"
                cx={o.x}
                cy={o.y}
                r={34}
                fill="none"
                stroke="var(--luz)"
                strokeWidth="2"
              />
            ))}
          </g>

          <line className="lin-cota" x1="20" y1="644" x2="1220" y2="644" />
          <line className="lin-cota" x1="20" y1="638" x2="20" y2="650" />
          <line className="lin-cota" x1="1220" y1="638" x2="1220" y2="650" />
          <text className="rot-cota" x="586" y="660">
            1200 mm
          </text>
          <text className="rot-cota" x="330" y="44">
            módulo 300 × 300
          </text>
        </svg>
      </div>
    </>
  );
}
