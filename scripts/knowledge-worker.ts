import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  const { prisma } = await import("../src/lib/db");
  const { syncProjectRepository } = await import("../src/lib/knowledge-sync");
  const { buildProjectIndex } = await import("../src/lib/knowledge-index");
  // Exactly one worker per database. Do not auto-repeat interrupted billable operations.
  await prisma.knowledgeJob.updateMany({ where: { status: "running" }, data: { status: "failed", error: "Worker 重启，任务中断；请检查后重新提交。" } });
  let stop = false;
  process.on("SIGTERM", () => { stop = true; });
  process.on("SIGINT", () => { stop = true; });
  try {
    do {
      await prisma.rateBucket.deleteMany({ where: { expiresAt: { lt: new Date() } } });
      const job = await prisma.knowledgeJob.findFirst({ where: { status: "queued" }, orderBy: { updatedAt: "asc" } });
      if (job) {
        const claimed = await prisma.knowledgeJob.updateMany({ where: { projectId: job.projectId, status: "queued" }, data: { status: "running" } });
        if (!claimed.count) continue;
        try {
          const source = await prisma.knowledgeSource.findUnique({ where: { projectId: job.projectId } });
          if (!source?.enabled) throw new Error("Disabled source");
          if (job.mode === "sync" || job.mode === "sync-index") await syncProjectRepository(job.projectId, job.force);
          if (job.mode !== "sync") await buildProjectIndex(job.projectId, job.mode !== "chunks");
          await prisma.knowledgeJob.update({ where: { projectId: job.projectId }, data: { status: "done", error: "" } });
        } catch {
          await prisma.knowledgeJob.update({ where: { projectId: job.projectId }, data: { status: "failed", error: "同步或索引失败，请检查模型配置、额度和 GitHub 连接后重新提交。" } });
        }
      }
      if (process.argv.includes("--once")) break;
      if (!stop) await new Promise((resolve) => setTimeout(resolve, 5000));
    } while (!stop);
  } finally { await prisma.$disconnect(); }
}
main().catch(() => { console.error("Worker stopped: check database schema and configuration."); process.exitCode = 1; });
