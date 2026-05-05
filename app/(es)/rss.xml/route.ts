import { buildRss } from "../../lib/feeds";

export function GET() {
  return new Response(buildRss("es"), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
