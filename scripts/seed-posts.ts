import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { readFileSync } from "fs";

const adapter = new PrismaLibSql({ url: "file:dev.db" });
const prisma = new PrismaClient({ adapter });

interface ArticleInput {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  published: boolean;
  content: string;
}

async function seed() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("No user found in database. Please register first.");
    process.exit(1);
  }

  console.log(`Author: ${user.name} (${user.email})`);

  const articles: ArticleInput[] = JSON.parse(
    readFileSync("scripts/seed-posts.json", "utf-8")
  );

  console.log(`Creating ${articles.length} articles...\n`);

  for (const article of articles) {
    const existing = await prisma.post.findUnique({
      where: { slug: article.slug },
    });

    if (existing) {
      console.log(`  SKIP: "${article.title}" (slug exists)`);
      continue;
    }

    await prisma.post.create({
      data: { ...article, authorId: user.id },
    });

    console.log(`  OK: [${article.category}] ${article.title}`);
  }

  const categories = await prisma.post.groupBy({
    by: ["category"],
    _count: { id: true },
  });

  console.log(`\nCategories:`);
  for (const c of categories) {
    console.log(`  ${c.category}: ${c._count.id} articles`);
  }

  console.log(`\nDone! Visit /admin/posts to manage your articles.`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
