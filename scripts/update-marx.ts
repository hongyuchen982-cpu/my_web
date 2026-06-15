import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { readFileSync } from "fs";

const adapter = new PrismaLibSql({ url: "file:dev.db" });
const prisma = new PrismaClient({ adapter });

async function update() {
  const articles = JSON.parse(readFileSync("scripts/marx-article-v2.json", "utf-8"));

  for (const article of articles) {
    const existing = await prisma.post.findUnique({ where: { slug: article.slug } });
    if (!existing) {
      console.log(`NOT FOUND: ${article.slug}`);
      continue;
    }
    await prisma.post.update({
      where: { slug: article.slug },
      data: {
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        category: article.category,
      },
    });
    console.log(`UPDATED: ${article.title}`);
    console.log(`  Content length: ${article.content.length} chars`);
  }
}

update()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
