import type { Metadata } from "next";
import { CvView } from "../../components/CvPage";
import { LocaleProvider } from "../../lib/i18n/locale-context";

const SITE = "https://cobos.io";
const LOCALE = "en" as const;

export const metadata: Metadata = {
  title: "CV · Ernesto Cobos",
  description: "cv.pdf — one page, no fluff",
  alternates: {
    canonical: `${SITE}/en/cv`,
    languages: {
      "es-MX": `${SITE}/cv`,
      "en-US": `${SITE}/en/cv`,
      "x-default": `${SITE}/cv`,
    },
  },
};

export default function CvEn() {
  return (
    <LocaleProvider locale={LOCALE}>
      <CvView />
    </LocaleProvider>
  );
}
