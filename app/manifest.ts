import type { MetadataRoute } from "next";

/**
 * PWA manifest. Lets users "Add to Home Screen" on iOS / Android with
 * the cobos:: branding instead of a generic Next.js placeholder.
 * Dynamic icon URLs point to app/icon.tsx and app/apple-icon.tsx so the
 * icons can evolve alongside the design tokens without managing a static
 * binary fork.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "cobos.io · Ernesto Cobos",
    short_name: "cobos.io",
    description:
      "Cloud Architect · Platform Engineer · DevSecOps. Notas técnicas + portfolio.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0F",
    theme_color: "#0A0A0F",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
