CREATE TABLE "RateBucket" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "count" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" DATETIME NOT NULL
);
CREATE INDEX "RateBucket_expiresAt_idx" ON "RateBucket"("expiresAt");
