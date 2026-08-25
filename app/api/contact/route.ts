/**
 * POST /api/contact — B3: sends the contact form through Resend's REST
 * API with plain fetch (NO SDK — zero new dependencies, per the spec).
 *
 * Contract with the client form:
 *   - 200 → delivered; form shows "sent".
 *   - 501 { fallback: "mailto" } → RESEND_API_KEY not configured at
 *     deploy time. The form silently falls back to its legacy mailto
 *     hand-off, exactly like before this route existed.
 *   - 502 { error } → key present but Resend rejected/failed; the form
 *     shows an error row with a working mailto fallback.
 *
 * WHY a route handler despite static export: this makes the root route
 * dynamic on Vercel (the rest of the site stays static) — trade-off
 * explicitly accepted in docs/superpowers/specs/2026-08-25-market-readiness-roadmap.md.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
/** Resend's sandbox sender — works before any domain is verified.
 * Swap to a cobos.io sender once the domain is verified in Resend. */
const RESEND_FROM = "onboarding@resend.dev";

type ContactPayload = {
  from?: string;
  email?: string;
  subject?: string;
  body?: string;
};

export async function POST(req: Request): Promise<Response> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return Response.json({ fallback: "mailto" }, { status: 501 });
  }

  let payload: ContactPayload;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const subject = String(payload.subject ?? "").slice(0, 200);
  const body = String(payload.body ?? "").slice(0, 10_000);
  if (!body.trim()) {
    return Response.json({ error: "empty_body" }, { status: 400 });
  }
  // The visitor's address rides inside the text (the form already
  // appends it) — onboarding@resend.dev cannot spoof a verified reply-to.
  const email = String(payload.email ?? "").trim();
  const from = String(payload.from ?? "").trim();
  const text = `${body}${email ? `\n\nreply-to: ${email}` : ""}${
    from ? ` (${from})` : ""
  }`;

  let sent: Response;
  try {
    sent = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: process.env.CONTACT_TO || "hola@cobos.io",
        subject: subject || "Contacto desde cobos.io",
        text,
      }),
    });
  } catch {
    return Response.json({ error: "resend_unreachable" }, { status: 502 });
  }

  if (!sent.ok) {
    return Response.json({ error: "resend_rejected" }, { status: 502 });
  }
  return Response.json({ ok: true }, { status: 200 });
}
