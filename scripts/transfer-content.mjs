import { createClient } from "@libsql/client";
const [sourceUrl, targetUrl] = process.argv.slice(2);
if (!sourceUrl?.startsWith("file:") || !targetUrl?.startsWith("file:") || sourceUrl === targetUrl) throw new Error("Usage: node scripts/transfer-content.mjs file:/source.db file:/empty-target.db");
const source = createClient({ url: sourceUrl });
const target = createClient({ url: targetUrl });
try {
  const occupied = await target.execute('SELECT (SELECT COUNT(*) FROM "Post") + (SELECT COUNT(*) FROM "Project") AS count');
  if (Number(occupied.rows[0].count)) throw new Error("Target must have no posts/projects; refusing overwrite");
  const posts = await source.execute('SELECT id,slug,title,excerpt,content,category,published,createdAt,updatedAt FROM "Post" WHERE published = 1');
  const projects = await source.execute('SELECT id,title,description,category,status,url,github,techs,sortOrder FROM "Project"');
  const transaction = await target.transaction("write");
  try {
    for (const [table, result] of [["Post", posts], ["Project", projects]]) {
      for (const row of result.rows) {
        const columns = result.columns;
        await transaction.execute({ sql: `INSERT INTO "${table}" (${columns.map((column) => `"${column}"`).join(",")}) VALUES (${columns.map(() => "?").join(",")})`, args: columns.map((column) => row[column]) });
      }
    }
    await transaction.commit();
  } catch (error) { await transaction.rollback(); throw error; }
  console.log(`Imported ${posts.rows.length} published posts and ${projects.rows.length} projects. No users, credentials, feedback or embeddings copied.`);
} finally { source.close(); target.close(); }
