import { loadEnvConfig } from "@next/env";

const cloud = process.argv.includes("--cloud");
if (cloud) Reflect.set(process.env, "NODE_ENV", "production");
loadEnvConfig(process.cwd(), !cloud);

const RETIRED_POST_SLUGS = [
  "article-ownership-and-sync-retrospective",
  "marx-perspective-triple-colonization",
  "nextjs-app-router-deep-dive",
  "prisma-sqlite-quickstart",
  "jwt-auth-from-scratch",
  "cookie-security-best-practices",
  "tailwind-css-theme-system",
  "css-variables-dark-light-mode",
  "react-markdown-blog-engine",
  "markdown-writing-tips",
  "typescript-fullstack-type-safety",
] as const;

async function main() {
  const { prisma } = await import("../src/lib/db");
  try {
    const existing = await prisma.post.findMany({
      where: { slug: { in: [...RETIRED_POST_SLUGS] } },
      select: { slug: true, title: true },
      orderBy: { createdAt: "asc" },
    });

    await prisma.post.deleteMany({
      where: { slug: { in: [...RETIRED_POST_SLUGS] } },
    });

    console.log(`${cloud ? "云端" : "本地"}已删除 ${existing.length} 篇文章：`);
    for (const post of existing) console.log(`- ${post.title} (${post.slug})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "删除早期文章失败");
  process.exitCode = 1;
});
