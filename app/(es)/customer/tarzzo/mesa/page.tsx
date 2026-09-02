import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { MesaTerrazo } from "../../../../components/mesa/MesaTerrazo";
import "../../../../components/mesa/mesa-terrazo.css";

/**
 * /customer/tarzzo/mesa — anteproyecto de la mesa de terrazo con fibra óptica.
 *
 * Documento de proyecto, no una sección del portfolio: trae su propia
 * tipografía y su propia paleta. Las tres familias se cargan con
 * `next/font` (no un <link> a Google Fonts) para que Next las
 * autoaloje y las inyecte solo en esta ruta.
 *
 * Solo existe en español —es el idioma en que está escrito el
 * documento—, así que declara `x-default` hacia sí mismo y no anuncia
 * un alterno en inglés que no existe. `LocaleSwitcher` conoce esta ruta
 * y se retira en ella.
 */

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const SITE = "https://cobos.io";

const description =
  "Anteproyecto de una mesa de terrazo atravesada por 874 fibras ópticas que ilumina y detecta por el mismo hilo: óptica, electrónica, firmware, presupuesto y la prueba que decide si se construye.";

export const metadata: Metadata = {
  title: "Mesa de terrazo con fibra óptica que responde al tacto — anteproyecto",
  description,
  alternates: {
    canonical: `${SITE}/customer/tarzzo/mesa`,
    languages: {
      "es-MX": `${SITE}/customer/tarzzo/mesa`,
      "x-default": `${SITE}/customer/tarzzo/mesa`,
    },
  },
  openGraph: {
    type: "article",
    locale: "es_MX",
    url: `${SITE}/customer/tarzzo/mesa`,
    title: "Mesa de terrazo con fibra óptica que responde al tacto",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Mesa de terrazo con fibra óptica que responde al tacto",
    description,
  },
};

// El documento pinta sobre concreto (#21252A), no sobre el casi-negro
// del resto del sitio: la barra del navegador móvil se tiñe igual.
export const viewport: Viewport = {
  themeColor: "#21252A",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

// CreativeWork en vez de Article: es un anteproyecto de diseño de
// producto, no una nota del blog. `about` deja explícitos los temas
// para que un crawler no lo clasifique como contenido de cloud.
const proyectoLd = {
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  "@id": `${SITE}/customer/tarzzo/mesa#proyecto`,
  name: "Mesa de terrazo con fibra óptica que responde al tacto",
  description,
  inLanguage: "es-MX",
  url: `${SITE}/customer/tarzzo/mesa`,
  author: { "@id": `${SITE}/#person` },
  creator: { "@id": `${SITE}/#person` },
  genre: "Anteproyecto de diseño de producto",
  about: [
    "Terrazo",
    "Fibra óptica",
    "Electrónica embebida",
    "ESP32",
    "Diseño de mobiliario",
  ],
};

export default function MesaTerrazoEs() {
  return (
    <div className={`${bricolage.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(proyectoLd) }}
      />
      <MesaTerrazo />
    </div>
  );
}
