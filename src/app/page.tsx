import { getAllPosts } from "@/lib/posts";
import { getProjects } from "@/lib/projects";
import { fetchGitHubRepos, repoToProjectView } from "@/lib/github";
import HomeContent from "@/components/home-content";

export default async function Home() {
  const [posts, dbProjects, ghRepos] = await Promise.all([
    getAllPosts(),
    getProjects(),
    fetchGitHubRepos(),
  ]);

  const githubProjects = ghRepos.map(repoToProjectView);

  return (
    <HomeContent
      posts={posts.slice(0, 5)}
      projects={dbProjects}
      githubProjects={githubProjects}
    />
  );
}
