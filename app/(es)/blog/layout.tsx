import type { Metadata } from "next";

const description =
  "Notas de campo sobre GitOps regulado, migraciones a EKS sin downtime, FinOps real y plataformas internas. Apuntes técnicos sobre construir plataforma en producción.";

export const metadata: Metadata = {
  title: "Notas · cobos::/blog",
  description,
  alternates: {
    canonical: "https://cobos.io/blog",
    languages: {
      "es-MX": "https://cobos.io/blog",
      "en-US": "https://cobos.io/en/blog",
      "x-default": "https://cobos.io/blog",
    },
  },
  openGraph: {
    title: "cobos::/blog · notas de campo",
    description,
    type: "website",
    url: "https://cobos.io/blog",
    siteName: "cobos.io",
    locale: "es_MX",
  },
  twitter: {
    card: "summary_large_image",
    title: "cobos::/blog · notas de campo",
    description,
    creator: "@ErnestoCobos",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
