CREATE TABLE "RagInteraction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sources" TEXT NOT NULL DEFAULT '[]',
    "topScore" REAL NOT NULL DEFAULT 0,
    "refused" BOOLEAN NOT NULL DEFAULT false,
    "feedback" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE INDEX "RagInteraction_feedback_idx" ON "RagInteraction"("feedback");
CREATE INDEX "RagInteraction_refused_idx" ON "RagInteraction"("refused");
CREATE INDEX "RagInteraction_createdAt_idx" ON "RagInteraction"("createdAt");
