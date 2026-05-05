import { PROFILE } from "../../../components/portfolio-data";
import { getPost } from "../../../lib/posts";

const SITE = "https://cobos.io";

/**
 * Per-post raw markdown endpoint. Useful for LLMs, curl users, and content
 * pipelines that want the article without HTML chrome. Returns 404 for
 * unknown slugs.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) {
    return new Response("Not found", { status: 404 });
  }

  const front = [
    `---`,
    `title: ${post.title}`,
    `url: ${SITE}/blog/${post.slug}`,
    `date: ${post.date}`,
    `display_date: ${post.d}`,
    `category: ${post.category}`,
    `read_time: ${post.r}`,
    `author: ${PROFILE.name}`,
    `---`,
    "",
  ].join("\n");

  return new Response(`${front}# ${post.title}\n\n${post.body}\n`, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
