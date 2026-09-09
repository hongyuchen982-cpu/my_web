import { getAllPosts, getPublishedPostCount } from "@/lib/posts";
import { getProjects } from "@/lib/projects";
import HomeContent from "@/components/home-content";
export const dynamic = "force-dynamic";

export default async function Home() {
  const [posts, postCount, projects] = await Promise.all([
    getAllPosts(5),
    getPublishedPostCount(),
    getProjects(),
  ]);

  return (
    <HomeContent
      posts={posts.slice(0, 5)}
      postCount={postCount}
      projects={projects}
    />
  );
}
