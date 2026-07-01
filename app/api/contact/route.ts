import { PROFILE } from "../../components/portfolio-data";

// Node runtime: this talks to an external email API. Default function timeout
// (300s) is far more than enough; the handler is sub-second in practice.
export const runtime = "nodejs";

/**
 * Contact form backend with graceful degradation.
 *
 * Without RESEND_API_KEY the route returns `{ ok:false, reason:"not-configured" }`
 * (HTTP 200) and the client falls back to the existing `mailto:` flow — so the
 * form keeps working before any provider is wired. Once the key (and a verified
 * sender) are set, the same submit sends a real email server-side.
 *
 * Spam defenses: a hidden honeypot field (`botcheck`) and a best-effort
 * in-memory per-IP rate limit. For hard limits, front this with a Vercel WAF
 * rate rule or a KV-backed counter — Fluid Compute may reuse instances, so the
 * map below is a soft guard, not a quota.
 */

const HITS = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const MAX_ENTRIES = 10_000;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  // Bound the map so a flood of (possibly spoofed) IPs can't grow it without
  // limit: sweep expired entries first, then hard-cap by evicting oldest keys.
  if (HITS.size > MAX_ENTRIES) {
    for (const [k, v] of HITS) {
      if (now > v.resetAt) HITS.delete(k);
    }
    let excess = HITS.size - MAX_ENTRIES;
    if (excess > 0) {
      for (const k of HITS.keys()) {
        HITS.delete(k);
        if (--excess <= 0) break;
      }
    }
  }
  const entry = HITS.get(ip);
  if (!entry || now > entry.resetAt) {
    HITS.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: Request) {
  let data: Record<string, unknown>;
  try {
    data = await req.json();
  } catch {
    return Response.json({ ok: false, reason: "bad-request" }, { status: 400 });
  }

  // Honeypot: real users never fill `botcheck`. Accept silently (don't tip off
  // the bot) but never send anything.
  if (typeof data.botcheck === "string" && data.botcheck.trim() !== "") {
    return Response.json({ ok: true, delivered: true });
  }

  const from = String(data.from ?? "").trim();
  const email = String(data.email ?? "").trim();
  const subject = String(data.subject ?? "").trim();
  const body = String(data.body ?? "").trim();

  if (
    !from ||
    from.length > 200 ||
    !body ||
    body.length > 5000 ||
    subject.length > 200
  ) {
    return Response.json({ ok: false, reason: "invalid" }, { status: 422 });
  }
  if (email && !EMAIL_RE.test(email)) {
    return Response.json(
      { ok: false, reason: "invalid-email" },
      { status: 422 }
    );
  }

  // Prefer x-real-ip (set by Vercel to the true client IP) over the leftmost
  // x-forwarded-for hop, which the caller can spoof.
  const ip =
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  if (rateLimited(ip)) {
    return Response.json({ ok: false, reason: "rate-limited" }, { status: 429 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Backend not provisioned — signal the client to use the mailto: fallback.
    return Response.json(
      { ok: false, reason: "not-configured" },
      { status: 200 }
    );
  }

  const sender = process.env.CONTACT_FROM || "cobos.io <contact@cobos.io>";
  const subjectLine = subject || "Contact from cobos.io";
  const text = `${body}\n\n— ${from}${email ? ` <${email}>` : ""}`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: sender,
        to: [PROFILE.email],
        subject: `[cobos.io] ${subjectLine}`,
        text,
        ...(email ? { reply_to: email } : {}),
      }),
    });
    if (!res.ok) {
      return Response.json({ ok: false, reason: "send-failed" }, { status: 502 });
    }
    return Response.json({ ok: true, delivered: true });
  } catch {
    return Response.json({ ok: false, reason: "send-failed" }, { status: 502 });
  }
}
