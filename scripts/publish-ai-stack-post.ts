import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@libsql/client";
import matter from "gray-matter";

loadEnvConfig(process.cwd());

async function main() {
  const slug = "python-mysql-celery-transformers-engineering";
  const source = await readFile(resolve("posts", `${slug}.md`), "utf8");
  const { data, content } = matter(source);
  const targets = [
    { name: "local", url: process.env.DATABASE_URL || "file:./dev.db", authToken: undefined },
    ...(process.env.TURSO_DATABASE_URL
      ? [{ name: "Turso", url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN }]
      : []),
  ].filter((target, index, all) => all.findIndex((candidate) => candidate.url === target.url) === index);

  for (const target of targets) {
    const client = createClient({ url: target.url, authToken: target.authToken });
    const existing = await client.execute({ sql: `SELECT id FROM Post WHERE slug = ? LIMIT 1`, args: [slug] });
    const args = [String(data.title), String(data.excerpt || ""), content.trim(), String(data.category || ""), slug];
    if (existing.rows.length) {
      await client.execute({
        sql: `UPDATE Post SET title = ?, excerpt = ?, content = ?, category = ?, published = true, updatedAt = CURRENT_TIMESTAMP WHERE slug = ?`,
        args,
      });
    } else {
      await client.execute({
        sql: `INSERT INTO Post (id, slug, title, excerpt, content, category, published, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        args: [randomUUID(), slug, ...args.slice(0, 4)],
      });
    }
    client.close();
    console.log(`${target.name}: published /posts/${slug}`);
  }

  const { buildPostIndex } = await import("../src/lib/knowledge-index");
  let result;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      result = await buildPostIndex(slug, true);
      break;
    } catch (error) {
      if (attempt === 2) throw error;
      console.warn("local RAG: embedding connection interrupted, retrying once...");
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 1_500));
    }
  }
  if (!result) throw new Error("文章索引没有返回结果");
  console.log(`local RAG: indexed ${result.chunkCount} chunks with ${result.embeddingModel}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
