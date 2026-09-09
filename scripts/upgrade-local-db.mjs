import { createClient } from "@libsql/client";
import { readFile } from "node:fs/promises";
const url = process.env.DATABASE_URL || "file:./dev.db";
if (!url.startsWith("file:")) throw new Error("Only local SQLite is supported");
const db = createClient({ url });
try {
  // Additive only: historical local databases may already contain manually applied migrations.
  for (const name of ["20260908010000_rate_buckets", "20260908020000_knowledge_jobs"]) {
    const sql = (await readFile(new URL(`../prisma/migrations/${name}/migration.sql`, import.meta.url), "utf8"))
      .replaceAll("CREATE TABLE ", "CREATE TABLE IF NOT EXISTS ").replaceAll("CREATE INDEX ", "CREATE INDEX IF NOT EXISTS ");
    await db.executeMultiple(sql);
  }
  console.log("Added deployment tables without changing existing data.");
} finally { db.close(); }
