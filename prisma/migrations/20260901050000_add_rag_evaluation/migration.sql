ALTER TABLE "RagInteraction" ADD COLUMN "feedbackReason" TEXT;
ALTER TABLE "RagInteraction" ADD COLUMN "citationScore" REAL NOT NULL DEFAULT 0;

CREATE TABLE "RagEvaluationCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "expectedMode" TEXT NOT NULL,
    "expectedSource" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "originInteractionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "RagEvaluationCase_question_key" ON "RagEvaluationCase"("question");
CREATE INDEX "RagEvaluationCase_enabled_idx" ON "RagEvaluationCase"("enabled");
