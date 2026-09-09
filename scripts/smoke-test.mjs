import { createClient } from "@libsql/client";
import { mkdir, mkdtemp, readFile, readdir } from "node:fs/promises";
import { spawn, execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { randomBytes } from "node:crypto";
import path from "node:path";
import assert from "node:assert/strict";

await mkdir("artifacts", { recursive: true });
const directory = await mkdtemp(path.resolve("artifacts/smoke-"));
const databaseUrl = `file:${path.join(directory, "test.db").replaceAll("\\", "/")}`;
const db = createClient({ url: databaseUrl });
for (const migration of (await readdir("prisma/migrations")).filter((name) => /^\d/.test(name)).sort()) {
  await db.executeMultiple(await readFile(`prisma/migrations/${migration}/migration.sql`, "utf8"));
}
execFileSync(process.execPath, ["scripts/transfer-content.mjs", "file:./dev.db", databaseUrl], { stdio: "inherit" });
const env = { ...process.env, NODE_ENV: "production", DATABASE_URL: databaseUrl, TURSO_DATABASE_URL: "", TURSO_AUTH_TOKEN: "", ADMIN_PASSWORD: randomBytes(24).toString("hex"), ADMIN_SESSION_SECRET: randomBytes(32).toString("hex"), CHAT_PROVIDER: "ollama", OLLAMA_BASE_URL: "http://127.0.0.1:1", TRUST_PROXY: "false" };
const port = "3101";
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", port, "-H", "127.0.0.1"], { env, stdio: ["ignore", "pipe", "pipe"] });
let logs = "";
server.stdout.on("data", (data) => { logs = (logs + data).slice(-4000); });
server.stderr.on("data", (data) => { logs = (logs + data).slice(-4000); });
const base = `http://127.0.0.1:${port}`;
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(`${base}/api/health`)).ok) { ready = true; break; } } catch {}
    if (server.exitCode !== null) throw new Error(`Server stopped: ${logs}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  assert.ok(ready, "Production server became healthy");
  for (const route of ["/", "/posts", "/projects", "/admin/login", "/api/rag/models"]) {
    assert.equal((await fetch(base + route)).status, 200, route);
  }
  const projectHtml = await (await fetch(`${base}/projects`)).text();
  for (const repo of ["fastapi/full-stack-fastapi-template", "celery/celery", "langchain-ai/langgraph", "run-llama/llama_index", "Comfy-Org/ComfyUI"]) assert.ok(projectHtml.includes(repo), repo);
  assert.equal((await fetch(`${base}/admin/projects`, { redirect: "manual" })).status, 307);
  assert.equal((await fetch(`${base}/api/rag/chat`, { method: "POST", headers: { Origin: "https://evil.test" }, body: "{}" })).status, 403);
  assert.equal((await fetch(`${base}/api/rag/chat`, { method: "POST", body: "{}" })).status, 400);
  assert.equal((await fetch(`${base}/api/rag/chat`, { method: "POST", body: JSON.stringify({ question: "测试问题", model: "not-allowed" }) })).status, 400);
  assert.equal((await fetch(`${base}/api/rag/feedback`, { method: "PATCH", body: "{}" })).status, 400);
  for (let index = 0; index < 11; index++) await fetch(`${base}/api/rag/chat`, { method: "POST", body: "{}" });
  assert.equal((await fetch(`${base}/api/rag/chat`, { method: "POST", body: "{}" })).status, 429);
  // Verify worker handles a failed job without leaking details or losing durable state.
  await db.execute({ sql: 'INSERT INTO KnowledgeJob (projectId,mode,status,updatedAt) VALUES (?,?,?,?)', args: ["missing-source", "sync", "queued", Date.now()] });
  execFileSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "scripts/knowledge-worker.ts", "--once"], { env, stdio: "inherit" });
  assert.equal((await db.execute("SELECT status FROM KnowledgeJob WHERE projectId='missing-source'")).rows[0].status, "failed");
  execFileSync(process.execPath, ["scripts/database-backup.mjs"], { env: { ...env, BACKUP_DIR: path.join(directory, "backups") }, stdio: "inherit" });
  const snapshots = await readdir(path.join(directory, "backups"));
  const restored = createClient({ url: `file:${path.join(directory, "backups", snapshots[0]).replaceAll("\\", "/")}` });
  assert.equal((await restored.execute("SELECT count(*) AS n FROM Post")).rows[0].n, (await db.execute("SELECT count(*) AS n FROM Post")).rows[0].n);
  restored.close();
  if (process.env.BROWSER_MODULE_ROOT) {
    const requireBrowser = createRequire(path.join(process.env.BROWSER_MODULE_ROOT, "package.json"));
    const { chromium } = requireBrowser("playwright");
    browser = await chromium.launch({ channel: "msedge", headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}/projects`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(directory, "projects-desktop.png"), fullPage: true });
    await page.getByRole("button", { name: "打开作品集 AI 助手", exact: true }).click();
    await page.locator("#chat-model option").first().waitFor({ state: "attached" });
    await page.screenshot({ path: path.join(directory, "chat-desktop.png") });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(directory, "chat-mobile.png") });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "Mobile layout fits viewport");
    assert.deepEqual(errors, []);
    await page.goto(`${base}/admin/login`);
    await page.getByLabel("管理密码").fill(env.ADMIN_PASSWORD);
    await page.getByRole("button", { name: "登录后台", exact: true }).click();
    await page.waitForURL("**/admin/projects", { timeout: 60_000 });
    assert.ok((await page.context().cookies()).some((cookie) => cookie.name === "chy_admin_session" && cookie.httpOnly && cookie.secure));
    await page.getByRole("button", { name: "退出", exact: true }).click();
    await page.waitForURL("**/admin/login");
  }
  console.log(`PASS: production routes, auth redirect, model allowlist, CSRF, limiter, worker failure, content transfer and backup restore. Artifacts: ${directory}`);
} finally {
  await browser?.close();
  server.kill();
  db.close();
}
