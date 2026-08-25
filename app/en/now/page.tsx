import type { Metadata } from "next";
import NowView from "../../components/NowPage";
import { LocaleProvider } from "../../lib/i18n/locale-context";

const SITE = "https://cobos.io";
const LOCALE = "en" as const;

export const metadata: Metadata = {
  title: "Ernesto Cobos — /now",
  description:
    "Snapshot of current fronts: SaaS in production, certification prep, and open source. Updated monthly.",
  alternates: {
    canonical: `${SITE}/en/now`,
    languages: {
      "es-MX": `${SITE}/now`,
      "en-US": `${SITE}/en/now`,
      "x-default": `${SITE}/now`,
    },
  },
};

export default function NowEn() {
  return (
    <LocaleProvider locale={LOCALE}>
      <NowView />
    </LocaleProvider>
  );
}
