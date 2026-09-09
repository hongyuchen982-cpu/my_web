import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
async function main() {
  const { prisma } = await import("../src/lib/db");
  const { buildPostIndex, buildProjectIndex } = await import("../src/lib/knowledge-index");
  try {
    if (await prisma.knowledgeJob.count({ where: { status: { in: ["running", "queued"] } } })) throw new Error("请先完成后台任务并暂停 Worker");
    const posts = await prisma.post.findMany({ where: { published: true }, select: { slug: true } });
    const sources = await prisma.knowledgeSource.findMany({ where: { enabled: true, status: "ready" }, select: { projectId: true } });
    for (const post of posts) { await buildPostIndex(post.slug, true); console.log(`已索引文章 ${post.slug}`); }
    for (const source of sources) { await buildProjectIndex(source.projectId, true); console.log(`已索引项目 ${source.projectId}`); }
    console.log("索引完成。请运行 npm run rag:evaluate -- --full 校准阈值。");
  } finally { await prisma.$disconnect(); }
}
main().catch(() => { console.error("索引未全部完成，请检查配置后重试；单个条目生成成功后才替换旧索引。"); process.exitCode = 1; });
