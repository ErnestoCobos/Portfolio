import Portfolio from "./components/Portfolio";
import { LocaleProvider } from "./lib/i18n/locale-context";
import { getAllPosts } from "./lib/posts";

const LOCALE = "es" as const;

export default function Home() {
  const posts = getAllPosts(LOCALE);
  return (
    <LocaleProvider locale={LOCALE}>
      <Portfolio posts={posts} />
    </LocaleProvider>
  );
}
