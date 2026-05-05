import { getAllPosts } from "../lib/posts";
import BlogClient from "./blog-client";

export default function BlogIndex() {
  const posts = getAllPosts();
  return <BlogClient posts={posts} />;
}
