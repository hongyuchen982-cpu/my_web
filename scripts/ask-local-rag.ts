import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const args = process.argv.slice(2);
  const projectArg = args.find((arg) => arg.startsWith("--project="));
  const question = args.filter((arg) => !arg.startsWith("--project=")).join(" ").trim();
  if (!question) throw new Error("请在命令后输入一个项目问题");

  const { answerWithLocalRag } = await import("../src/lib/rag");
  const result = await answerWithLocalRag(question, projectArg?.slice("--project=".length));
  console.log(`\n${result.answer}\n`);
  console.log("Sources:");
  result.sources.forEach((source, index) => {
    console.log(`[${index + 1}] ${source.repository}/${source.path} (${source.score.toFixed(3)})`);
    console.log(`    ${source.githubUrl}`);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
