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
  projects,
}: {
  posts: Post[];
  projects: Project[];
}) {
  const { lang } = useLang();
  const allTechs = new Set(projects.flatMap((p) => p.techs));

  return (
    <div className="space-y-16">
      <HeroSection
        projectCount={projects.length}
        postCount={posts.length}
        techCount={allTechs.size}
      />

      {/* Featured Projects */}
      <section>
        <h2 className="section-title text-base font-semibold mb-6">
          {t("featuredProjects", lang)}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
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
