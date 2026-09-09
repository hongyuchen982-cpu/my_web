"use client";

import { useMemo, useState } from "react";
import type { Post } from "@/lib/posts";
import PostCard from "@/components/post-card";
import { useLang } from "@/components/language-provider";
import { Search, X } from "lucide-react";

export default function BlogGrid({ posts }: { posts: Post[] }) {
  const { lang } = useLang();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = useMemo(() => {
    const categoryNames = posts
      .map((post) => post.category)
      .filter((category): category is string => Boolean(category));
    return ["All", ...Array.from(new Set(categoryNames))];
  }, [posts]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.toLocaleLowerCase().trim();
    return posts.filter((post) => {
      if (activeCategory !== "All" && post.category !== activeCategory) {
        return false;
      }
      if (!normalizedQuery) return true;
      return `${post.title} ${post.excerpt}`
        .toLocaleLowerCase()
        .includes(normalizedQuery);
    });
  }, [posts, query, activeCategory]);

  const resultText = lang === "zh"
    ? `${filtered.length} 篇文章${activeCategory === "All" ? "" : ` · ${activeCategory}`}`
    : `${filtered.length} ${filtered.length === 1 ? "post" : "posts"}${activeCategory === "All" ? "" : ` · ${activeCategory}`}`;

  return (
    <div className="w-full space-y-10">
      <header className="border-b border-[var(--color-border)] pb-9">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-xs font-mono uppercase tracking-[0.2em] text-[var(--color-accent)]">
              {lang === "zh" ? "我的原创技术文章与学习笔记" : "My original technical writing & notes"}
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-[var(--color-fg)] md:text-5xl">
              {lang === "zh" ? "博客" : "Blog"}
            </h1>
          </div>
          <p className="text-sm font-mono text-[var(--color-fg-muted)]">
            {resultText}
          </p>
        </div>

        <div className="relative mt-8 w-full">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-fg-muted)]" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={lang === "zh" ? "搜索标题或摘要…" : "Search titles or summaries…"}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-3.5 pl-10 pr-10 text-sm font-mono text-[var(--color-fg)] outline-none transition-colors placeholder:text-[var(--color-fg-muted)] focus:border-[var(--color-accent)]/60 focus:ring-2 focus:ring-[var(--color-accent-glow)]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]"
              aria-label={lang === "zh" ? "清空搜索" : "Clear search"}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-wrap gap-2" aria-label={lang === "zh" ? "文章分类" : "Post categories"}>
        {categories.map((category) => {
          const active = activeCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`rounded-full border px-4 py-2 text-xs font-mono transition-colors ${
                active
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white dark:text-black"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg-muted)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
              }`}
            >
              {category === "All" ? (lang === "zh" ? "全部" : "All") : category}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-20 text-center">
          <p className="text-sm font-mono text-[var(--color-fg-muted)]">
            {lang === "zh" ? "没有找到匹配的文章" : "No matching posts found"}
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActiveCategory("All");
            }}
            className="mt-4 text-xs font-mono text-[var(--color-accent)] hover:underline"
          >
            {lang === "zh" ? "清除筛选" : "Clear filters"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filtered.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
