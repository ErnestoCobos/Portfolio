import type { Metadata } from "next";
import { CvView } from "../../components/CvPage";
import { LocaleProvider } from "../../lib/i18n/locale-context";

const SITE = "https://cobos.io";
const LOCALE = "es" as const;

export const metadata: Metadata = {
  title: "CV · Ernesto Cobos",
  description: "cv.pdf — una página, sin humo",
  alternates: {
    canonical: `${SITE}/cv`,
    languages: {
      "es-MX": `${SITE}/cv`,
      "en-US": `${SITE}/en/cv`,
      "x-default": `${SITE}/cv`,
    },
  },
};

export default function CvEs() {
  return (
    <LocaleProvider locale={LOCALE}>
      <CvView />
    </LocaleProvider>
  );
}
