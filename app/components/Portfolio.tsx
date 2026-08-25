"use client";

import dynamic from "next/dynamic";
import type { Post } from "./portfolio-data";
import { useIsMobile } from "./hooks";
import { AtmosphereCanvas } from "./visuals/AtmosphereCanvas";
import { KineticMarquee } from "./cinematic/KineticMarquee";
import { Hero } from "./chrome/Hero";
import { Nav } from "./chrome/Nav";
import { IntroVeil, ProofStrip } from "./chrome/ProofStrip";
import { About } from "./sections/About";
import { Stack } from "./sections/Stack";
import { Infra } from "./sections/Infra";
import { Work } from "./sections/Work";
import { Experience } from "./sections/Experience";
import { Certifications } from "./sections/Certifications";
import { Testimonials } from "./sections/Testimonials";
import { Trends } from "./sections/Trends";
import { Blog } from "./sections/Blog";
import { Approach } from "./sections/Approach";
import { Contact } from "./sections/Contact";

// Dev-only live terminal. In production the const folds to null so the module
// is never imported and gets tree-shaken from the bundle.
const LiveTerminal =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("./LiveTerminal"), { ssr: false })
    : null;

/* ─── Root ───────────────────────────────────────────────── */
export default function Portfolio({ posts }: { posts: Post[] }) {
  const mobile = useIsMobile();
  return (
    <div className="cobos-art" id="main-scene">
      <AtmosphereCanvas />
      <span id="top" aria-hidden style={{ position: "absolute" }} />
      <IntroVeil />
      <Hero mobile={mobile} />
      {/* Nav BEFORE ProofStrip: the dock's natural (pre-stick) position must
       * clear the floating LocaleSwitcher's bottom-right zone. With the
       * strip after the hero, the dock landed at ~85vh on 800–950px-tall
       * viewports and its z-60 bar intercepted clicks meant for the z-30
       * switcher. Hero → dock → strip reads as a deliberate divider and
       * every viewport height stays collision-free at scroll 0. */}
      <Nav mobile={mobile} />
      <ProofStrip mobile={mobile} />
      <About mobile={mobile} />
      <Stack mobile={mobile} />
      <Infra mobile={mobile} />
      <KineticMarquee mobile={mobile} words={["gitops", "platform", "finops", "zero-trust", "sre"]} />
      <Work mobile={mobile} />
      <Experience mobile={mobile} />
      <Certifications mobile={mobile} />
      <Testimonials mobile={mobile} />
      <Trends mobile={mobile} />
      <KineticMarquee mobile={mobile} words={["aws", "gcp", "azure", "kubernetes", "terraform"]} />
      <Blog mobile={mobile} posts={posts} />
      <KineticMarquee mobile={mobile} words={["ship", "measure", "harden", "repeat"]} />
      <Approach mobile={mobile} />
      <Contact mobile={mobile} />
      <div className="film-grain" aria-hidden />
      {LiveTerminal && <LiveTerminal />}
    </div>
  );
}
