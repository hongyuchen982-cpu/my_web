import { getAllPosts } from "@/lib/posts";
import BlogGrid from "@/components/blog-grid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "All blog posts — technical articles & notes.",
};

export default async function PostsPage() {
  const posts = await getAllPosts();
  return <BlogGrid posts={posts} />;
}
