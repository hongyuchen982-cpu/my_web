import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createClient } from "@libsql/client";

test("fresh migrations, atomic limiter, feedback proof and durable job deduplication", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "my-web-db-test-"));
  process.env.DATABASE_URL = `file:${path.join(directory, "test.db").replaceAll("\\", "/")}`;
  Object.assign(process.env, { NODE_ENV: "test" });
  process.env.TRUST_PROXY = "true";
  process.env.ADMIN_SESSION_SECRET = "test-only-secret-".repeat(3);
  const db = createClient({ url: process.env.DATABASE_URL });
  for (const folder of readdirSync("prisma/migrations").filter((name) => /^\d/.test(name)).sort()) {
    await db.executeMultiple(readFileSync(`prisma/migrations/${folder}/migration.sql`, "utf8"));
  }
  const { prisma } = await import("../src/lib/db");
  const { consumeRateLimit, feedbackToken, validFeedbackToken, sameOrigin } = await import("../src/lib/request-guard");
  const { queueKnowledgeJob, requireIdleKnowledge } = await import("../src/lib/knowledge-jobs");
  try {
    const results = await Promise.all(Array.from({ length: 8 }, () => consumeRateLimit(new Headers({ "x-real-ip": "192.0.2.1" }), "test", 3)));
    assert.equal(results.filter(Boolean).length, 3);
    assert.equal(await consumeRateLimit(new Headers({ "x-real-ip": "192.0.2.2" }), "test", 3), true);
    assert.equal(validFeedbackToken("one", feedbackToken("one")), true);
    assert.equal(validFeedbackToken("two", feedbackToken("one")), false);
    assert.equal(sameOrigin(new Headers({ host: "site.test", origin: "https://evil.test" })), false);
    const project = await prisma.project.create({ data: { title: "Test", github: "https://github.com/example/test" } });
    await prisma.knowledgeSource.create({ data: { projectId: project.id, repository: "example/test" } });
    await queueKnowledgeJob(project.id, "sync");
    await queueKnowledgeJob(project.id, "sync-index");
    assert.equal(await prisma.knowledgeJob.count(), 1);
    assert.equal((await prisma.knowledgeJob.findUniqueOrThrow({ where: { projectId: project.id } })).mode, "sync");
    await assert.rejects(requireIdleKnowledge(project.id));
    await prisma.knowledgeJob.update({ where: { projectId: project.id }, data: { status: "failed" } });
    await queueKnowledgeJob(project.id, "sync-index");
    assert.equal((await prisma.knowledgeJob.findUniqueOrThrow({ where: { projectId: project.id } })).mode, "sync-index");
    const integrity = await db.execute("PRAGMA integrity_check");
    assert.equal(integrity.rows[0].integrity_check, "ok");
    const { answerWithLocalRag } = await import("../src/lib/rag");
    const { searchKnowledge } = await import("../src/lib/knowledge-index");
    const originalFetch = globalThis.fetch;
    process.env.CHAT_PROVIDER = "ollama";
    process.env.EMBEDDING_PROVIDER = "ollama";
    process.env.OLLAMA_EMBEDDING_MODEL = "test-embed";
    process.env.OLLAMA_CHAT_MODEL = "test-chat";
    delete process.env.CHAT_MODEL;
    const post = await prisma.post.create({ data: { slug: "test", title: "测试文章", published: true, content: "本站通过数据库记录任务状态并由独立后台进程执行任务。" } });
    await prisma.postKnowledgeChunk.create({ data: { postId: post.id, chunkIndex: 0, content: post.content, contentHash: "test", embedding: "[1,0]", embeddingModel: "test-embed" } });
    const legacyPost = await prisma.post.create({ data: { slug: "agent-memory", title: "Agent Memory 实践", published: true, content: "Agent Memory 保存用户偏好、任务状态和可复用经验。" } });
    await prisma.postKnowledgeChunk.create({ data: { postId: legacyPost.id, chunkIndex: 0, content: legacyPost.content, contentHash: "legacy", embedding: "[0,1]", embeddingModel: "retired-embed" } });
    await prisma.post.create({ data: { slug: "agent-rules", title: "AI 总乱改代码？用规则文件固定项目上下文", published: true, content: "规则文件让 Agent 在修改代码前先了解项目边界。" } });
    let chatCalls = 0;
    let invalidCitation = false;
    globalThis.fetch = async (url, init) => {
      const body = JSON.parse(String(init?.body));
      if (String(url).endsWith("/api/embed")) return Response.json({ embeddings: body.input.map((input: string) => input.toLocaleLowerCase().includes("agent memory") ? [0, 1] : input.includes("晚饭") || input.includes("乱改代码") ? [0, -1] : [1, 0]) });
      chatCalls += 1;
      return Response.json({ message: { content: JSON.stringify({ claims: [{ text: post.content, citations: [invalidCitation ? 99 : 1] }] }) } });
    };
    try {
      const legacyMatches = await searchKnowledge("agent memory 有哪些？怎么做？");
      assert.equal(legacyMatches[0]?.githubUrl, "/posts/agent-memory", "keyword retrieval must include chunks indexed by a previous embedding model");
      const unindexedMatches = await searchKnowledge("i乱改代码怎么解决？说一个就行了");
      assert.equal(unindexedMatches[0]?.githubUrl, "/posts/agent-rules", "published posts without chunks must remain searchable");
      assert.equal((await answerWithLocalRag("晚饭吃什么？")).refused, true);
      assert.equal(chatCalls, 0);
      assert.equal((await answerWithLocalRag("任务如何执行？", project.id)).refused, true);
      assert.equal(chatCalls, 0, "project scope must not retrieve global articles");
      const answer = await answerWithLocalRag("任务如何执行？");
      assert.equal(answer.refused, false);
      assert.equal(answer.sources.length, 1);
      invalidCitation = true;
      assert.equal((await answerWithLocalRag("任务如何执行？")).refused, true);
      assert.equal(chatCalls, 3, "invalid citation gets exactly one rewrite");
    } finally { globalThis.fetch = originalFetch; }
  } finally { await prisma.$disconnect(); db.close(); }
});
