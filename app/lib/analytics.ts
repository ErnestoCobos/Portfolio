/**
 * Thin wrapper over @vercel/analytics' `track()` for conversion events.
 *
 * WHY a wrapper instead of importing `track()` at call sites:
 *  - Event names live here as a typed const map, so the set of measurable
 *    conversions is greppable and typo-proof (`trackEvent("cta_view_work")`
 *    fails to compile on a misspelled name).
 *  - Dev/SSR safety in one place: the VA script is only injected in prod, so
 *    calling through in dev would spam the console queue; and although
 *    handlers never run during SSR render, the guard makes that invariant
 *    local instead of assumed.
 *  - Analytics must never break the interaction it measures — hence the
 *    swallow-everything catch. A lost event costs a data point; a thrown
 *    handler costs the click itself.
 *
 * Handlers using this MUST NOT preventDefault(): the native navigation
 * (mailto:, target=_blank, hash scroll) stays functional with JS disabled;
 * tracking is strictly additive.
 */

import { track } from "@vercel/analytics";

/** Canonical event names — stable contract with Vercel dashboard filters.
 * snake_case, prefixed by funnel area (cta_ / contact_ / outbound_ / cv_).
 * `cta_book` and `cv_open` are placeholders reserved for B1 (booking CTA)
 * and B4 (CV link); nothing fires them yet. */
export const ANALYTICS_EVENTS = {
  cta_view_work: "cta_view_work",
  /** Reserved for B1 — do not wire until a real booking link exists. */
  cta_book: "cta_book",
  /** Hero secondary CTA (currently scrolls to #contact; B1 may retarget it). */
  cta_contact: "cta_contact",
  contact_email_click: "contact_email_click",
  contact_copy_email: "contact_copy_email",
  contact_blog_click: "contact_blog_click",
  /** Outbound click to a own-SaaS product site. Prop `saas` carries the slug. */
  outbound_saas: "outbound_saas",
  outbound_github: "outbound_github",
  outbound_linkedin: "outbound_linkedin",
  /** Reserved for B4 — CV open/download. */
  cv_open: "cv_open",
} as const;

export type AnalyticsEventName = keyof typeof ANALYTICS_EVENTS;

type AnalyticsProperties = Record<string, string | number | boolean | null>;

export function trackEvent(
  name: AnalyticsEventName,
  properties?: AnalyticsProperties,
): void {
  if (process.env.NODE_ENV !== "production") return;
  try {
    track(ANALYTICS_EVENTS[name], properties);
  } catch {
    // Never let telemetry break the conversion it measures (see header).
  }
}
