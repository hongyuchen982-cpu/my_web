import { getProjects } from "@/lib/projects";
import ProjectCard from "@/components/project-card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description: "精选项目展示 — personal & open source projects.",
};

export default function ProjectsPage() {
  const projects = getProjects();

  return (
    <div className="space-y-8">
      <h1 className="section-title text-base font-semibold">
        精选项目
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
