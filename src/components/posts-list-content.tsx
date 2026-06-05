"use client";

import type { Post } from "@/lib/posts";
import ArticleListItem from "@/components/article-list-item";
import { useLang } from "@/components/language-provider";
import { t } from "@/lib/i18n";

export default function PostsListContent({ posts }: { posts: Post[] }) {
  const { lang } = useLang();

  if (posts.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-[var(--color-fg-muted)] font-mono text-sm">
          {t("noPosts", lang)}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[var(--color-fg)] tracking-tight">
        {t("allPosts", lang)}
      </h1>
      <div>
        {posts.map((post) => (
          <ArticleListItem key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
