import type { Metadata } from "next";
import NowView from "../../components/NowPage";
import { LocaleProvider } from "../../lib/i18n/locale-context";

const SITE = "https://cobos.io";
const LOCALE = "es" as const;

export const metadata: Metadata = {
  title: "Ernesto Cobos — /now",
  description:
    "Snapshot de los frentes activos: SaaS en producción, prep de certificaciones y open source. Se actualiza cada mes.",
  alternates: {
    canonical: `${SITE}/now`,
    languages: {
      "es-MX": `${SITE}/now`,
      "en-US": `${SITE}/en/now`,
      "x-default": `${SITE}/now`,
    },
  },
};

export default function NowEs() {
  return (
    <LocaleProvider locale={LOCALE}>
      <NowView />
    </LocaleProvider>
  );
}
