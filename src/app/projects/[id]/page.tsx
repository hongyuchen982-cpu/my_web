import { notFound } from "next/navigation";
import ProjectDetail from "@/components/project-detail";
import { fetchGitHubReadme } from "@/lib/github";
import { getProjectById } from "@/lib/projects";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) return { title: "项目不存在" };
  return { title: project.title, description: project.description };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();

  const readme = await fetchGitHubReadme(project.github);
  return <ProjectDetail project={project} readme={readme} />;
}
