import Portfolio from "./components/Portfolio";
import { getAllPosts } from "./lib/posts";

export default function Home() {
  const posts = getAllPosts();
  return <Portfolio posts={posts} />;
}
