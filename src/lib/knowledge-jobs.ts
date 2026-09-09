import "server-only";
import { prisma } from "@/lib/db";

export async function queueKnowledgeJob(projectId: string, mode: "sync" | "sync-index" | "chunks" | "embeddings", force = false) {
  const source = await prisma.knowledgeSource.findUnique({ where: { projectId } });
  if (!source?.enabled) throw new Error("知识库未启用");
  // Completed rows may be reused; active jobs are never overwritten by another click.
  const updated = await prisma.knowledgeJob.updateMany({ where: { projectId, status: { in: ["done", "failed"] } }, data: { mode, force, status: "queued", error: "" } });
  if (updated.count) return;
  try { await prisma.knowledgeJob.create({ data: { projectId, mode, force } }); }
  catch (error) {
    if (!(await prisma.knowledgeJob.findUnique({ where: { projectId } }))) throw error;
  }
}

export async function requireIdleKnowledge(projectId: string) {
  if (await prisma.knowledgeJob.findFirst({ where: { projectId, status: { in: ["queued", "running"] } } })) {
    throw new Error("请等待后台知识库任务完成后再修改或删除项目。");
  }
}
