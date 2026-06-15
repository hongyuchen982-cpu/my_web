import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { readFileSync } from "fs";

const adapter = new PrismaLibSql({ url: "file:dev.db" });
const prisma = new PrismaClient({ adapter });

async function seed() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("No user found.");
    process.exit(1);
  }

  const articles = JSON.parse(readFileSync("scripts/marx-article.json", "utf-8"));

  for (const article of articles) {
    const existing = await prisma.post.findUnique({ where: { slug: article.slug } });
    if (existing) {
      console.log(`SKIP: "${article.title}" (already exists)`);
      continue;
    }
    await prisma.post.create({
      data: { ...article, authorId: user.id },
    });
    console.log(`OK: [${article.category}] ${article.title}`);
  }
}

seed()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
