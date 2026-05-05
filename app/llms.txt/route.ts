import { buildLlmsTxt } from "../lib/feeds";

export function GET() {
  return new Response(buildLlmsTxt("es"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
