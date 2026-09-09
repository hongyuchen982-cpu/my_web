import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { prisma } = await import("../src/lib/db");
  const { buildProjectIndex } = await import("../src/lib/knowledge-index");
  const args = process.argv.slice(2);
  const withEmbeddings = args.includes("--embeddings");
  const selector = args.find((arg) => !arg.startsWith("--"));

  const source = selector
    ? await prisma.knowledgeSource.findFirst({
      where: {
        OR: [
          { projectId: selector },
          { repository: selector },
          { project: { title: selector } },
        ],
      },
      include: { project: { select: { title: true } } },
      })
    : await prisma.knowledgeSource.findFirst({
      where: { enabled: true, status: "ready" },
      orderBy: { lastSyncedAt: "desc" },
      include: { project: { select: { title: true } } },
      });

  if (!source) {
    throw new Error("没有找到已同步的知识库。可传项目 ID、仓库名或项目标题。");
  }

  const result = await buildProjectIndex(source.projectId, withEmbeddings);
  console.log(JSON.stringify({ project: source.project.title, repository: source.repository, ...result }, null, 2));
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
