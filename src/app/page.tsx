import { getAllPosts } from "@/lib/posts";
import { getProjects } from "@/lib/projects";
import HomeContent from "@/components/home-content";

export default async function Home() {
  const posts = getAllPosts().slice(0, 5);
  const projects = getProjects();

  return <HomeContent posts={posts} projects={projects} />;
}
