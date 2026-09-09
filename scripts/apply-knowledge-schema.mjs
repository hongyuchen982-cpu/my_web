/** Add the GitHub knowledge-source tables to the configured Turso database. */
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  throw new Error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required");
}

const client = createClient({ url, authToken });
const statements = [
  `CREATE TABLE IF NOT EXISTS "KnowledgeSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "repository" TEXT NOT NULL,
    "defaultBranch" TEXT NOT NULL DEFAULT '',
    "lastCommitSha" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "fileCount" INTEGER NOT NULL DEFAULT 0,
    "totalBytes" INTEGER NOT NULL DEFAULT 0,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "embeddingModel" TEXT NOT NULL DEFAULT '',
    "indexedCommitSha" TEXT NOT NULL DEFAULT '',
    "indexedAt" DATETIME,
    "lastSyncedAt" DATETIME,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "KnowledgeFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "sha" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT '',
    "size" INTEGER NOT NULL DEFAULT 0,
    "content" TEXT NOT NULL DEFAULT '',
    "githubUrl" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("sourceId") REFERENCES "KnowledgeSource" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "KnowledgeChunk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "startLine" INTEGER NOT NULL DEFAULT 1,
    "endLine" INTEGER NOT NULL DEFAULT 1,
    "content" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "embedding" TEXT NOT NULL DEFAULT '',
    "embeddingModel" TEXT NOT NULL DEFAULT '',
    "githubUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("sourceId") REFERENCES "KnowledgeSource" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("fileId") REFERENCES "KnowledgeFile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "PostKnowledgeChunk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "startLine" INTEGER NOT NULL DEFAULT 1,
    "endLine" INTEGER NOT NULL DEFAULT 1,
    "content" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "embedding" TEXT NOT NULL DEFAULT '',
    "embeddingModel" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "RagInteraction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sources" TEXT NOT NULL DEFAULT '[]',
    "topScore" REAL NOT NULL DEFAULT 0,
    "citationScore" REAL NOT NULL DEFAULT 0,
    "refused" BOOLEAN NOT NULL DEFAULT false,
    "feedback" TEXT,
    "feedbackReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "RagEvaluationCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "expectedMode" TEXT NOT NULL,
    "expectedSource" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "originInteractionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "KnowledgeSource_projectId_key" ON "KnowledgeSource"("projectId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "KnowledgeFile_sourceId_path_key" ON "KnowledgeFile"("sourceId", "path")`,
  `CREATE INDEX IF NOT EXISTS "KnowledgeFile_sourceId_idx" ON "KnowledgeFile"("sourceId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "KnowledgeChunk_fileId_chunkIndex_key" ON "KnowledgeChunk"("fileId", "chunkIndex")`,
  `CREATE INDEX IF NOT EXISTS "KnowledgeChunk_sourceId_idx" ON "KnowledgeChunk"("sourceId")`,
  `CREATE INDEX IF NOT EXISTS "KnowledgeChunk_contentHash_idx" ON "KnowledgeChunk"("contentHash")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PostKnowledgeChunk_postId_chunkIndex_key" ON "PostKnowledgeChunk"("postId", "chunkIndex")`,
  `CREATE INDEX IF NOT EXISTS "PostKnowledgeChunk_embeddingModel_idx" ON "PostKnowledgeChunk"("embeddingModel")`,
  `CREATE INDEX IF NOT EXISTS "RagInteraction_feedback_idx" ON "RagInteraction"("feedback")`,
  `CREATE INDEX IF NOT EXISTS "RagInteraction_refused_idx" ON "RagInteraction"("refused")`,
  `CREATE INDEX IF NOT EXISTS "RagInteraction_createdAt_idx" ON "RagInteraction"("createdAt")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "RagEvaluationCase_question_key" ON "RagEvaluationCase"("question")`,
  `CREATE INDEX IF NOT EXISTS "RagEvaluationCase_enabled_idx" ON "RagEvaluationCase"("enabled")`,
];

for (const sql of statements) await client.execute(sql);
const sourceColumns = await client.execute(`PRAGMA table_info("KnowledgeSource")`);
const existingColumns = new Set(sourceColumns.rows.map((row) => String(row.name)));
const missingColumns = [
  ["chunkCount", `ALTER TABLE "KnowledgeSource" ADD COLUMN "chunkCount" INTEGER NOT NULL DEFAULT 0`],
  ["embeddingModel", `ALTER TABLE "KnowledgeSource" ADD COLUMN "embeddingModel" TEXT NOT NULL DEFAULT ''`],
  ["indexedCommitSha", `ALTER TABLE "KnowledgeSource" ADD COLUMN "indexedCommitSha" TEXT NOT NULL DEFAULT ''`],
  ["indexedAt", `ALTER TABLE "KnowledgeSource" ADD COLUMN "indexedAt" DATETIME`],
];
for (const [name, sql] of missingColumns) {
  if (!existingColumns.has(name)) await client.execute(sql);
}
const interactionColumns = await client.execute(`PRAGMA table_info("RagInteraction")`);
if (!new Set(interactionColumns.rows.map((row) => String(row.name))).has("feedbackReason")) {
  await client.execute(`ALTER TABLE "RagInteraction" ADD COLUMN "feedbackReason" TEXT`);
}
if (!new Set(interactionColumns.rows.map((row) => String(row.name))).has("citationScore")) {
  await client.execute(`ALTER TABLE "RagInteraction" ADD COLUMN "citationScore" REAL NOT NULL DEFAULT 0`);
}
const sourceTable = await client.execute(
  `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'KnowledgeSource'`
);
const fileTable = await client.execute(
  `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'KnowledgeFile'`
);
const chunkTable = await client.execute(
  `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'KnowledgeChunk'`
);
const postChunkTable = await client.execute(
  `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'PostKnowledgeChunk'`
);
const interactionTable = await client.execute(
  `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'RagInteraction'`
);
const evaluationTable = await client.execute(
  `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'RagEvaluationCase'`
);
client.close();

if (sourceTable.rows.length !== 1 || fileTable.rows.length !== 1 || chunkTable.rows.length !== 1 || postChunkTable.rows.length !== 1 || interactionTable.rows.length !== 1 || evaluationTable.rows.length !== 1) {
  throw new Error("Knowledge schema verification failed");
}

console.log("Project, post, RAG feedback, and evaluation tables are ready.");
