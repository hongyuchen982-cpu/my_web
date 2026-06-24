/**
 * 将本地 SQLite 数据迁移到 Turso
 * 用法：npx tsx scripts/migrate-to-turso.ts
 */
import { createClient } from "@libsql/client";
import "dotenv/config";

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error("❌ 请在 .env 中设置 TURSO_DATABASE_URL 和 TURSO_AUTH_TOKEN");
  process.exit(1);
}

// 本地数据库
const local = createClient({ url: "file:./dev.db" });

// Turso 远程数据库
const turso = createClient({
  url: TURSO_URL,
  authToken: TURSO_TOKEN,
});

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
  `CREATE TABLE IF NOT EXISTS "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "authorId" TEXT,
    FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Post_slug_key" ON "Post"("slug")`,
  `CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'active',
    "url" TEXT,
    "github" TEXT,
    "techs" TEXT NOT NULL DEFAULT '[]',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "authorId" TEXT,
    FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "checksum" TEXT NOT NULL,
    "finished_at" DATETIME,
    "migration_name" TEXT NOT NULL,
    "logs" TEXT,
    "rolled_back_at" DATETIME,
    "started_at" DATETIME NOT NULL DEFAULT current_timestamp,
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
  )`,
];

async function main() {
  console.log("🚀 开始迁移数据到 Turso...\n");

  // 1. 创建表结构
  console.log("📋 创建表结构...");
  for (const sql of SCHEMA) {
    await turso.execute(sql);
    console.log("  ✅", sql.split(" ").slice(0, 5).join(" ") + "...");
  }

  // 2. 迁移 User
  console.log("\n👤 迁移用户数据...");
  const users = await local.execute("SELECT * FROM User");
  for (const user of users.rows) {
    await turso.execute({
      sql: `INSERT INTO User (id, email, name, passwordHash, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        user.id,
        user.email,
        user.name,
        user.passwordHash,
        user.createdAt,
        user.updatedAt,
      ],
    });
  }
  console.log(`  ✅ ${users.rows.length} 个用户已迁移`);

  // 3. 迁移 Post
  console.log("\n📝 迁移文章数据...");
  const posts = await local.execute("SELECT * FROM Post");
  for (const post of posts.rows) {
    await turso.execute({
      sql: `INSERT INTO Post (id, slug, title, excerpt, content, category, published, createdAt, updatedAt, authorId)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        post.id,
        post.slug,
        post.title,
        post.excerpt,
        post.content,
        post.category,
        post.published,
        post.createdAt,
        post.updatedAt,
        post.authorId,
      ],
    });
  }
  console.log(`  ✅ ${posts.rows.length} 篇文章已迁移`);

  // 4. 迁移 Project
  console.log("\n📦 迁移项目数据...");
  const projects = await local.execute("SELECT * FROM Project");
  for (const p of projects.rows) {
    await turso.execute({
      sql: `INSERT INTO Project (id, title, description, category, status, url, github, techs, sortOrder, authorId)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        p.id,
        p.title,
        p.description,
        p.category,
        p.status,
        p.url,
        p.github,
        p.techs,
        p.sortOrder,
        p.authorId,
      ],
    });
  }
  console.log(`  ✅ ${projects.rows.length} 个项目已迁移`);

  // 5. 迁移 _prisma_migrations
  console.log("\n📋 迁移 Prisma 迁移记录...");
  const migrations = await local.execute("SELECT * FROM _prisma_migrations");
  for (const m of migrations.rows) {
    await turso.execute({
      sql: `INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        m.id,
        m.checksum,
        m.finished_at,
        m.migration_name,
        m.logs,
        m.rolled_back_at,
        m.started_at,
        m.applied_steps_count,
      ],
    });
  }
  console.log(`  ✅ ${migrations.rows.length} 条迁移记录已同步`);

  // 6. 验证
  console.log("\n🔍 验证 Turso 数据...");
  const tursoUsers = await turso.execute("SELECT count(*) as c FROM User");
  const tursoPosts = await turso.execute("SELECT count(*) as c FROM Post");
  const tursoProjects = await turso.execute("SELECT count(*) as c FROM Project");
  console.log(`  用户: ${tursoUsers.rows[0].c} | 文章: ${tursoPosts.rows[0].c} | 项目: ${tursoProjects.rows[0].c}`);

  console.log("\n🎉 迁移完成！");
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ 迁移失败:", e.message);
  process.exit(1);
});
