import { LocaleProvider } from "../../lib/i18n/locale-context";
import { getAllPosts } from "../../lib/posts";
import BlogClient from "../../components/blog/BlogClient";
import BlogSubscribe from "../../components/blog/BlogSubscribe";

const LOCALE = "es" as const;

export default function BlogIndex() {
  const posts = getAllPosts(LOCALE);
  return (
    <LocaleProvider locale={LOCALE}>
      <BlogClient posts={posts} />
      <BlogSubscribe />
    </LocaleProvider>
  );
}
