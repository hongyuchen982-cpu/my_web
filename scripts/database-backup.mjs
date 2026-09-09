import { createClient } from "@libsql/client";
import { mkdir, access } from "node:fs/promises";
import path from "node:path";

const url = process.env.DATABASE_URL || "file:./dev.db";
if (!url.startsWith("file:")) throw new Error("This backup command only supports local SQLite");
const folder = path.resolve(process.env.BACKUP_DIR || "backups");
await mkdir(folder, { recursive: true });
const target = path.join(folder, `snapshot-${new Date().toISOString().replace(/[:.]/g, "-")}.db`);
try { await access(target); throw new Error("Backup already exists"); }
catch (error) { if (error.code !== "ENOENT") throw error; }
const db = createClient({ url });
try {
  await db.execute({ sql: "VACUUM INTO ?", args: [target] });
  const check = createClient({ url: `file:${target}` });
  try {
    const integrity = await check.execute("PRAGMA integrity_check");
    if (integrity.rows[0]?.integrity_check !== "ok") throw new Error("Backup integrity failed");
  } finally { check.close(); }
  console.log(`Verified backup: ${target}`);
} finally { db.close(); }
