import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { prisma } = await import("../src/lib/db");
  const { syncProjectRepository } = await import("../src/lib/knowledge-sync");
  const selector = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
  if (!selector) throw new Error("请传入项目 ID、仓库名、项目标题或 GitHub 地址");

  const project = await prisma.project.findFirst({
    where: {
      OR: [
        { id: selector },
        { title: selector },
        { github: selector },
        { knowledgeSource: { repository: selector } },
      ],
    },
  });
  if (!project) throw new Error("没有找到对应的精选项目");

  const result = await syncProjectRepository(project.id, process.argv.includes("--force"));
  console.log(JSON.stringify({ project: project.title, github: project.github, ...result }, null, 2));
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
