import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const args = process.argv.slice(2);
  const slug = args.find((argument) => !argument.startsWith("--"))
    ?? "python-mysql-celery-transformers-engineering";
  const withEmbeddings = args.includes("--embeddings");
  const { prisma } = await import("../src/lib/db");
  const { buildPostIndex } = await import("../src/lib/knowledge-index");
  const result = await buildPostIndex(slug, withEmbeddings);
  console.log(JSON.stringify({ slug, ...result }, null, 2));
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
