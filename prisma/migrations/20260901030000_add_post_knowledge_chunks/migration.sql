CREATE TABLE "PostKnowledgeChunk" (
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
    CONSTRAINT "PostKnowledgeChunk_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "PostKnowledgeChunk_postId_chunkIndex_key" ON "PostKnowledgeChunk"("postId", "chunkIndex");
CREATE INDEX "PostKnowledgeChunk_embeddingModel_idx" ON "PostKnowledgeChunk"("embeddingModel");
