import { getProjects } from "@/lib/projects";
import { fetchGitHubRepos, repoToProjectView } from "@/lib/github";
import ProjectCard from "@/components/project-card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description: "精选项目展示 — personal & open source projects.",
};

export default async function ProjectsPage() {
  const [dbProjects, ghRepos] = await Promise.all([
    getProjects(),
    fetchGitHubRepos(),
  ]);

  const githubProjects = ghRepos.map(repoToProjectView);

  // Deduplicate: skip GitHub projects already synced into DB (matched by github URL)
  const dbGithubUrls = new Set(dbProjects.map((p) => p.github).filter(Boolean));
  const freshGithubProjects = githubProjects.filter(
    (p) => !dbGithubUrls.has(p.github)
  );
  const allProjects = [...dbProjects, ...freshGithubProjects];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="section-title text-base font-semibold">精选项目</h1>
        {githubProjects.length > 0 && (
          <p className="text-xs text-[var(--color-fg-muted)] font-mono mt-2">
            本地 + GitHub 公开仓库 共 {allProjects.length} 个项目
          </p>
        )}
      </div>

      {allProjects.length === 0 ? (
        <p className="text-xs text-[var(--color-fg-muted)] font-mono text-center py-16">
          暂无项目
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
