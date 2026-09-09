"use client";

import type { Post } from "@/lib/posts";
import type { Project } from "@/lib/projects";
import HeroSection from "@/components/hero-section";
import ProjectCard from "@/components/project-card";
import ArticleListItem from "@/components/article-list-item";
import { useLang } from "@/components/language-provider";
import { t } from "@/lib/i18n";
import Link from "next/link";

export default function HomeContent({
  posts,
  postCount,
  projects,
}: {
  posts: Post[];
  postCount: number;
  projects: Project[];
}) {
  const { lang } = useLang();

  const allTechs = new Set(projects.flatMap((p) => p.techs));
  const totalProjectCount = projects.length;

  return (
    <div className="space-y-28">
      <HeroSection
        projectCount={totalProjectCount}
        postCount={postCount}
        techCount={allTechs.size}
      />

      {/* Featured Projects — manual + GitHub */}
      <section>
        <p className="mb-3 text-xs font-mono tracking-[0.18em] text-[var(--color-accent)]">{"// FEATURED"}</p>
        <h2 className="mb-8 text-3xl font-bold tracking-tight text-[var(--color-fg)] md:text-4xl">
          {t("featuredProjects", lang)}
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
        {projects.length === 0 && (
          <p className="text-xs text-[var(--color-fg-muted)] font-mono text-center py-8">
            {t("noPosts", lang)}
          </p>
        )}
      </section>

      {/* Latest Articles */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--color-fg)]">
            {t("latestArticles", lang)}
          </h2>
          <Link
            href="/posts"
            className="text-sm font-mono text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors"
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
