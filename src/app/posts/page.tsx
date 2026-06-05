import { getAllPosts } from "@/lib/posts";
import PostsListContent from "@/components/posts-list-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "All blog posts — technical articles & notes.",
};

export default function PostsPage() {
  const posts = getAllPosts();
  return <PostsListContent posts={posts} />;
}
