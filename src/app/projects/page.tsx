import { getProjects } from "@/lib/projects";
import ProjectCard from "@/components/project-card";
import type { Metadata } from "next";
import { learningProjects } from "@/lib/learning-projects";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projects",
  description: "精选项目展示 — personal & open source projects.",
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-10">
      <div className="border-b border-[var(--color-border)] pb-9">
        <p className="mb-3 text-xs font-mono tracking-[0.18em] text-[var(--color-accent)]">{"// SELECTED WORK"}</p>
        <h1 className="text-4xl font-bold tracking-tight text-[var(--color-fg)] md:text-5xl">精选项目</h1>
        <p className="mt-4 text-base text-[var(--color-fg-muted)]">
          经过筛选的原创与个人项目，共 {projects.length} 个
        </p>
      </div>

      {projects.length === 0 ? (
        <p className="text-xs text-[var(--color-fg-muted)] font-mono text-center py-16">
          暂无项目
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
      <section className="space-y-5 border-t border-[var(--color-border)] pt-10" aria-labelledby="learning-projects">
        <h2 id="learning-projects" className="text-2xl font-semibold">开源学习参考</h2>
        <p className="text-sm text-[var(--color-fg-muted)]">五个与 Python 后端、RAG 和工作流方向相关的上游项目。由各自作者维护，非本站原创，也不代表已完成复现。使用代码前请阅读原仓库许可证。</p>
        <div className="grid gap-5 md:grid-cols-2">
          {learningProjects.map((project) => <article key={project.repo} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <p className="text-xs text-[var(--color-accent)]">学习参考 · 原作者 {project.owner}</p>
            <h3 className="mt-2 text-lg font-semibold"><a href={`https://github.com/${project.repo}`} target="_blank" rel="noopener noreferrer">{project.name} ↗</a></h3>
            <p className="mt-2 text-xs text-[var(--color-fg-muted)]">{project.techs}</p>
            <p className="mt-3 text-sm leading-6">{project.description}</p>
            <p className="mt-3 text-sm leading-6 text-[var(--color-fg-muted)]">建议练习：{project.exercise}</p>
          </article>)}
        </div>
      </section>
    </div>
  );
}
