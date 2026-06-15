"use client";

import type { Post } from "@/lib/posts";
import type { Project } from "@/lib/projects";
import HeroSection from "@/components/hero-section";
import ProjectCard from "@/components/project-card";
import ArticleListItem from "@/components/article-list-item";
import { useLang } from "@/components/language-provider";
import { t } from "@/lib/i18n";
import Link from "next/link";

interface GitHubProjectView {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "active" | "wip" | "maintained" | "archived";
  url?: string;
  github?: string;
  techs: string[];
  sortOrder: number;
}

export default function HomeContent({
  posts,
  projects,
  githubProjects,
}: {
  posts: Post[];
  projects: Project[];
  githubProjects: GitHubProjectView[];
}) {
  const { lang } = useLang();

  // Deduplicate: skip GitHub projects already synced into DB (matched by github URL)
  const dbGithubUrls = new Set(projects.map((p) => p.github).filter(Boolean));
  const freshGithubProjects = githubProjects.filter(
    (p) => !dbGithubUrls.has(p.github)
  );
  const allProjects = [...projects, ...freshGithubProjects];
  const allTechs = new Set(allProjects.flatMap((p) => p.techs));
  const totalProjectCount = allProjects.length;

  return (
    <div className="space-y-16">
      <HeroSection
        projectCount={totalProjectCount}
        postCount={posts.length}
        techCount={allTechs.size}
      />

      {/* Featured Projects — manual + GitHub */}
      <section>
        <h2 className="section-title text-base font-semibold mb-6">
          {t("featuredProjects", lang)}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
        {allProjects.length === 0 && (
          <p className="text-xs text-[var(--color-fg-muted)] font-mono text-center py-8">
            {t("noPosts", lang)}
          </p>
        )}
      </section>

      {/* Latest Articles */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title text-base font-semibold">
            {t("latestArticles", lang)}
          </h2>
          <Link
            href="/posts"
            className="text-xs font-mono text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors"
          >
            {t("viewAll", lang)}
          </Link>
        </div>
        <div>
          {posts.map((post) => (
            <ArticleListItem key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}
