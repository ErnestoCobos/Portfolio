import type { Metadata } from "next";
import { getDictionary } from "../../lib/i18n";
import { CurriculumVitae } from "../../components/CurriculumVitae";

const cv = getDictionary("en").cv;

export const metadata: Metadata = {
  title: cv.metaTitle,
  description: cv.metaDescription,
  alternates: {
    canonical: "https://cobos.io/en/cv",
    languages: {
      "es-MX": "https://cobos.io/cv",
      "en-US": "https://cobos.io/en/cv",
      "x-default": "https://cobos.io/cv",
    },
  },
  openGraph: {
    type: "profile",
    url: "https://cobos.io/en/cv",
    title: cv.metaTitle,
    description: cv.metaDescription,
  },
};

export default function CvPage() {
  return <CurriculumVitae locale="en" />;
}
