"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef } from "react";
import { useMotionOk } from "../hooks";
import { MesaCascadas } from "./MesaCascadas";
import { MesaPlanta } from "./MesaPlanta";
import { MesaTira } from "./MesaTira";

/**
 * /customer/tarzzo/mesa — anteproyecto de una mesa de terrazo con 874 fibras
 * ópticas que ilumina y detecta por el mismo hilo.
 *
 * El documento conserva su identidad visual propia (concreto + terrazo,
 * Bricolage Grotesque) en vez de adoptar la consola cyan del resto del
 * sitio: es la pieza, no una sección más del portfolio. Todo su CSS vive
 * aislado bajo `.mesa` en `mesa-terrazo.css`.
 *
 * Las tres piezas con lógica —tira de portada, cascadas de pérdidas y la
 * planta interactiva— son componentes aparte. Lo que queda aquí es
 * lámina estática más dos observadores: el revelado al hacer scroll y la
 * pausa de animaciones fuera de pantalla.
 */
export function MesaTerrazo() {
  const raiz = useRef<HTMLDivElement>(null);
  const animar = useMotionOk();

  useEffect(() => {
    const host = raiz.current;
    if (!host || !animar) return;
    if (!("IntersectionObserver" in window)) return;

    // Revelado por scroll. La clase `revela` (que es la que esconde) se
    // añade desde JS: sin JS el documento se lee completo.
    const revelables = Array.from(
      host.querySelectorAll<HTMLElement>(
        ".portada > .envoltura, .lamina > .envoltura, .notas > .envoltura"
      )
    );
    revelables.forEach((el) => el.classList.add("revela"));
    const ioRevela = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("visible");
            ioRevela.unobserve(en.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    revelables.forEach((el) => ioRevela.observe(el));
    // Red de seguridad: nada se queda invisible por un observer que no
    // disparó (impresión, pestaña en segundo plano, contenedor raro).
    const t = window.setTimeout(() => {
      revelables.forEach((el) => el.classList.add("visible"));
    }, 4500);

    // Rendimiento: los SVG animados se congelan mientras no se ven.
    const animados = Array.from(
      host.querySelectorAll<HTMLElement>(".plano svg, .tira svg")
    );
    const ioPausa = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((en) => {
          en.target.classList.toggle("pausada", !en.isIntersecting);
        });
      },
      { rootMargin: "120px" }
    );
    animados.forEach((el) => ioPausa.observe(el));

    return () => {
      ioRevela.disconnect();
      ioPausa.disconnect();
      window.clearTimeout(t);
      // El revelado esconde vía clase: al desmontar el efecto hay que
      // devolver los elementos a visibles, o un cambio de preferencia
      // dejaría media lámina en blanco.
      revelables.forEach((el) => el.classList.remove("revela"));
      animados.forEach((el) => el.classList.remove("pausada"));
    };
  }, [animar]);

  return (
    <div className="mesa" ref={raiz}>
      {/* Vuelta al portfolio — única concesión al chrome del sitio. */}
      <nav className="regreso" aria-label="Migas">
        <div className="envoltura">
          <Link href="/">← cobos.io</Link>
          <span>Anteproyecto · mesa de terrazo</span>
        </div>
      </nav>

      <header className="portada">
        <div className="envoltura">
          <p className="eyebrow">Anteproyecto · Mesa de interior</p>
          <h1>
            Una mesa de terrazo que <em>responde</em> a lo que pones encima
          </h1>
          <p className="bajada">
            Se ve como una mesa de terrazo normal: piedra pulida con chips de
            mármol. Pero la atraviesan 874 fibras ópticas más delgadas que un
            espagueti, pulidas al ras con la superficie. Cuando colocas un vaso,
            un plato o la mano, la mesa lo siente y enciende un núcleo de luz
            debajo del objeto con un halo que se difumina alrededor. Sin botones,
            sin sensores visibles, sin nada en el borde: toda la electrónica vive
            debajo de la losa.
          </p>
          <MesaTira />
        </div>
      </header>

      {/* ═══ L—00 · el principio ═══════════════════════════════ */}
      <section className="lamina">
        <div className="envoltura">
          <div className="cabecera">
            <span className="folio sensor">L—00</span>
            <h2>Cómo funciona</h2>
          </div>
          <p className="entrada">
            El truco es que cada fibra hace dos trabajos a la vez. Hacia arriba
            lleva la luz de color que ves. Y al mismo tiempo lleva un pulso de luz
            infrarroja —invisible al ojo— que sale por la punta, y solo regresa si
            hay algo encima que la rebote. La mesa se ilumina y se siente a sí
            misma por el mismo hilo.
          </p>

          <div className="plano">
            <svg
              viewBox="0 0 900 300"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="El principio en tres pasos: mesa en reposo con infrarrojo que no regresa, un vaso rebota el infrarrojo, y la mesa enciende núcleo y halo"
            >
              {/* 1 · reposo */}
              <g>
                <text className="rot-fuerte" x="30" y="34">
                  1 · En reposo
                </text>
                <rect x="30" y="110" width="240" height="16" fill="var(--cemento)" />
                <g stroke="var(--fibra)" strokeWidth="2">
                  <line x1="90" y1="110" x2="90" y2="150" />
                  <line x1="150" y1="110" x2="150" y2="150" />
                  <line x1="210" y1="110" x2="210" y2="150" />
                </g>
                <g fill="var(--luz)" opacity=".3">
                  <circle cx="90" cy="110" r="3" />
                  <circle cx="150" cy="110" r="3" />
                  <circle cx="210" cy="110" r="3" />
                </g>
                <g stroke="var(--ir)" strokeWidth="1.3" opacity=".8">
                  <line x1="150" y1="150" x2="150" y2="112" />
                  <path d="M150,112 L146,120" />
                  <path d="M150,112 L154,120" />
                  <line x1="150" y1="100" x2="150" y2="66" strokeDasharray="3 4" opacity=".5" />
                </g>
                <circle className="ir-sube" cx="150" cy="146" r="3.2" fill="var(--ir)" />
                <text className="rot-cota" x="30" y="188">
                  El infrarrojo sube, sale por la punta
                </text>
                <text className="rot-cota" x="30" y="206">
                  y se pierde en el aire. No regresa nada:
                </text>
                <text className="rot-cota" x="30" y="224">
                  la mesa sabe que no hay nadie.
                </text>
              </g>
              {/* 2 · se posa un vaso */}
              <g>
                <text className="rot-fuerte" x="330" y="34">
                  2 · Se posa un vaso
                </text>
                <path d="M400,54 L406,110 L454,110 L460,54 Z" fill="var(--fibra)" opacity=".18" />
                <path
                  d="M400,54 L406,110 L454,110 L460,54"
                  fill="none"
                  stroke="var(--fibra)"
                  strokeWidth="1.5"
                />
                <rect x="330" y="110" width="240" height="16" fill="var(--cemento)" />
                <g stroke="var(--fibra)" strokeWidth="2">
                  <line x1="390" y1="110" x2="390" y2="150" />
                  <line x1="430" y1="110" x2="430" y2="150" />
                  <line x1="470" y1="110" x2="470" y2="150" />
                </g>
                <g stroke="var(--ir)" strokeWidth="1.5">
                  <line x1="430" y1="150" x2="430" y2="112" />
                  <path d="M427,108 Q430,102 433,108" fill="none" />
                  <line x1="433" y1="112" x2="433" y2="146" />
                  <path d="M433,146 L429,138" />
                  <path d="M433,146 L437,138" />
                </g>
                <circle className="ir-rebota" cx="426" cy="146" r="3.2" fill="var(--ir)" />
                <text className="rot-cota" x="330" y="188">
                  El infrarrojo rebota en el fondo del vaso
                </text>
                <text className="rot-cota" x="330" y="206">
                  y regresa por la misma fibra hasta un
                </text>
                <text className="rot-cota" x="330" y="224">
                  detector que está debajo de la losa.
                </text>
              </g>
              {/* 3 · la mesa responde */}
              <g>
                <text className="rot-fuerte" x="630" y="34">
                  3 · La mesa responde
                </text>
                <path d="M700,54 L706,110 L754,110 L760,54 Z" fill="var(--fibra)" opacity=".18" />
                <path
                  d="M700,54 L706,110 L754,110 L760,54"
                  fill="none"
                  stroke="var(--fibra)"
                  strokeWidth="1.5"
                />
                <path d="M706,84 L754,84 L754,110 L706,110 Z" fill="var(--luz)" opacity=".2" />
                <rect x="630" y="110" width="240" height="16" fill="var(--cemento)" />
                <g stroke="var(--fibra)" strokeWidth="2">
                  <line x1="660" y1="110" x2="660" y2="150" />
                  <line x1="690" y1="110" x2="690" y2="150" />
                  <line x1="720" y1="110" x2="720" y2="150" />
                  <line x1="750" y1="110" x2="750" y2="150" />
                  <line x1="780" y1="110" x2="780" y2="150" />
                  <line x1="810" y1="110" x2="810" y2="150" />
                </g>
                <circle
                  className="anillo-halo"
                  cx="735"
                  cy="110"
                  r="30"
                  fill="none"
                  stroke="var(--luz)"
                  strokeWidth="1.6"
                />
                <g fill="var(--luz)">
                  <circle className="late" cx="720" cy="110" r="4.6" />
                  <circle className="late" cx="750" cy="110" r="4.6" />
                </g>
                <g fill="var(--luz)" opacity=".5">
                  <circle cx="690" cy="110" r="3.6" />
                  <circle cx="780" cy="110" r="3.6" />
                </g>
                <g fill="var(--luz)" opacity=".22">
                  <circle cx="660" cy="110" r="3" />
                  <circle cx="810" cy="110" r="3" />
                </g>
                <text className="rot-cota" x="630" y="188">
                  El controlador enciende los LED de esa
                </text>
                <text className="rot-cota" x="630" y="206">
                  zona: núcleo intenso bajo el objeto y un
                </text>
                <text className="rot-cota" x="630" y="224">
                  halo que se apaga suave hacia afuera.
                </text>
              </g>
              <text className="rot-cota" x="30" y="272">
                Todo el ciclo tarda menos de una décima de segundo: al ojo, la
                respuesta es instantánea.
              </text>
            </svg>
          </div>

          <ul className="claves">
            <li>
              <b>1</b>Las fibras están agrupadas en haces de 4. Cada haz termina
              abajo en un “cabezal”: una pieza pequeña con el LED de color, el
              emisor infrarrojo y el detector.
            </li>
            <li>
              <b>2</b>El infrarrojo y el color no se estorban porque son colores
              distintos de luz: viajan juntos por la misma fibra, como dos
              conversaciones en idiomas diferentes.
            </li>
            <li>
              <b>3</b>Para ignorar la luz del cuarto, el emisor infrarrojo
              parpadea muy rápido y el sistema resta lo que mide con él encendido
              y apagado. Lo que queda es solo el rebote del objeto.
            </li>
          </ul>
        </div>
      </section>

      {/* ═══ L—01 · la losa ════════════════════════════════════ */}
      <section className="lamina">
        <div className="envoltura">
          <div className="cabecera">
            <span className="folio">L—01</span>
            <h2>Cómo se fabrica la losa</h2>
          </div>
          <p className="entrada">
            La losa es terrazo epóxico: resina con chips de mármol, colada en una
            capa de 10 mm sobre un tablero perforado que se queda para siempre
            como parte de la mesa. Ese tablero es la clave del proceso: sus 874
            barrenos sostienen cada fibra en su lugar exacto mientras la resina
            cura, y después le da rigidez a todo. Al final se desbasta la
            superficie y las puntas de fibra quedan cortadas y pulidas al ras, en
            el mismo paso que pule la piedra.
          </p>

          <div className="plano">
            <svg
              viewBox="0 0 900 420"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="Corte del colado: tablero perforado permanente, fibras pasantes, cimbra perimetral, sobrecolado y línea de desbaste"
            >
              <defs>
                <pattern id="terrazoCorte" width="44" height="44" patternUnits="userSpaceOnUse">
                  <rect width="44" height="44" fill="var(--cemento)" />
                  <polygon points="5,9 14,5 18,13 8,17" fill="var(--chip-pale)" opacity=".7" />
                  <polygon points="26,4 36,8 31,16 24,12" fill="var(--chip-verde)" opacity=".55" />
                  <polygon points="10,27 19,24 23,34 12,36" fill="var(--chip-rosa)" opacity=".5" />
                  <polygon points="31,28 40,32 36,41 29,37" fill="var(--chip-pale)" opacity=".4" />
                </pattern>
              </defs>

              <rect x="96" y="120" width="22" height="130" fill="var(--cemento-claro)" />
              <rect x="702" y="120" width="22" height="130" fill="var(--cemento-claro)" />
              <text className="rot-cota" x="86" y="110">
                cimbra
              </text>

              <rect x="118" y="146" width="584" height="60" fill="url(#terrazoCorte)" />
              <rect x="118" y="146" width="584" height="60" fill="var(--luz)" opacity=".05" />
              <rect x="96" y="206" width="628" height="60" fill="var(--cemento-claro)" />
              <text className="rot" x="310" y="242">
                tablero perforado · se queda en la mesa
              </text>

              <g stroke="var(--fibra)" strokeWidth="2.6" strokeLinecap="round">
                <line x1="160" y1="118" x2="160" y2="292" />
                <line x1="220" y1="118" x2="220" y2="292" />
                <line x1="280" y1="118" x2="280" y2="292" />
                <line x1="340" y1="118" x2="340" y2="292" />
                <line x1="480" y1="118" x2="480" y2="292" />
                <line x1="540" y1="118" x2="540" y2="292" />
                <line x1="600" y1="118" x2="600" y2="292" />
                <line x1="660" y1="118" x2="660" y2="292" />
              </g>
              <g
                stroke="var(--fibra)"
                strokeWidth="2.6"
                fill="none"
                opacity=".65"
                strokeLinecap="round"
              >
                <path d="M160,292 C160,318 240,316 262,336" />
                <path d="M220,292 C220,318 252,320 262,336" />
                <path d="M280,292 C280,318 270,324 262,336" />
                <path d="M340,292 C340,320 282,324 262,336" />
                <path d="M480,292 C480,318 560,316 578,336" />
                <path d="M540,292 C540,318 570,320 578,336" />
                <path d="M600,292 C600,318 588,324 578,336" />
                <path d="M660,292 C660,320 600,324 578,336" />
              </g>
              <rect x="244" y="336" width="38" height="15" rx="3" fill="var(--fibra)" opacity=".85" />
              <rect x="560" y="336" width="38" height="15" rx="3" fill="var(--fibra)" opacity=".85" />
              <text className="rot-cota" x="300" y="349">
                al cabezal
              </text>

              <g fill="var(--clave)" opacity=".8">
                <circle cx="160" cy="270" r="3.4" />
                <circle cx="220" cy="270" r="3.4" />
                <circle cx="280" cy="270" r="3.4" />
                <circle cx="340" cy="270" r="3.4" />
                <circle cx="480" cy="270" r="3.4" />
                <circle cx="540" cy="270" r="3.4" />
                <circle cx="600" cy="270" r="3.4" />
                <circle cx="660" cy="270" r="3.4" />
              </g>

              <line
                x1="118"
                y1="158"
                x2="760"
                y2="158"
                stroke="var(--clave)"
                strokeWidth="1.6"
                strokeDasharray="9 6"
              />
              <text className="clave-svg" x="768" y="162">
                nivel final
              </text>

              <line className="lin-cota" x1="800" y1="146" x2="800" y2="158" />
              <line className="lin-cota" x1="794" y1="146" x2="806" y2="146" />
              <line className="lin-cota" x1="794" y1="158" x2="806" y2="158" />
              <text className="rot-cota" x="812" y="155">
                3 mm
              </text>
              <line className="lin-cota" x1="800" y1="158" x2="800" y2="206" />
              <line className="lin-cota" x1="794" y1="206" x2="806" y2="206" />
              <text className="rot-cota" x="812" y="186">
                10 mm
              </text>
              <line className="lin-cota" x1="800" y1="206" x2="800" y2="266" />
              <line className="lin-cota" x1="794" y1="266" x2="806" y2="266" />
              <text className="rot-cota" x="812" y="240">
                18 mm
              </text>

              <g>
                <circle className="clave-anillo" cx="62" cy="152" r="11" />
                <text className="clave-svg" x="58" y="156">
                  1
                </text>
                <line className="lin-eje" x1="73" y1="152" x2="118" y2="152" />
                <circle className="clave-anillo" cx="62" cy="186" r="11" />
                <text className="clave-svg" x="58" y="190">
                  2
                </text>
                <line className="lin-eje" x1="73" y1="186" x2="118" y2="186" />
                <circle className="clave-anillo" cx="62" cy="236" r="11" />
                <text className="clave-svg" x="58" y="240">
                  3
                </text>
                <line className="lin-eje" x1="73" y1="236" x2="96" y2="236" />
                <circle className="clave-anillo" cx="62" cy="285" r="11" />
                <text className="clave-svg" x="58" y="289">
                  4
                </text>
                <line className="lin-eje" x1="73" y1="285" x2="152" y2="272" />
                <circle className="clave-anillo" cx="62" cy="342" r="11" />
                <text className="clave-svg" x="58" y="346">
                  5
                </text>
                <line className="lin-eje" x1="73" y1="342" x2="244" y2="342" />
              </g>
              <text className="rot" x="118" y="94">
                fibras a tope contra un vidrio encerado durante el curado inicial
              </text>
            </svg>
          </div>

          <ul className="claves">
            <li>
              <b>1</b>Se cuela 3 mm por encima del espesor final. Ese exceso se
              desbasta después, llevándose las puntas de fibra sobrantes y dejando
              la superficie perfecta.
            </li>
            <li>
              <b>2</b>Terrazo epóxico de 10 mm: resina de colado con protección
              UV, chips de mármol fino donde hay más fibras y chip grande donde
              hay menos. Si la resina calienta de más al curar, se vierte en dos
              tandas.
            </li>
            <li>
              <b>3</b>Tablero de 18 mm cortado en CNC con los 874 barrenos. Es
              plantilla, fondo de molde y estructura, todo en una pieza.
            </li>
            <li>
              <b>4</b>Una gota de adhesivo bajo el tablero en cada fibra la fija y
              sella el barreno para que la resina no escurra.
            </li>
            <li>
              <b>5</b>Los haces de 4 fibras bajan unos 10 cm directo a su cabezal.
            </li>
          </ul>
        </div>
      </section>

      {/* ═══ L—02 · la mesa por dentro ═════════════════════════ */}
      <section className="lamina">
        <div className="envoltura">
          <div className="cabecera">
            <span className="folio">L—02</span>
            <h2>La mesa por dentro</h2>
          </div>
          <p className="entrada">
            Vista en corte, de arriba hacia abajo: la losa de terrazo con las
            fibras, el tablero que la sostiene, y un espacio cerrado y oscuro
            donde viven los 240 cabezales. El borde de la mesa queda completamente
            libre —puede ser recto, redondeado, la forma que quieras— porque nada
            del sistema necesita estar en el perímetro. Todo pesa unos 20 kilos.
          </p>

          <div className="plano">
            <svg
              viewBox="0 0 900 430"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="Corte de la mesa terminada: losa sobre tablero, haces bajando a cabezales, ventilación y estructura"
            >
              <defs>
                <pattern id="terrazoMesa" width="44" height="44" patternUnits="userSpaceOnUse">
                  <rect width="44" height="44" fill="var(--cemento)" />
                  <polygon points="5,9 14,5 18,13 8,17" fill="var(--chip-pale)" opacity=".7" />
                  <polygon points="26,4 36,8 31,16 24,12" fill="var(--chip-verde)" opacity=".55" />
                  <polygon points="10,27 19,24 23,34 12,36" fill="var(--chip-rosa)" opacity=".5" />
                  <polygon points="31,28 40,32 36,41 29,37" fill="var(--chip-pale)" opacity=".4" />
                </pattern>
              </defs>
              <text className="rot-cota" x="36" y="24">
                esquemático · espesores acotados, no a escala
              </text>

              <path d="M392,58 L400,150 L470,150 L478,58 Z" fill="var(--fibra)" opacity=".18" />
              <path
                d="M392,58 L400,150 L470,150 L478,58"
                fill="none"
                stroke="var(--fibra)"
                strokeWidth="1.6"
              />
              <path d="M400,112 L470,112 L470,150 L400,150 Z" fill="var(--luz)" opacity=".2" />
              <g className="corre" stroke="var(--ir)" strokeWidth="1.3" opacity=".85">
                <path d="M430,148 L424,137" />
                <path d="M430,148 L436,137" />
                <path d="M430,137 L430,148" />
              </g>

              <rect x="70" y="150" width="760" height="18" fill="url(#terrazoMesa)" />
              <line x1="70" y1="150" x2="830" y2="150" stroke="var(--linea)" strokeWidth="1" />
              <rect x="70" y="168" width="760" height="26" fill="var(--cemento-claro)" />
              <text className="rot-cota" x="712" y="185">
                tablero 18 mm
              </text>

              <g stroke="var(--fibra)" strokeWidth="2">
                <line x1="120" y1="150" x2="120" y2="194" />
                <line x1="150" y1="150" x2="150" y2="194" />
                <line x1="180" y1="150" x2="180" y2="194" />
                <line x1="210" y1="150" x2="210" y2="194" />
                <line x1="380" y1="150" x2="380" y2="194" />
                <line x1="410" y1="150" x2="410" y2="194" />
                <line x1="440" y1="150" x2="440" y2="194" />
                <line x1="470" y1="150" x2="470" y2="194" />
                <line x1="640" y1="150" x2="640" y2="194" />
                <line x1="670" y1="150" x2="670" y2="194" />
                <line x1="700" y1="150" x2="700" y2="194" />
                <line x1="730" y1="150" x2="730" y2="194" />
              </g>
              <g fill="var(--luz)">
                <circle className="late" cx="410" cy="150" r="4.5" />
                <circle className="late" cx="440" cy="150" r="4.5" />
              </g>
              <g fill="var(--luz)" opacity=".45">
                <circle cx="380" cy="150" r="3.4" />
                <circle cx="470" cy="150" r="3.4" />
              </g>
              <text className="rot-fuerte" x="404" y="40">
                núcleo
              </text>

              <rect x="70" y="194" width="760" height="140" fill="var(--fondo-2)" />
              <text className="rot" x="96" y="216">
                recinto oscuro · mamparas entre cabezales
              </text>

              <g stroke="var(--fibra)" strokeWidth="2" fill="none" opacity=".6">
                <path d="M120,194 C120,236 155,248 162,268" />
                <path d="M150,194 C150,240 160,252 165,268" />
                <path d="M180,194 C180,240 172,252 169,268" />
                <path d="M210,194 C210,236 178,250 172,268" />
                <path d="M380,194 C380,236 415,248 422,268" />
                <path d="M410,194 C410,240 420,252 425,268" />
                <path d="M440,194 C440,240 432,252 429,268" />
                <path d="M470,194 C470,236 438,250 432,268" />
                <path d="M640,194 C640,236 675,248 682,268" />
                <path d="M670,194 C670,240 680,252 685,268" />
                <path d="M700,194 C700,240 692,252 689,268" />
                <path d="M730,194 C730,236 698,250 692,268" />
              </g>

              <g>
                <path
                  d="M152,268 L182,268 L174,296 L160,296 Z"
                  fill="none"
                  stroke="var(--luz)"
                  strokeWidth="1.4"
                />
                <path
                  d="M412,268 L442,268 L434,296 L420,296 Z"
                  fill="none"
                  stroke="var(--luz)"
                  strokeWidth="1.4"
                />
                <path
                  d="M672,268 L702,268 L694,296 L680,296 Z"
                  fill="none"
                  stroke="var(--luz)"
                  strokeWidth="1.4"
                />
              </g>
              <rect x="100" y="296" width="700" height="16" rx="2" fill="var(--cemento-claro)" />
              <g>
                <rect x="158" y="291" width="10" height="6" rx="1" fill="var(--luz)" />
                <circle cx="174" cy="294" r="2.6" fill="var(--ir)" />
                <rect x="418" y="291" width="10" height="6" rx="1" fill="var(--luz)" />
                <circle cx="434" cy="294" r="2.6" fill="var(--ir)" />
                <rect x="678" y="291" width="10" height="6" rx="1" fill="var(--luz)" />
                <circle cx="694" cy="294" r="2.6" fill="var(--ir)" />
              </g>
              <text className="rot-cota" x="240" y="290">
                × 240 cabezales
              </text>

              <g>
                <path
                  d="M78,204 L104,204 L104,222 L92,222 L92,236 L118,236"
                  fill="none"
                  stroke="var(--linea)"
                  strokeWidth="1.4"
                />
                <path
                  d="M822,204 L796,204 L796,222 L808,222 L808,236 L782,236"
                  fill="none"
                  stroke="var(--linea)"
                  strokeWidth="1.4"
                />
              </g>

              <rect x="70" y="312" width="760" height="14" fill="var(--cemento-claro)" opacity=".5" />
              <rect x="150" y="326" width="24" height="86" fill="var(--cemento-claro)" opacity=".4" />
              <rect x="726" y="326" width="24" height="86" fill="var(--cemento-claro)" opacity=".4" />

              <line className="lin-cota" x1="862" y1="150" x2="862" y2="168" />
              <line className="lin-cota" x1="856" y1="150" x2="868" y2="150" />
              <line className="lin-cota" x1="856" y1="168" x2="868" y2="168" />
              <text className="rot-cota" x="872" y="164">
                10
              </text>
              <line className="lin-cota" x1="862" y1="168" x2="862" y2="194" />
              <line className="lin-cota" x1="856" y1="194" x2="868" y2="194" />
              <text className="rot-cota" x="872" y="186">
                18
              </text>
              <line className="lin-cota" x1="862" y1="194" x2="862" y2="312" />
              <line className="lin-cota" x1="856" y1="312" x2="868" y2="312" />
              <text className="rot-cota" x="872" y="258">
                100
              </text>

              <g>
                <circle className="clave-anillo" cx="36" cy="159" r="11" />
                <text className="clave-svg" x="32" y="163">
                  1
                </text>
                <line className="lin-eje" x1="47" y1="159" x2="70" y2="159" />
                <circle className="clave-anillo" cx="36" cy="181" r="11" />
                <text className="clave-svg" x="32" y="185">
                  2
                </text>
                <line className="lin-eje" x1="47" y1="181" x2="70" y2="181" />
                <circle className="clave-anillo" cx="36" cy="240" r="11" />
                <text className="clave-svg" x="32" y="244">
                  3
                </text>
                <line className="lin-eje" x1="47" y1="240" x2="78" y2="220" />
                <circle className="clave-anillo" cx="36" cy="286" r="11" />
                <text className="clave-svg" x="32" y="290">
                  4
                </text>
                <line className="lin-eje" x1="47" y1="286" x2="152" y2="278" />
                <circle className="clave-anillo" cx="36" cy="330" r="11" />
                <text className="clave-svg" x="32" y="334">
                  5
                </text>
                <line className="lin-eje" x1="47" y1="330" x2="100" y2="306" />
              </g>
            </svg>
          </div>

          <ul className="claves">
            <li>
              <b>1</b>Losa de 10 mm con las 874 fibras pulidas al ras. Borde libre:
              cualquier forma.
            </li>
            <li>
              <b>2</b>Tablero perforado de 18 mm que da rigidez y sostiene todo lo
              de abajo.
            </li>
            <li>
              <b>3</b>Ventilación en laberinto: un pasillo con dos o tres vueltas
              en negro mate. El aire de enfriamiento pasa, la luz no entra ni sale.
            </li>
            <li>
              <b>4</b>El cabezal: un embudo impreso en 3D con el interior
              reflejante, que junta el LED de color, el emisor infrarrojo y el
              detector frente a las 4 fibras de su haz, a unos 6 mm. El embudo
              recupera la luz que saldría de lado y aísla a cada cabezal de sus
              vecinos.
            </li>
            <li>
              <b>5</b>Placa portacabezales sobre separadores, desmontable por
              secciones para dar servicio.
            </li>
          </ul>
        </div>
      </section>

      {/* ═══ L—03 · la superficie desde arriba ═════════════════ */}
      <section className="lamina">
        <div className="envoltura">
          <div className="cabecera">
            <span className="folio">L—03</span>
            <h2>La superficie, vista desde arriba</h2>
          </div>
          <p className="entrada">
            Los puntos de luz no van parejos en toda la mesa. En la banda central,
            donde de verdad se posan vasos y platos, hay un punto cada 2 cm y el
            halo se ve fino y continuo. En la orilla hay un punto cada 6 cm, y ese
            espacio extra permite usar chips de mármol grandes, que son los que le
            dan al terrazo su cara clásica. Toca la superficie para poner un vaso:
            los recuadros morados son los cabezales que lo detectan.
          </p>

          <MesaPlanta />

          <ul className="claves">
            <li>
              <b>1</b>Banda central: fibras cada 20 mm, un cabezal cada 40 mm. 798
              fibras y 200 cabezales.
            </li>
            <li>
              <b>2</b>Orillas: fibras cada 60 mm con chips de mármol grandes entre
              ellas. 76 fibras y unos 40 cabezales.
            </li>
            <li>
              <b>3</b>Cada cabezal detecta lo que está sobre sus 4 fibras.
              Comparando qué tan fuerte responde cada cabezal vecino, el software
              calcula la posición del objeto con más precisión que la retícula
              misma, y el halo lo sigue sin saltos.
            </li>
            <li>
              <b>4</b>Todo se organiza en módulos de 300 × 300 mm: el tablero, los
              cabezales y el cableado se repiten módulo a módulo, y la losa sale
              de una sola pieza sin juntas.
            </li>
          </ul>
        </div>
      </section>

      {/* ═══ L—04 · las cuentas de la luz ══════════════════════ */}
      <section className="lamina">
        <div className="envoltura">
          <div className="cabecera">
            <span className="folio sensor">L—04</span>
            <h2>Las cuentas de la luz</h2>
          </div>
          <p className="entrada">
            En cada frontera —del LED a la fibra, de la fibra al aire, del objeto
            de regreso, y del cono de salida al detector— se pierde una parte de
            la luz. Estas dos cascadas multiplican todas esas pérdidas en orden,
            para saber de antemano cuánta luz sale por cada punta y cuánta señal
            regresa cuando hay un vaso. Son estimaciones de diseño: la placa de
            prueba es la que confirma o corrige estos números.
          </p>

          <MesaCascadas />

          <div className="envuelve" style={{ marginTop: 26 }}>
            <table className="datos">
              <thead>
                <tr>
                  <th>Objeto sobre la punta</th>
                  <th>Señal que regresa</th>
                  <th>Lectura</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Cerámica blanca vidriada</td>
                  <td>0.20 %</td>
                  <td>El caso fácil: refleja mucho</td>
                </tr>
                <tr>
                  <td>Piel humana en contacto</td>
                  <td>0.17 %</td>
                  <td>La piel refleja bien el infrarrojo, sin importar el tono</td>
                </tr>
                <tr>
                  <td>Cerámica negra mate</td>
                  <td>0.04 %</td>
                  <td>Baja, pero muchos pigmentos negros sí reflejan infrarrojo</td>
                </tr>
                <tr>
                  <td>Vidrio transparente, fondo limpio</td>
                  <td>0.011 %</td>
                  <td>Casi todo lo atraviesa. El caso más difícil del proyecto</td>
                </tr>
                <tr>
                  <td>Mano flotando a 10 cm</td>
                  <td>—</td>
                  <td>
                    Muy probablemente fuera de alcance: este sistema detecta lo que
                    se posa
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══ L—05 · el cerebro ═════════════════════════════════ */}
      <section className="lamina">
        <div className="envoltura">
          <div className="cabecera">
            <span className="folio">L—05</span>
            <h2>El cerebro</h2>
          </div>
          <p className="entrada">
            Un solo microcontrolador de unos 300 pesos gobierna todo. Treinta y
            cinco veces por segundo recorre los 240 detectores preguntando “¿ves
            algo?”, calcula dónde están los objetos, decide cómo debe verse la
            mesa, y manda ese cuadro a los LED. No necesita computadora, ni
            internet, ni configuración: se enciende la mesa y funciona.
          </p>

          <div className="plano">
            <svg
              viewBox="0 0 900 320"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="Diagrama de bloques: cabezales, multiplexores, microcontrolador, convertidor de nivel y LEDs"
            >
              <defs>
                <marker
                  id="flecha"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto"
                >
                  <path d="M0,0 L10,5 L0,10 z" fill="var(--linea)" />
                </marker>
                <marker
                  id="flechaIR"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto"
                >
                  <path d="M0,0 L10,5 L0,10 z" fill="var(--ir)" />
                </marker>
              </defs>

              <rect x="30" y="40" width="170" height="76" rx="3" fill="none" stroke="var(--ir)" strokeWidth="1.4" />
              <text className="rot-fuerte" x="48" y="66">
                240 cabezales
              </text>
              <text className="rot-cota" x="48" y="84">
                LED color + emisor IR
              </text>
              <text className="rot-cota" x="48" y="100">
                + detector
              </text>

              <line
                className="flujo"
                x1="200"
                y1="64"
                x2="286"
                y2="64"
                stroke="var(--ir)"
                strokeWidth="1.4"
                markerEnd="url(#flechaIR)"
              />
              <text className="rot-cota" x="212" y="56">
                240 señales
              </text>
              <rect x="286" y="40" width="150" height="52" rx="3" fill="none" stroke="var(--ir)" strokeWidth="1.4" />
              <text className="rot-fuerte" x="302" y="62">
                Selectores
              </text>
              <text className="rot-cota" x="302" y="80">
                16 multiplexores
              </text>

              <line
                className="flujo"
                x1="436"
                y1="66"
                x2="520"
                y2="66"
                stroke="var(--ir)"
                strokeWidth="1.4"
                markerEnd="url(#flechaIR)"
              />
              <text className="rot-cota" x="448" y="58">
                1 entrada · 35 Hz
              </text>

              <rect x="520" y="34" width="180" height="70" rx="3" fill="none" stroke="var(--tinta)" strokeWidth="1.5" />
              <text className="rot-fuerte" x="538" y="60">
                ESP32-S3
              </text>
              <text className="rot-cota" x="538" y="78">
                lee · localiza objetos
              </text>
              <text className="rot-cota" x="538" y="94">
                dibuja el cuadro de luz
              </text>

              <line
                className="flujo"
                x1="610"
                y1="104"
                x2="610"
                y2="160"
                stroke="var(--linea)"
                strokeWidth="1.4"
                markerEnd="url(#flecha)"
              />
              <rect x="520" y="160" width="180" height="52" rx="3" fill="none" stroke="var(--linea)" strokeWidth="1.3" />
              <text className="rot-fuerte" x="538" y="182">
                74AHCT125
              </text>
              <text className="rot-cota" x="538" y="200">
                adapta la señal a 5 V
              </text>

              <line
                className="flujo"
                x1="520"
                y1="186"
                x2="436"
                y2="186"
                stroke="var(--linea)"
                strokeWidth="1.4"
                markerEnd="url(#flecha)"
              />
              <rect x="286" y="160" width="150" height="52" rx="3" fill="none" stroke="var(--luz)" strokeWidth="1.4" />
              <text className="rot-fuerte" x="302" y="182">
                240 LED color
              </text>
              <text className="rot-cota" x="302" y="200">
                en los cabezales
              </text>
              <line
                className="flujo"
                x1="286"
                y1="186"
                x2="200"
                y2="130"
                stroke="var(--luz)"
                strokeWidth="1.4"
                markerEnd="url(#flecha)"
              />

              <line x1="700" y1="64" x2="760" y2="64" stroke="var(--linea)" strokeWidth="1.4" />
              <path
                d="M760,64 L760,240 L470,240"
                fill="none"
                stroke="var(--linea)"
                strokeWidth="1.4"
                markerEnd="url(#flecha)"
              />
              <rect x="330" y="216" width="140" height="48" rx="3" fill="none" stroke="var(--linea)" strokeWidth="1.3" />
              <text className="rot-fuerte" x="346" y="238">
                Interruptor IR
              </text>
              <text className="rot-cota" x="346" y="256">
                un MOSFET
              </text>
              <line
                className="flujo"
                x1="330"
                y1="240"
                x2="240"
                y2="116"
                stroke="var(--ir)"
                strokeWidth="1.4"
                markerEnd="url(#flechaIR)"
              />
              <text className="rot-cota" x="180" y="196">
                parpadeo: mide, apaga, resta
              </text>

              <rect x="30" y="216" width="180" height="48" rx="3" fill="none" stroke="var(--clave)" strokeWidth="1.4" />
              <text className="rot-fuerte" x="48" y="238">
                Fuente 5 V / 15 A
              </text>
              <text className="rot-cota" x="48" y="256">
                única
              </text>

              <text className="rot-cota" x="520" y="300">
                Del vaso a la luz: 30 a 60 milésimas de segundo. Instantáneo al ojo.
              </text>
            </svg>
          </div>
        </div>
      </section>

      {/* ═══ L—06 · cuadro de datos ════════════════════════════ */}
      <section className="lamina">
        <div className="envoltura">
          <div className="cabecera">
            <span className="folio">L—06</span>
            <h2>Cuadro de datos</h2>
          </div>
          <p className="entrada">
            Los números del proyecto para una mesa de 1200 × 600 mm. Si la mesa
            crece o cambia de forma, escalan en proporción: todo está organizado
            en módulos de 300 × 300.
          </p>
          <div className="envuelve">
            <table className="datos">
              <thead>
                <tr>
                  <th>Partida</th>
                  <th>Valor</th>
                  <th>Qué significa</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Fibras</td>
                  <td>874</td>
                  <td>798 en la banda central cada 20 mm + 76 en las orillas cada 60 mm</td>
                </tr>
                <tr>
                  <td>Cabezales</td>
                  <td>≈ 240</td>
                  <td>Uno por cada haz de 4 fibras: LED de color + emisor IR + detector + embudo</td>
                </tr>
                <tr>
                  <td>Losa</td>
                  <td>10 mm sobre tablero de 18</td>
                  <td>Terrazo epóxico; el tablero perforado da la rigidez</td>
                </tr>
                <tr>
                  <td>Peso</td>
                  <td>≈ 20 kg</td>
                  <td>Dos personas la mueven sin drama</td>
                </tr>
                <tr>
                  <td>Resina</td>
                  <td>≈ 8 kg</td>
                  <td>Unos 7 litros; se vierte en dos tandas si calienta de más</td>
                </tr>
                <tr>
                  <td>Precisión de detección</td>
                  <td>≈ 40 mm, afinable</td>
                  <td>La retícula de cabezales; el software interpola entre vecinos para afinar</td>
                </tr>
                <tr>
                  <td>Lecturas por segundo</td>
                  <td>≈ 35</td>
                  <td>Cada detector se consulta 35 veces por segundo</td>
                </tr>
                <tr>
                  <td>Cuadros de luz por segundo</td>
                  <td>hasta 138</td>
                  <td>Las animaciones se ven fluidas de sobra</td>
                </tr>
                <tr>
                  <td>Alimentación</td>
                  <td>5 V / 15 A</td>
                  <td>Una sola fuente; en uso real consume como un foco</td>
                </tr>
                <tr>
                  <td>Luz que sale por cada punta</td>
                  <td>≈ 3 % del LED</td>
                  <td>Suficiente en luz tenue; se valida en la placa de prueba</td>
                </tr>
                <tr>
                  <td>Señal de retorno con plato blanco</td>
                  <td>≈ 0.2 % del emisor</td>
                  <td>Pequeña pero medible: los fototransistores detectan señales mil veces menores</td>
                </tr>
                <tr>
                  <td>Horas de enhebrado</td>
                  <td>8 – 13</td>
                  <td>Pasar 874 fibras a mano; el trabajo más tedioso del proyecto</td>
                </tr>
                <tr>
                  <td>Placas de prueba</td>
                  <td>2 de 300 × 300 + 1 cabezal</td>
                  <td>Una en epóxico y una en cemento, con el cabezal real de producción</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══ L—07 · la prueba que decide ═══════════════════════ */}
      <section className="lamina">
        <div className="envoltura">
          <div className="cabecera">
            <span className="folio sensor">L—07</span>
            <h2>La prueba que decide todo</h2>
          </div>
          <p className="entrada">
            Antes de fabricar nada a escala, se construyen dos placas pequeñas de
            300 × 300 mm —una en epóxico y una en cemento, con la misma
            plantilla— y un solo cabezal, exactamente el de producción. Con eso se
            mide todo lo que hoy es estimación. La vara de medir es la relación
            señal a ruido, SNR: cuántas veces más grande es la señal del objeto
            que el ruido de fondo. A 10 o más, la detección es sólida; abajo de 3,
            no es confiable.
          </p>

          <div className="envuelve">
            <table className="datos">
              <thead>
                <tr>
                  <th>Medición</th>
                  <th>Criterio</th>
                  <th>Decisión</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Plato de cerámica blanca y mano, en contacto</td>
                  <td>SNR ≥ 10 con la luz de la sala encendida</td>
                  <td>Adelante con la mesa completa</td>
                </tr>
                <tr>
                  <td>Plato de cerámica blanca y mano, en contacto</td>
                  <td>SNR entre 3 y 10</td>
                  <td>Rescatable: medir más lento o mejorar el embudo</td>
                </tr>
                <tr>
                  <td>Plato de cerámica blanca y mano, en contacto</td>
                  <td>SNR menor a 3</td>
                  <td>Este método de detección no funciona; replantear</td>
                </tr>
                <tr>
                  <td>Detección con el LED de color a tope</td>
                  <td>La resta encendido/apagado sigue limpia</td>
                  <td>Si se ensucia: filtro que solo deja pasar infrarrojo sobre el detector</td>
                </tr>
                <tr>
                  <td>Punto de luz con 500 lux de sala</td>
                  <td>Visible a 2 m de distancia</td>
                  <td>Si no: terrazo más oscuro o resina más translúcida</td>
                </tr>
                <tr>
                  <td>Junto a la ventana más iluminada de la casa</td>
                  <td>El detector no se satura</td>
                  <td>En interior sin sol directo es poco probable; si pasa, filtro infrarrojo</td>
                </tr>
                <tr>
                  <td>Vaso de vidrio transparente vacío</td>
                  <td>Distinguible del fondo</td>
                  <td>Deseable; si no se logra, el vaso se detecta al servirle líquido</td>
                </tr>
                <tr>
                  <td>Epóxico contra cemento</td>
                  <td>Burbujas, aspecto del punto, horas de pulido</td>
                  <td>Fija el material de la mesa definitiva</td>
                </tr>
                <tr>
                  <td>Mano flotando a 10 cm</td>
                  <td>Cualquier señal</td>
                  <td>Bono si aparece; no es criterio de decisión</td>
                </tr>
              </tbody>
            </table>
          </div>

          <ul className="claves" style={{ marginTop: 30 }}>
            <li>
              <b>1</b>El cabezal de la prueba es el mismo que llevará la mesa. Si
              funciona, se replica 240 veces sin rediseñar nada.
            </li>
            <li>
              <b>2</b>El emisor infrarrojo parpadea y se resta la lectura con él
              apagado. Así se descuenta la luz del cuarto y la del propio LED de
              color.
            </li>
            <li>
              <b>3</b>La punta de cada fibra refleja un poquito de luz por sí sola,
              aun sin nada encima. Se guarda esa lectura de “mesa vacía” por canal
              y se descuenta siempre.
            </li>
            <li>
              <b>4</b>Costo de las dos placas con todo: 2,110 a 3,750 pesos. Es la
              única compra que hay que autorizar antes de decidir el resto.
            </li>
          </ul>
        </div>
      </section>

      {/* ═══ L—08 · cableado ═══════════════════════════════════ */}
      <section className="lamina">
        <div className="envoltura">
          <div className="cabecera">
            <span className="folio">L—08</span>
            <h2>Cableado</h2>
          </div>
          <p className="entrada">
            Una sola fuente de 5 voltios alimenta todo. Los tres detalles que
            separan un arreglo de LEDs confiable de uno que parpadea sin
            explicación están dibujados y señalados: la resistencia en la línea de
            datos, el capacitor a la entrada, y la tierra común en estrella.
          </p>

          <div className="plano">
            <svg
              viewBox="0 0 900 660"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="Diagrama de cableado: fuente única, distribución con inyección, selectores, pulso infrarrojo global y tierra en estrella"
            >
              <defs>
                <marker id="pta" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M0,0 L8,4 L0,8 z" fill="var(--linea)" />
                </marker>
              </defs>

              <g>
                <rect x="640" y="16" width="244" height="88" rx="3" fill="none" stroke="var(--cemento)" strokeWidth="1" />
                <text className="rot-cota" x="654" y="34">
                  CALIBRE DE CABLE
                </text>
                <line x1="654" y1="48" x2="684" y2="48" stroke="var(--clave)" strokeWidth="3.4" />
                <text className="rot-cota" x="692" y="52">
                  14 AWG · 15 A
                </text>
                <line x1="654" y1="68" x2="684" y2="68" stroke="var(--luz)" strokeWidth="2.2" />
                <text className="rot-cota" x="692" y="72">
                  18 AWG · inyección
                </text>
                <line x1="654" y1="88" x2="684" y2="88" stroke="var(--fibra)" strokeWidth="1.3" />
                <text className="rot-cota" x="692" y="92">
                  22 AWG · datos y señal
                </text>
              </g>

              <rect x="20" y="30" width="104" height="42" rx="3" fill="none" stroke="var(--linea)" strokeWidth="1.3" />
              <text className="rot-fuerte" x="34" y="48">
                127 V CA
              </text>
              <text className="rot-cota" x="34" y="64">
                entrada
              </text>
              <line x1="124" y1="51" x2="164" y2="51" stroke="var(--linea)" strokeWidth="1.4" markerEnd="url(#pta)" />
              <rect x="164" y="30" width="92" height="42" rx="3" fill="none" stroke="var(--linea)" strokeWidth="1.3" />
              <text className="rot-fuerte" x="176" y="48">
                Interr.
              </text>
              <text className="rot-cota" x="176" y="64">
                + fusible 3 A
              </text>
              <line x1="256" y1="51" x2="296" y2="51" stroke="var(--linea)" strokeWidth="1.4" markerEnd="url(#pta)" />
              <rect x="296" y="20" width="170" height="62" rx="3" fill="none" stroke="var(--clave)" strokeWidth="1.5" />
              <text className="rot-fuerte" x="312" y="42">
                Fuente 5 V / 15 A
              </text>
              <text className="rot-cota" x="312" y="60">
                única
              </text>
              <path d="M381,82 L381,104 L120,104 L120,124" fill="none" stroke="var(--clave)" strokeWidth="3.4" />
              <path d="M381,82 L381,104 L700,104 L700,124" fill="none" stroke="var(--clave)" strokeWidth="3.4" />

              <text className="rot-cota" x="20" y="140">
                RIEL DE LOS CABEZALES · LED DE COLOR
              </text>
              <rect x="20" y="148" width="480" height="30" rx="2" fill="var(--cemento)" opacity=".55" />
              <text className="rot" x="34" y="168">
                Barra 5 V con fusible 5 A por rama
              </text>
              <g fill="var(--clave)">
                <rect x="118" y="144" width="5" height="38" />
                <rect x="228" y="144" width="5" height="38" />
                <rect x="338" y="144" width="5" height="38" />
                <rect x="448" y="144" width="5" height="38" />
              </g>

              <line x1="120" y1="182" x2="120" y2="208" stroke="var(--luz)" strokeWidth="2.2" />
              <g stroke="var(--tinta-2)" strokeWidth="1.6">
                <line x1="106" y1="208" x2="134" y2="208" />
                <line x1="106" y1="214" x2="134" y2="214" />
              </g>
              <text className="rot-cota" x="142" y="214">
                1000 µF
              </text>

              <rect x="20" y="244" width="150" height="56" rx="3" fill="none" stroke="var(--tinta)" strokeWidth="1.5" />
              <text className="rot-fuerte" x="34" y="266">
                ESP32-S3
              </text>
              <text className="rot-cota" x="34" y="284">
                datos · lectura
              </text>
              <line x1="170" y1="264" x2="206" y2="264" stroke="var(--fibra)" strokeWidth="1.3" markerEnd="url(#pta)" />
              <rect x="206" y="244" width="126" height="56" rx="3" fill="none" stroke="var(--linea)" strokeWidth="1.3" />
              <text className="rot-fuerte" x="218" y="266">
                74AHCT125
              </text>
              <text className="rot-cota" x="218" y="284">
                3.3 → 5 V
              </text>
              <line x1="332" y1="264" x2="364" y2="264" stroke="var(--fibra)" strokeWidth="1.3" />
              <path
                d="M364,258 L372,270 L380,258 L388,270 L396,258 L404,264"
                fill="none"
                stroke="var(--fibra)"
                strokeWidth="1.3"
              />
              <text className="rot-cota" x="362" y="250">
                470 Ω
              </text>
              <line x1="404" y1="264" x2="440" y2="264" stroke="var(--fibra)" strokeWidth="1.3" markerEnd="url(#pta)" />

              <rect x="20" y="336" width="600" height="56" rx="3" fill="var(--fondo)" stroke="var(--luz)" strokeWidth="1.3" />
              <text className="rot-cota" x="34" y="350">
                CADENA DE 240 LED SERPENTEANDO POR LOS CABEZALES
              </text>
              <g fill="var(--luz)">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                  <rect
                    key={i}
                    className="corre"
                    style={{ animationDelay: `${(i * 0.15).toFixed(2)}s` }}
                    x={40 + i * 50}
                    y={364}
                    width={13}
                    height={13}
                    rx={2}
                  />
                ))}
              </g>
              <g stroke="var(--luz)" strokeWidth="2.2" fill="none">
                <path d="M120,182 L120,224 L46,224 L46,336" />
                <path d="M230,182 L230,308 L196,308 L196,336" />
                <path d="M340,182 L340,308 L346,308 L346,336" />
                <path d="M450,182 L450,308 L496,308 L496,336" />
              </g>
              <text className="rot-cota" x="20" y="406">
                Alimentación inyectada cada ~60 LED. Sin esto, los últimos LED
                pierden brillo y viran a rojo.
              </text>

              <text className="rot-cota" x="640" y="140">
                PULSO INFRARROJO
              </text>
              <rect x="640" y="148" width="240" height="30" rx="2" fill="var(--cemento)" opacity=".55" />
              <text className="rot" x="652" y="168">
                Barra 5 V pulsada
              </text>
              <line x1="760" y1="178" x2="760" y2="204" stroke="var(--clave)" strokeWidth="3.4" />
              <g stroke="var(--tinta-2)" strokeWidth="1.6">
                <line x1="746" y1="204" x2="774" y2="204" />
                <line x1="746" y1="210" x2="774" y2="210" />
              </g>
              <text className="rot-cota" x="782" y="210">
                4700 µF
              </text>
              <text className="rot-cota" x="640" y="244">
                80 CADENAS DE 3 EMISORES · 240 EN TOTAL
              </text>
              <rect x="640" y="254" width="240" height="96" rx="3" fill="none" stroke="var(--ir)" strokeWidth="1.3" />
              <g fill="var(--ir)">
                <circle cx="664" cy="280" r="4" />
                <circle cx="684" cy="280" r="4" />
                <circle cx="704" cy="280" r="4" />
                <circle cx="664" cy="308" r="4" />
                <circle cx="684" cy="308" r="4" />
                <circle cx="704" cy="308" r="4" />
              </g>
              <g stroke="var(--ir)" strokeWidth="1.1">
                <line x1="668" y1="280" x2="680" y2="280" />
                <line x1="688" y1="280" x2="700" y2="280" />
                <line x1="668" y1="308" x2="680" y2="308" />
                <line x1="688" y1="308" x2="700" y2="308" />
              </g>
              <text className="rot-cota" x="726" y="284">
                Ω
              </text>
              <text className="rot-cota" x="726" y="312">
                Ω
              </text>
              <text className="rot-cota" x="654" y="338">
                … × 80 · uno dentro de cada embudo
              </text>
              <line x1="760" y1="350" x2="760" y2="376" stroke="var(--ir)" strokeWidth="2.2" markerEnd="url(#pta)" />
              <rect x="682" y="376" width="156" height="46" rx="3" fill="none" stroke="var(--linea)" strokeWidth="1.3" />
              <text className="rot-fuerte" x="696" y="396">
                MOSFET
              </text>
              <text className="rot-cota" x="696" y="412">
                ~5 A pulsados
              </text>
              <path
                className="flujo"
                d="M682,399 L662,399 L662,427 L12,427 L12,272 L19,272"
                fill="none"
                stroke="var(--fibra)"
                strokeWidth="1.3"
                markerEnd="url(#pta)"
              />
              <text className="rot-cota" x="380" y="419">
                disparo del ESP32, al ritmo de la lectura
              </text>

              <text className="rot-cota" x="20" y="452">
                SELECTORES · 240 SEÑALES A 1 ENTRADA
              </text>
              <rect x="20" y="462" width="380" height="70" rx="3" fill="none" stroke="var(--ir)" strokeWidth="1.3" />
              <text className="rot" x="36" y="488">
                15 selectores de 16 canales → 1 selector raíz
              </text>
              <text className="rot-cota" x="36" y="510">
                8 pines del ESP32 bastan para leer los 240 detectores
              </text>
              <line x1="400" y1="497" x2="440" y2="497" stroke="var(--ir)" strokeWidth="1.3" />
              <path
                className="flujo"
                d="M440,497 L440,438 L16,438 L16,286 L19,286"
                fill="none"
                stroke="var(--ir)"
                strokeWidth="1.3"
                markerEnd="url(#pta)"
              />
              <text className="rot-cota" x="452" y="501">
                entrada
              </text>

              <line x1="20" y1="576" x2="880" y2="576" stroke="var(--tinta-2)" strokeWidth="2.6" />
              <g stroke="var(--tinta-2)" strokeWidth="1.6">
                <line x1="440" y1="576" x2="440" y2="592" />
                <line x1="422" y1="592" x2="458" y2="592" />
                <line x1="428" y1="599" x2="452" y2="599" />
                <line x1="434" y1="606" x2="446" y2="606" />
              </g>
              <text className="rot-cota" x="20" y="566">
                TIERRA COMÚN · en estrella desde la fuente
              </text>
              <g stroke="var(--tinta-2)" strokeWidth="1.3" opacity=".7">
                <line x1="90" y1="414" x2="90" y2="556" />
                <line x1="90" y1="570" x2="90" y2="576" />
                <line x1="266" y1="300" x2="266" y2="332" />
                <line x1="266" y1="414" x2="266" y2="440" />
                <line x1="266" y1="456" x2="266" y2="556" />
                <line x1="266" y1="570" x2="266" y2="576" />
                <line x1="210" y1="532" x2="210" y2="556" />
                <line x1="210" y1="570" x2="210" y2="576" />
                <line x1="760" y1="422" x2="760" y2="576" />
                <line x1="381" y1="82" x2="381" y2="104" />
              </g>
              <text className="rot-cota" x="20" y="632">
                La resistencia de 470 Ω, el capacitor de 1000 µF y la tierra en
                estrella son los tres detalles que evitan los parpadeos misteriosos.
              </text>
            </svg>
          </div>

          <ul className="claves">
            <li>
              <b>1</b>Una fuente de 5 V / 15 A para todo, con fusible general en la
              entrada y fusible por rama en la distribución.
            </li>
            <li>
              <b>2</b>La cadena de LEDs mide casi 10 metros. Se le inyecta
              alimentación en cuatro puntos para que el brillo y el color sean
              parejos de punta a punta.
            </li>
            <li>
              <b>3</b>Los 240 emisores infrarrojos se prenden y apagan todos a la
              vez con un solo interruptor electrónico. Como cada embudo es un
              recinto cerrado, cada detector solo ve su propio haz.
            </li>
            <li>
              <b>4</b>Los selectores conectan los 240 detectores, de uno en uno y
              muy rápido, a una sola entrada del microcontrolador. Ocho pines leen
              toda la mesa.
            </li>
            <li>
              <b>5</b>El parpadeo del infrarrojo va sincronizado con la lectura: se
              mide cada canal con emisores prendidos y apagados, y la resta elimina
              la luz del cuarto.
            </li>
          </ul>
        </div>
      </section>

      {/* ═══ L—09 · el cabezal por dentro ══════════════════════ */}
      <section className="lamina">
        <div className="envoltura">
          <div className="cabecera">
            <span className="folio sensor">L—09</span>
            <h2>El cabezal por dentro</h2>
          </div>
          <p className="entrada">
            Aquí vive toda la electrónica fina del proyecto, repetida 240 veces. A
            la izquierda, el cabezal físico: el embudo con sus tres componentes
            viendo el ferrule. A la derecha, su circuito: cómo el LED recibe datos,
            cómo el emisor se pulsa, y cómo la luz que regresa se convierte en un
            voltaje que el cerebro puede leer.
          </p>

          <div className="plano">
            <svg
              viewBox="0 0 900 560"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="El cabezal: corte físico del embudo con sus componentes, y el circuito eléctrico de un cabezal con su fototransistor, carga, emisor y LED en cadena"
            >
              <defs>
                <marker id="ptaCab" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M0,0 L8,4 L0,8 z" fill="var(--linea)" />
                </marker>
              </defs>

              {/* mitad izquierda · el cabezal físico */}
              <text className="rot-fuerte" x="30" y="30">
                El cabezal físico
              </text>

              <g stroke="var(--fibra)" strokeWidth="2.4" strokeLinecap="round">
                <line x1="178" y1="40" x2="192" y2="86" />
                <line x1="196" y1="40" x2="200" y2="86" />
                <line x1="214" y1="40" x2="208" y2="86" />
                <line x1="232" y1="40" x2="216" y2="86" />
              </g>
              <rect x="184" y="86" width="40" height="22" rx="3" fill="var(--cemento-claro)" />
              <text className="rot-cota" x="238" y="102">
                ferrule · 4 fibras
              </text>

              <path d="M150,108 L258,108 L232,252 L176,252 Z" fill="none" stroke="var(--luz)" strokeWidth="1.6" />
              <path d="M156,114 L252,114 L227,246 L181,246 Z" fill="var(--luz)" opacity=".05" />
              <text className="rot-cota" x="270" y="150">
                interior reflejante
              </text>
              <line className="lin-eje" x1="266" y1="146" x2="244" y2="140" />

              <line className="flujo" x1="204" y1="238" x2="204" y2="118" stroke="var(--luz)" strokeWidth="1.6" />
              <line className="flujo" x1="188" y1="234" x2="196" y2="118" stroke="var(--ir)" strokeWidth="1.2" />
              <line
                className="flujo"
                x1="212"
                y1="118"
                x2="220"
                y2="230"
                stroke="var(--ir)"
                strokeWidth="1.2"
                strokeDasharray="3 4"
              />

              <rect x="196" y="238" width="16" height="10" rx="1.5" fill="var(--luz)" />
              <circle cx="186" cy="243" r="4.5" fill="var(--ir)" />
              <circle cx="222" cy="243" r="4.5" fill="none" stroke="var(--ir)" strokeWidth="1.6" />
              <rect x="215" y="232" width="14" height="4" rx="1" fill="var(--ir)" opacity=".45" />
              <rect x="120" y="252" width="170" height="14" rx="2" fill="var(--cemento-claro)" />
              <text className="rot-cota" x="120" y="286">
                placa del cabezal · 40 × 20 mm aprox.
              </text>

              <line className="lin-cota" x1="330" y1="118" x2="330" y2="238" />
              <line className="lin-cota" x1="324" y1="118" x2="336" y2="118" />
              <line className="lin-cota" x1="324" y1="238" x2="336" y2="238" />
              <text className="rot-cota" x="340" y="182">
                ~6 mm
              </text>

              <g>
                <circle className="clave-anillo" cx="46" cy="120" r="11" />
                <text className="clave-svg" x="42" y="124">
                  1
                </text>
                <line className="lin-eje" x1="57" y1="120" x2="150" y2="120" />
                <circle className="clave-anillo" cx="46" cy="243" r="11" />
                <text className="clave-svg" x="42" y="247">
                  2
                </text>
                <line className="lin-eje" x1="57" y1="243" x2="178" y2="243" />
              </g>
              <text className="rot-cota" x="30" y="330">
                LED al centro · emisor a un lado · detector al otro,
              </text>
              <text className="rot-cota" x="30" y="348">
                con su filtro pasa-IR encima. El embudo aísla del vecino.
              </text>

              {/* mitad derecha · el circuito */}
              <text className="rot-fuerte" x="470" y="30">
                El circuito de un cabezal
              </text>

              <line x1="470" y1="56" x2="870" y2="56" stroke="var(--clave)" strokeWidth="2.6" />
              <text className="rot-cota" x="470" y="48">
                5 V
              </text>

              <rect x="486" y="86" width="120" height="54" rx="3" fill="none" stroke="var(--luz)" strokeWidth="1.4" />
              <text className="rot-fuerte" x="500" y="108">
                SK6812
              </text>
              <text className="rot-cota" x="500" y="126">
                LED de color
              </text>
              <line x1="546" y1="56" x2="546" y2="86" stroke="var(--clave)" strokeWidth="1.6" />
              <line
                className="flujo"
                x1="444"
                y1="104"
                x2="486"
                y2="104"
                stroke="var(--fibra)"
                strokeWidth="1.3"
                markerEnd="url(#ptaCab)"
              />
              <text className="rot-cota" x="440" y="96">
                DIN
              </text>
              <line
                className="flujo"
                x1="606"
                y1="124"
                x2="640"
                y2="124"
                stroke="var(--fibra)"
                strokeWidth="1.3"
                markerEnd="url(#ptaCab)"
              />
              <text className="rot-cota" x="600" y="146">
                DOUT
              </text>
              <g stroke="var(--tinta-2)" strokeWidth="1.5">
                <line x1="566" y1="140" x2="566" y2="156" />
                <line x1="559" y1="156" x2="573" y2="156" />
                <line x1="559" y1="161" x2="573" y2="161" />
                <line x1="566" y1="161" x2="566" y2="176" />
              </g>
              <text className="rot-cota" x="486" y="196">
                100 nF en sus pines
              </text>

              <circle cx="700" cy="92" r="6" fill="var(--ir)" />
              <line x1="700" y1="56" x2="700" y2="86" stroke="var(--clave)" strokeWidth="1.6" />
              <text className="rot-cota" x="648" y="122">
                emisor 940 nm
              </text>
              <text className="rot-cota" x="648" y="138">
                cadena de 3 · 9 Ω
              </text>
              <line
                className="flujo"
                x1="700"
                y1="98"
                x2="700"
                y2="168"
                stroke="var(--ir)"
                strokeWidth="1.4"
                markerEnd="url(#ptaCab)"
              />
              <rect x="656" y="168" width="88" height="30" rx="3" fill="none" stroke="var(--linea)" strokeWidth="1.2" />
              <text className="rot-cota" x="668" y="187">
                al MOSFET
              </text>

              <circle cx="812" cy="110" r="15" fill="none" stroke="var(--ir)" strokeWidth="1.6" />
              <line x1="812" y1="56" x2="812" y2="95" stroke="var(--clave)" strokeWidth="1.6" />
              <text className="rot-cota" x="744" y="78">
                luz que regresa
              </text>
              <g stroke="var(--ir)" strokeWidth="1.2">
                <line x1="786" y1="98" x2="799" y2="105" />
                <path d="M799,105 L793,104" />
                <path d="M799,105 L797,99" />
                <line x1="786" y1="114" x2="799" y2="121" />
                <path d="M799,121 L793,120" />
                <path d="M799,121 L797,115" />
              </g>
              <line x1="812" y1="125" x2="812" y2="158" stroke="var(--tinta-2)" strokeWidth="1.4" />
              <circle cx="812" cy="158" r="3" fill="var(--tinta-2)" />
              <path
                d="M812,166 L806,172 L818,180 L806,188 L818,196 L806,204 L818,212 L812,218 L812,236"
                fill="none"
                stroke="var(--tinta-2)"
                strokeWidth="1.4"
              />
              <text className="rot-cota" x="828" y="196">
                47 kΩ
              </text>
              <path
                className="flujo"
                d="M812,158 L770,158 L770,252 L470,252"
                fill="none"
                stroke="var(--ir)"
                strokeWidth="1.3"
              />
              <text className="rot-cota" x="470" y="244">
                nodo de señal → al selector → al ADC
              </text>

              <line x1="470" y1="286" x2="870" y2="286" stroke="var(--tinta-2)" strokeWidth="2.2" />
              <g stroke="var(--tinta-2)" strokeWidth="1.5">
                <line x1="670" y1="286" x2="670" y2="298" />
                <line x1="656" y1="298" x2="684" y2="298" />
                <line x1="661" y1="304" x2="679" y2="304" />
                <line x1="666" y1="310" x2="674" y2="310" />
              </g>
              <line x1="546" y1="176" x2="546" y2="286" stroke="var(--tinta-2)" strokeWidth="1.2" opacity=".6" />
              <line x1="812" y1="236" x2="812" y2="286" stroke="var(--tinta-2)" strokeWidth="1.2" opacity=".6" />

              <text className="rot-cota" x="470" y="336">
                Más luz de regreso → más corriente en el fototransistor →
              </text>
              <text className="rot-cota" x="470" y="354">
                más voltaje en el nodo de señal. Eso es todo el sensor.
              </text>

              {/* escalas de la lectura */}
              <text className="rot-fuerte" x="30" y="404">
                Las escalas, para dimensionar
              </text>
              <g className="rot-cota">
                <text x="30" y="432">
                  · ADC del ESP32-S3: 12 bits → cuentas de 0 a 4095 sobre 0 a ~3.1 V
                </text>
                <text x="30" y="456">
                  · Tiempo por canal: 120 µs = fijar selector 20 + leer con emisor 50
                  + leer sin emisor 50
                </text>
                <text x="30" y="480">
                  · Constante RC del nodo: 47 kΩ × ~60 pF del bus ≈ 3 µs — asienta
                  sobrado dentro de los 20 µs
                </text>
                <text x="30" y="504">
                  · Pulso del emisor: 100 mA durante 50 µs por lectura → menos de 1 mA
                  promedio por cabezal
                </text>
                <text x="30" y="528">
                  · La línea base (el reflejo propio del 4 %) da cientos de cuentas:
                  sirve de patrón de ganancia por canal
                </text>
              </g>
            </svg>
          </div>

          <ul className="claves">
            <li>
              <b>1</b>El embudo tiene tres puertos: el LED al centro para el color,
              y a los lados el emisor y el detector, ligeramente inclinados hacia el
              ferrule. La geometría exacta se decide imprimiendo variantes y
              midiendo cuál acopla más.
            </li>
            <li>
              <b>2</b>El fototransistor trabaja de conversor luz-a-voltaje con una
              resistencia de carga. Su valor es el único componente “a medir” del
              circuito: más grande da más señal pero más lentitud y más ruido
              captado; 47 kΩ es el punto de partida y la placa de prueba dicta el
              final.
            </li>
            <li>
              <b>3</b>Cada SK6812 lleva su capacitor de 100 nF pegado a los pines.
              Es un centavo de componente que evita reinicios fantasma cuando 240
              LEDs conmutan a la vez.
            </li>
            <li>
              <b>4</b>La señal de datos no se degrada con la distancia: cada LED la
              regenera completa antes de pasarla al siguiente. Por eso una cadena de
              10 m funciona igual que una de 10 cm.
            </li>
            <li>
              <b>5</b>El filtro pasa-IR es una lámina recortada sobre el detector, no
              un componente óptico caro. Bloquea el color del propio LED y la luz de
              la sala; deja pasar los 940 nm.
            </li>
            <li>
              <b>6</b>Los 240 nodos de señal viajan cortos: cada módulo de 300 × 300
              lleva su selector hoja al centro, y solo 15 cables de salida cruzan la
              mesa hacia el selector raíz.
            </li>
          </ul>
        </div>
      </section>

      {/* ═══ L—10 · el software ════════════════════════════════ */}
      <section className="lamina">
        <div className="envoltura">
          <div className="cabecera">
            <span className="folio sensor">L—10</span>
            <h2>El software</h2>
          </div>
          <p className="entrada">
            El firmware es un ciclo que se repite 35 veces por segundo, repartido
            entre los dos núcleos del ESP32-S3: uno mide, el otro dibuja. No hay
            sistema operativo, ni red, ni configuración: el programa completo cabe
            en unas mil líneas y arranca en un segundo.
          </p>

          <div className="plano">
            <svg
              viewBox="0 0 900 380"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="Línea de tiempo del firmware: el núcleo 0 escanea los 240 canales mientras el núcleo 1 calcula y dibuja el cuadro anterior"
            >
              <text className="rot-fuerte" x="30" y="30">
                Un cuadro de la mesa · ~28.8 ms
              </text>

              <text className="rot-cota" x="30" y="72">
                NÚCLEO 0 · MEDIR
              </text>
              <rect x="30" y="82" width="700" height="40" rx="3" fill="var(--ir)" opacity=".22" />
              <rect x="30" y="82" width="700" height="40" rx="3" fill="none" stroke="var(--ir)" strokeWidth="1.3" />
              <text className="rot" x="48" y="107">
                Barrido de los 240 canales · 120 µs cada uno
              </text>

              <path
                d="M380,122 L300,170 M420,122 L760,170"
                stroke="var(--cota)"
                strokeWidth="1"
                strokeDasharray="4 5"
                fill="none"
              />
              <text className="rot-cota" x="300" y="164">
                un canal, con lupa · 120 µs
              </text>
              <rect x="300" y="170" width="76" height="30" rx="2" fill="var(--cemento)" />
              <text className="rot-cota" x="308" y="189">
                selector 20
              </text>
              <rect className="corre" x="376" y="170" width="192" height="30" rx="2" fill="var(--ir)" opacity=".5" />
              <text className="rot-cota" x="386" y="189">
                emisor ON · lee · 50 µs
              </text>
              <rect x="568" y="170" width="192" height="30" rx="2" fill="var(--cemento)" />
              <text className="rot-cota" x="578" y="189">
                emisor OFF · lee · 50 µs
              </text>
              <text className="rot-fuerte" x="772" y="189">
                → resta
              </text>

              <text className="rot-cota" x="30" y="248">
                NÚCLEO 1 · DIBUJAR (con el cuadro anterior)
              </text>
              <rect x="30" y="258" width="90" height="40" rx="3" fill="var(--cemento)" />
              <text className="rot-cota" x="42" y="276">
                señal y
              </text>
              <text className="rot-cota" x="42" y="292">
                centroide
              </text>
              <rect x="120" y="258" width="140" height="40" rx="3" fill="var(--luz)" opacity=".3" />
              <rect x="120" y="258" width="140" height="40" rx="3" fill="none" stroke="var(--luz)" strokeWidth="1.2" />
              <text className="rot-cota" x="132" y="283">
                render del campo
              </text>
              <rect x="260" y="258" width="160" height="40" rx="3" fill="var(--luz)" opacity=".15" />
              <rect
                x="260"
                y="258"
                width="160"
                height="40"
                rx="3"
                fill="none"
                stroke="var(--luz)"
                strokeWidth="1.2"
                strokeDasharray="5 4"
              />
              <text className="rot-cota" x="272" y="283">
                salida LED · 7.2 ms
              </text>
              <rect x="430" y="258" width="300" height="40" rx="3" fill="none" stroke="var(--cemento-claro)" strokeWidth="1.2" />
              <text className="rot-cota" x="444" y="283">
                libre: respiración de reposo, línea base
              </text>

              <line className="flujo" x1="730" y1="102" x2="800" y2="102" stroke="var(--ir)" strokeWidth="1.4" />
              <path
                className="flujo"
                d="M800,102 L800,228 L190,228 L190,258"
                fill="none"
                stroke="var(--ir)"
                strokeWidth="1.4"
              />
              <text className="rot-cota" x="560" y="220">
                el cuadro medido pasa al otro núcleo
              </text>

              <text className="rot-cota" x="30" y="346">
                Los dos carriles corren a la vez: mientras el núcleo 0 mide el cuadro
                n, el núcleo 1 dibuja el n−1.
              </text>
              <text className="rot-cota" x="30" y="366">
                Latencia total del vaso a la luz: dos cuadros como máximo, 30 a 60 ms.
                Instantáneo al ojo.
              </text>
            </svg>
          </div>

          <ul className="claves">
            <li>
              <b>1</b>
              <span>
                <strong>Resta por canal.</strong> El emisor parpadea dentro de los
                120 µs de cada canal: lectura con luz, lectura sin luz, y la
                diferencia es la señal. La luz de la sala y el propio LED de color
                quedan fuera por aritmética.
              </span>
            </li>
            <li>
              <b>2</b>
              <span>
                <strong>Línea base viva pero prudente.</strong> El reflejo propio de
                cada punta se guarda por canal y se actualiza con un promedio
                lentísimo — y solo cuando el canal está tranquilo. Donde hay objeto,
                la base se congela: por eso un plato olvidado media hora sigue
                detectado en vez de “desaparecer”.
              </span>
            </li>
            <li>
              <b>3</b>
              <span>
                <strong>Autocalibración de ganancia.</strong> Ese mismo reflejo
                propio sirve de patrón: si un canal devuelve la mitad de base que sus
                vecinos, su óptica acopla la mitad, y su señal se multiplica por dos.
                Las 240 diferencias de fabricación se emparejan solas.
              </span>
            </li>
            <li>
              <b>4</b>
              <span>
                <strong>Detección con histéresis.</strong> Un canal se declara
                ocupado cuando su señal supera 6 veces el ruido, y libre cuando baja
                de 3 — con dos cuadros de persistencia. Sin eso, un vaso al borde del
                umbral parpadearía.
              </span>
            </li>
            <li>
              <b>5</b>
              <span>
                <strong>Centroide entre vecinos.</strong> La posición fina sale de
                comparar la fuerza de señal del cabezal ocupado contra sus 8 vecinos:
                de celdas de 40 mm se pasa a una posición continua, y el halo se mueve
                sin escalones.
              </span>
            </li>
            <li>
              <b>6</b>
              <span>
                <strong>Render como campo de luz.</strong> Cada objeto aporta un
                núcleo intenso y un halo suave; los campos se mezclan tomando el
                máximo, se aplica corrección de gamma para que el degradado se vea
                lineal al ojo, y un limitador global escala todo si la suma pidiera
                más corriente que la fuente.
              </span>
            </li>
            <li>
              <b>7</b>
              <span>
                <strong>Estados de la mesa.</strong> Reposo (respiración tenue),
                activo (objetos con núcleo y halo), noche (se apaga sola por reloj y
                despierta al primer contacto) y calibración (enciende LED por LED
                para fotografiar el mapa con el teléfono).
              </span>
            </li>
          </ul>

          <div className="envuelve" style={{ marginTop: 30 }}>
            <table className="datos">
              <thead>
                <tr>
                  <th>Presupuesto de tiempo</th>
                  <th>Cuánto</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Barrido de 240 canales</td>
                  <td>28.8 ms</td>
                  <td>Núcleo 0 · marca el ritmo de 35 cuadros por segundo</td>
                </tr>
                <tr>
                  <td>Señal, línea base y centroide</td>
                  <td>&lt; 1 ms</td>
                  <td>Aritmética simple sobre 240 números</td>
                </tr>
                <tr>
                  <td>Render del campo de luz</td>
                  <td>&lt; 1 ms</td>
                  <td>240 LED, unas cuantas gaussianas</td>
                </tr>
                <tr>
                  <td>Salida a los LED</td>
                  <td>7.2 ms</td>
                  <td>En paralelo al barrido siguiente, por el otro núcleo</td>
                </tr>
                <tr>
                  <td>Latencia del vaso a la luz</td>
                  <td>30 – 60 ms</td>
                  <td>Dos cuadros en el peor caso</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══ L—11 · precios ════════════════════════════════════ */}
      <section className="lamina">
        <div className="envoltura">
          <div className="cabecera">
            <span className="folio">L—11</span>
            <h2>Precios</h2>
          </div>
          <p className="entrada">
            Pesos mexicanos, agosto de 2026, tipo de cambio 17 por dólar. Cada
            partida lleva su nivel de confianza:{" "}
            <strong style={{ color: "var(--luz)" }}>V</strong> precio verificado
            con proveedor, <strong style={{ color: "var(--luz)" }}>R</strong> rango
            de mercado observado, <strong style={{ color: "var(--luz)" }}>E</strong>{" "}
            estimación. Conviene verificar cada una antes de comprar.
          </p>

          <div className="envuelve">
            <table className="datos">
              <thead>
                <tr>
                  <th>Partida</th>
                  <th>MXN</th>
                  <th>Conf.</th>
                </tr>
              </thead>
              <tbody>
                {PRECIOS.map((grupo) => (
                  <Fragment key={grupo.titulo}>
                    <tr>
                      <td colSpan={3} className="subtitulo-tabla">
                        {grupo.titulo}
                      </td>
                    </tr>
                    {grupo.filas.map(([partida, mxn, conf]) => (
                      <tr key={partida}>
                        <td>{partida}</td>
                        <td>{mxn}</td>
                        <td>{conf}</td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="envuelve" style={{ marginTop: 34 }}>
            <table className="datos">
              <thead>
                <tr>
                  <th>Escenario</th>
                  <th>MXN</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Mesa completa 1200 × 600</td>
                  <td>19,280 – 47,190</td>
                  <td>Todo incluido, sin contar tu tiempo</td>
                </tr>
                <tr>
                  <td>Si ya tienes o rentas pulidora</td>
                  <td>16,280 – 39,690</td>
                  <td>Es la herramienta individual más cara</td>
                </tr>
                <tr>
                  <td>Solo electrónica y fibra</td>
                  <td>5,980 – 14,490</td>
                  <td>Cerebro, iluminación, detección y fibra</td>
                </tr>
                <tr>
                  <td>Placas de prueba gemelas</td>
                  <td>2,110 – 3,750</td>
                  <td>El único gasto a autorizar hoy</td>
                </tr>
              </tbody>
            </table>
          </div>

          <ul className="claves" style={{ marginTop: 30 }}>
            <li>
              <b>1</b>Las tres partidas que abren el rango: la pulidora, la base
              —que puede ser desde una estructura sencilla hasta herrería a
              medida— y las placas de los cabezales, que armadas a mano son baratas
              y tediosas, y mandadas a ensamblar son 240 placas idénticas
              cotizables en maquila.
            </li>
            <li>
              <b>2</b>El presupuesto no incluye el tiempo de trabajo: entre 8 y 13
              horas solo de enhebrado, más el colado, el pulido y el armado.
            </li>
            <li>
              <b>3</b>Todo lo que no sean las placas de prueba se compra después de
              que ellas den luz verde.
            </li>
          </ul>
        </div>
      </section>

      {/* ═══ Notas de obra ═════════════════════════════════════ */}
      <section className="notas">
        <div className="envoltura">
          <h2>Notas de obra</h2>

          <div className="nota critica">
            <h3>El riesgo principal: que se vea</h3>
            <p>
              Los materiales de este tipo —piedra con fibra óptica— lucen en
              penumbra y compiten mal contra una habitación muy iluminada. A favor:
              la mesa es de interior, donde la luz se controla; el terrazo de tono
              medio u oscuro sube mucho el contraste; y la resina epóxica puede
              hacerse parcialmente translúcida, lo que convierte cada punto de 1 mm
              en un halo suave más visible. Aun así, la visibilidad con la luz de la
              sala encendida se valida en la placa antes de enhebrar 874 fibras.
            </p>
          </div>

          <div className="nota critica">
            <h3>El componente que hay que inventar: el embudo</h3>
            <p>
              Todo lo demás del proyecto se compra hecho. El embudo del cabezal —la
              pieza impresa con interior reflejante que junta LED, emisor y detector
              frente a las fibras— no existe comercialmente, y de su geometría
              depende cuánta luz llega a la mesa. La buena noticia: imprimir y medir
              tres o cuatro variantes cuesta casi nada, y eso es parte de la prueba
              del cabezal.
            </p>
          </div>

          <div className="nota critica">
            <h3>Cuidado con el calor de la resina</h3>
            <p>
              La resina epóxica se calienta sola al curar. En este espesor una
              formulación de colado lento se porta bien, pero una resina rápida de
              recubrimiento puede pasar de 100 °C: deforma las fibras, amarillea y
              agrieta. Usar resina de colado profundo, y verter en dos tandas si la
              primera calienta de más.
            </p>
          </div>

          <div className="nota critica">
            <h3>El pulido, siempre en húmedo</h3>
            <p>
              La fibra es de PMMA, un plástico que se reblandece a 105 °C. Lijar en
              seco lo supera por pura fricción y deja las puntas embarradas y
              lechosas. Todo el pulido con agua, empezando en grano 100 o 200 —nunca
              más grueso, porque desportilla el borde de la fibra— y subiendo hasta
              3000.
            </p>
          </div>

          <div className="nota">
            <h3>Nada de barnices</h3>
            <p>
              El acabado final es el propio pulido fino más abrillantador. Cualquier
              barniz, cera o “capa protectora” forma película sobre las puntas de
              fibra y las deja opacas y turbias. En un interior no protege de nada
              real y arruina justo lo que hace especial a la mesa.
            </p>
          </div>

          <div className="nota diseno">
            <h3>Por qué el infrarrojo va aparte</h3>
            <p>
              Podría pensarse en usar la propia luz de color como sonda de
              detección, pero los LED direccionables no permiten apagones limpios de
              microsegundos: su protocolo sostiene el brillo hasta el siguiente
              refresco. En cambio, el infrarrojo y el color son longitudes de onda
              distintas y conviven en la misma fibra sin estorbarse. Por eso cada
              cabezal lleva su emisor infrarrojo propio, que parpadea al ritmo de la
              lectura mientras el LED de color hace lo suyo.
            </p>
          </div>

          <div className="nota diseno">
            <h3>El reflejo propio de la fibra</h3>
            <p>
              La punta de cada fibra devuelve alrededor del 4 % de la luz que se le
              inyecta, aunque no haya nada encima: es un reflejo del propio
              material. Como está presente siempre, la resta encendido/apagado no lo
              elimina. Se maneja guardando la lectura de la mesa vacía por canal y
              descontándola; esa referencia se actualiza despacio con el tiempo, con
              la regla de nunca absorber en ella un objeto que sigue puesto — un
              plato olvidado media hora debe seguir detectado.
            </p>
          </div>

          <div className="nota diseno">
            <h3>El modo de reposo es la mesa</h3>
            <p>
              En una casa, la mesa pasará la mayor parte del tiempo sin que nadie la
              toque, en una habitación con poca luz — el ambiente exacto donde este
              efecto luce. Eso convierte el estado de reposo en la cara principal
              del objeto: un brillo tenue que respira despacio y despierta en núcleo
              y halo donde algo se posa. Es puro software y merece diseñarse con el
              mismo cuidado que la respuesta al vaso: qué color, qué ritmo, y cómo
              se apaga sola de madrugada.
            </p>
          </div>

          <div className="nota">
            <h3>Detección: precisión y límites</h3>
            <p>
              La celda de detección es el haz de 4 fibras: un vaso normal activa de
              uno a cuatro cabezales, y el software afina la posición comparando la
              fuerza de la señal entre vecinos. Los límites honestos: el vaso de
              vidrio transparente vacío es el caso más difícil (casi no refleja; con
              líquido dentro mejora), y una mano flotando a 10 cm probablemente no
              se detecta — este sistema siente lo que se posa o se acerca mucho, no
              los gestos en el aire.
            </p>
          </div>

          <div className="nota">
            <h3>Silencio y calor</h3>
            <p>
              La electrónica disipa unos 25 W dentro de un recinto que debe ser
              hermético a la luz. Se ventila con un laberinto —un pasillo con dos o
              tres vueltas de 90° pintado de negro mate— y un ventilador de 120 mm
              girando despacio, inaudible en una sala. El aire pasa, la luz no.
            </p>
          </div>

          <div className="nota">
            <h3>Resina y sol</h3>
            <p>
              El epóxico envejece con luz ultravioleta, pero en interior el riesgo
              es marginal: con resina que incluya inhibidor UV, la pieza vive
              décadas. La única precaución real es no colocarla pegada a un ventanal
              con sol directo de tarde.
            </p>
          </div>

          <div className="nota">
            <h3>La placa gemela de cemento</h3>
            <p>
              Junto a la placa epóxica se cuela una idéntica en cemento blanco con
              grano de mármol, para decidir el material con las manos y no con
              argumentos: burbujas, aspecto del punto encendido y apagado, horas de
              pulido, y qué acabado gusta más. El cemento exige cuidados propios:
              pintar antes las fibras con lechada de cemento puro, colar sobre una
              lámina de silicón perforada para poder desmoldar sin arrancarlas, y
              saber que su alcalinidad ataca lentamente al PMMA, por lo que las
              fibras se sellan con epóxico en el paso.
            </p>
          </div>

          <div className="nota">
            <h3>Saber qué cabezal es qué punto</h3>
            <p>
              Cada cabezal ilumina y detecta el mismo haz, así que existe un solo
              mapa cabezal-posición. Montando los cabezales en su retícula y
              llevando cada haz al más cercano, el mapa sale por construcción con
              etiquetado disciplinado. Y hay un respaldo a prueba de errores:
              encender un LED a la vez y fotografiar la superficie con el teléfono;
              media hora con un script y el mapa queda verificado.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ Vocabulario ═══════════════════════════════════════ */}
      <section className="notas" style={{ paddingTop: 0 }}>
        <div className="envoltura">
          <h2>Vocabulario</h2>
          <ul className="glosario">
            <li>
              <b>Terrazo</b> — piedra artificial: un ligante (cemento o resina) con
              chips de mármol o vidrio, colado y pulido hasta dejar los chips a la
              vista.
            </li>
            <li>
              <b>Fibra óptica PMMA</b> — hilo de plástico acrílico de 1 mm que
              conduce la luz de una punta a la otra, como una manguera de luz.
            </li>
            <li>
              <b>Haz</b> — grupo de 4 fibras que comparten un mismo cabezal.
            </li>
            <li>
              <b>Cabezal</b> — la pieza bajo cada haz: embudo reflejante + LED de
              color + emisor infrarrojo + detector.
            </li>
            <li>
              <b>LED direccionable</b> — LED al que se le puede ordenar su color y
              brillo individualmente, por dato, aunque estén cientos en cadena.
            </li>
            <li>
              <b>Infrarrojo 940 nm</b> — luz invisible al ojo humano que usan también
              los controles remotos; aquí es la sonda de detección.
            </li>
            <li>
              <b>SNR</b> — relación señal a ruido: cuántas veces más grande es la
              señal que se busca que el ruido de fondo. A 10, sólida; abajo de 3, no
              confiable.
            </li>
            <li>
              <b>Multiplexor o selector</b> — chip que conecta muchas señales, de una
              en una, a una sola entrada. Como la perilla para cambiar de canal de
              una tele vieja, pero girando miles de veces por segundo.
            </li>
            <li>
              <b>Núcleo y halo</b> — la respuesta de la mesa: luz intensa justo bajo
              el objeto (núcleo) que se difumina suave hacia afuera (halo).
            </li>
            <li>
              <b>CNC</b> — corte o barrenado controlado por computadora, con
              precisión de décimas de milímetro. Así se hace el tablero perforado.
            </li>
            <li>
              <b>ADC</b> — convertidor de analógico a digital: la entrada del
              microcontrolador que traduce un voltaje a un número. El del ESP32-S3
              entrega cuentas de 0 a 4095.
            </li>
            <li>
              <b>Histéresis</b> — usar dos umbrales en vez de uno: se declara
              “ocupado” arriba del alto y “libre” abajo del bajo. Evita que algo justo
              en el límite parpadee entre los dos estados.
            </li>
          </ul>
        </div>
      </section>

      {/* ═══ Por dónde empezar ═════════════════════════════════ */}
      <section className="notas" style={{ paddingTop: 0 }}>
        <div className="envoltura">
          <h2>Por dónde empezar</h2>
          <ul className="claves">
            <li>
              <b>1</b>Cotizar por teléfono en Torreón: el corte CNC de un tablero
              chico de 300 × 300 con sus barrenos, el grano de mármol, y la renta de
              pulidora húmeda. Son los tres precios que este documento no puede
              verificar en línea.
            </li>
            <li>
              <b>2</b>Imprimir tres o cuatro geometrías de embudo y armar el cabezal
              de prueba: LED de color, emisor infrarrojo, fototransistor. Medir cuál
              embudo acopla más luz antes de colar nada.
            </li>
            <li>
              <b>3</b>Colar las placas gemelas —una epóxica, una de cemento, misma
              plantilla— y pulirlas en húmedo. Aquí se aprende el proceso completo en
              miniatura.
            </li>
            <li>
              <b>4</b>Medir contra la tabla de la lámina L—07: SNR con plato y con
              mano, visibilidad con 500 lux, y comparación entre materiales. Con esos
              números se decide si la mesa completa se construye, se ajusta o se
              replantea.
            </li>
          </ul>
        </div>
      </section>

      <footer className="pie">
        <div className="envoltura">
          <span>Anteproyecto · 12 láminas</span>
          <span>Todo sujeto a las placas de prueba</span>
        </div>
      </footer>
    </div>
  );
}

/** L—11 · presupuesto por familia. El tercer campo es el nivel de
 *  confianza del precio: V verificado, R rango de mercado, E estimación. */
const PRECIOS: { titulo: string; filas: [string, string, string][] }[] = [
  {
    titulo: "CEREBRO · 210 – 460",
    filas: [
      ["Microcontrolador ESP32-S3", "190 – 400", "V"],
      ["Convertidor de nivel 74AHCT125", "20 – 60", "R"],
    ],
  },
  {
    titulo: "ILUMINACIÓN · 1,690 – 3,330",
    filas: [
      ["240 LED de color direccionables (SK6812)", "500 – 1,200", "V"],
      ["Fuente conmutada 5 V / 15 A", "400 – 750", "V"],
      ["Capacitores y resistencia de datos", "90 – 170", "E"],
      ["Cable calibre 14 y 18", "350 – 610", "R"],
      ["Fusibles y portafusibles", "150 – 250", "E"],
      ["Borneras y conectores", "200 – 350", "E"],
    ],
  },
  {
    titulo: "DETECCIÓN · 2,280 – 7,700",
    filas: [
      ["240 fototransistores (detectores)", "480 – 1,440", "R"],
      ["240 emisores infrarrojos de 940 nm", "250 – 1,000", "R"],
      ["Lámina de filtro que solo pasa infrarrojo", "150 – 400", "E"],
      ["16 selectores CD74HC4067", "250 – 560", "R"],
      ["Componentes menores del árbol de lectura", "150 – 300", "E"],
      ["Placas de circuito de los 240 cabezales", "800 – 3,500", "E"],
      ["240 embudos impresos en 3D", "200 – 500", "E"],
    ],
  },
  {
    titulo: "FIBRA · 1,800 – 3,000",
    filas: [["Fibra óptica PMMA de 1 mm, ~230 m", "1,800 – 3,000", "R"]],
  },
  {
    titulo: "LOSA Y MOLDE · 4,800 – 9,700",
    filas: [
      ["Resina epóxica de colado con protección UV, ~8 kg", "2,200 – 3,800", "V"],
      ["Chip de mármol fino, 3 a 6 mm", "500 – 900", "R"],
      ["Chip de mármol grande, 12 a 15 mm", "400 – 800", "R"],
      ["Pigmento y base", "200 – 500", "E"],
      ["Tablero perforado en CNC, 874 barrenos", "1,200 – 3,000", "E"],
      ["Cimbra perimetral y desmoldante", "300 – 700", "E"],
    ],
  },
  {
    titulo: "ACABADO · 4,300 – 10,800",
    filas: [
      ["Pulidora húmeda", "3,000 – 7,500", "R"],
      ["Discos de diamante, grano 100 a 3000", "1,000 – 2,500", "R"],
      ["Pulido fino y abrillantado", "300 – 800", "E"],
    ],
  },
  {
    titulo: "CIERRE · 4,200 – 12,200",
    filas: [
      ["Ventilador silencioso y laberinto de ventilación", "400 – 700", "R"],
      ["Base y estructura", "3,000 – 10,000", "E"],
      ["Consumibles y herrajes", "800 – 1,500", "E"],
    ],
  },
];
