import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { readFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const adapter = new PrismaLibSql({ url: "file:dev.db" });
const prisma = new PrismaClient({ adapter });

const POST_FILES = [
  "agent-memory-beyond-rag.md",
  "ai-agent-rules-practice-notes.md",
  "database-and-ai-production-retrospective.md",
  "how-this-site-was-built.md",
  "pip-proxy-network-troubleshooting.md",
  "python-mysql-celery-transformers-engineering.md",
] as const;

async function seed() {
  const author = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!author) throw new Error("No user found in database. Please register first.");

  for (const file of POST_FILES) {
    const source = readFileSync(path.join(process.cwd(), "posts", file), "utf8");
    const parsed = matter(source);
    const slug = file.replace(/\.md$/, "");
    const data = {
      title: String(parsed.data.title),
      excerpt: String(parsed.data.excerpt),
      category: String(parsed.data.category),
      published: true,
      content: parsed.content.trim(),
      createdAt: new Date(String(parsed.data.date)),
      authorId: author.id,
    };

    await prisma.post.upsert({
      where: { slug },
      update: data,
      create: { slug, ...data },
    });
    console.log(`OK: [${data.category}] ${data.title}`);
  }

  console.log(`Done: ${POST_FILES.length} current personal articles seeded.`);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
