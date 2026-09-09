import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BookOpen, GitBranch, Globe2 } from "lucide-react";
import MDXContent from "@/components/mdx-content";
import type { GitHubReadme } from "@/lib/github";
import type { Project } from "@/lib/projects";

const statusLabels: Record<Project["status"], string> = {
  active: "活跃",
  wip: "开发中",
  maintained: "维护中",
  archived: "已归档",
};

export default function ProjectDetail({ project, readme }: { project: Project; readme: GitHubReadme | null }) {
  const resources = [
    project.github && {
      label: "GitHub 源代码",
      description: "查看完整仓库、提交记录和代码实现",
      href: project.github,
      icon: GitBranch,
    },
    project.url && {
      label: "在线演示",
      description: "打开项目已经部署的公开版本",
      href: project.url,
      icon: Globe2,
    },
    readme && {
      label: "README 原文",
      description: "在 GitHub 中查看项目文档和相关引用",
      href: readme.htmlUrl,
      icon: BookOpen,
    },
  ].filter(Boolean) as Array<{ label: string; description: string; href: string; icon: typeof GitBranch }>;

  return (
    <article className="mx-auto max-w-4xl">
      <Link href="/projects" className="mb-10 inline-flex items-center gap-2 text-sm font-mono text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-accent)]">
        <ArrowLeft className="h-4 w-4" />
        返回项目列表
      </Link>

      <header className="border-b border-[var(--color-border)] pb-10">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-[var(--color-accent-glow)] px-3 py-1 text-xs font-mono text-[var(--color-accent)]">{project.category || "Code"}</span>
          <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-600">{statusLabels[project.status]}</span>
        </div>
        <h1 className="text-4xl font-bold leading-tight tracking-tight text-[var(--color-fg)] md:text-5xl">{project.title}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--color-fg-dim)]">{project.description || "这个项目暂时还没有填写简介。"}</p>
        {project.techs.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {project.techs.map((tech) => (
              <span key={tech} className="border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-mono text-[var(--color-fg-muted)]">{tech}</span>
            ))}
          </div>
        )}
      </header>

      <section className="py-10">
        <p className="mb-2 text-xs font-mono tracking-[0.18em] text-[var(--color-accent)]">{"// PROJECT STORY"}</p>
        <h2 className="mb-6 text-2xl font-bold text-[var(--color-fg)]">项目介绍</h2>
        {readme ? (
          <div className="prose prose-lg prose-neutral max-w-none dark:prose-invert">
            <MDXContent content={readme.content} />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <p className="text-base leading-8 text-[var(--color-fg-dim)]">{project.description}</p>
            <p className="mt-3 text-sm text-[var(--color-fg-muted)]">仓库暂未提供可读取的 README，后续可以在 GitHub 中补充详细设计、核心功能和使用方式。</p>
          </div>
        )}
      </section>

      {resources.length > 0 && (
        <section className="border-t border-[var(--color-border)] py-10">
          <p className="mb-2 text-xs font-mono tracking-[0.18em] text-[var(--color-accent)]">{"// RESOURCES"}</p>
          <h2 className="mb-6 text-2xl font-bold text-[var(--color-fg)]">项目入口与引用</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {resources.map((resource) => {
              const Icon = resource.icon;
              return (
                <a key={resource.label} href={resource.href} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-4 border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-accent)]/60 hover:bg-[var(--color-accent-glow)]">
                  <span className="rounded-lg bg-[var(--color-accent-glow)] p-2.5 text-[var(--color-accent)]"><Icon className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 font-semibold text-[var(--color-fg)] group-hover:text-[var(--color-accent)]">{resource.label}<ArrowUpRight className="h-4 w-4" /></span>
                    <span className="mt-1 block text-sm leading-6 text-[var(--color-fg-muted)]">{resource.description}</span>
                  </span>
                </a>
              );
            })}
          </div>
        </section>
      )}
    </article>
  );
}
