import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

interface RetrievalCase {
  question: string;
  expected: string;
  shouldAnswer: boolean;
}

const cases: RetrievalCase[] = [
  { question: "Celery、MySQL 和 Redis 如何分工？", expected: "Python、MySQL、Celery", shouldAnswer: true },
  { question: "workflowWithComfyUI 是做什么的？", expected: "README.md", shouldAnswer: true },
  { question: "法国总统是谁？", expected: "", shouldAnswer: false },
  { question: "给我推荐今晚吃什么", expected: "", shouldAnswer: false },
];

async function main() {
  const { searchKnowledge } = await import("../src/lib/knowledge-index");
  const { answerWithLocalRag, getCitationMinScore, getRagMinScore } = await import("../src/lib/rag");
  const { prisma } = await import("../src/lib/db");
  const stored = await prisma.ragEvaluationCase.findMany({ where: { enabled: true } });
  const allCases = new Map(cases.map((test) => [test.question, test]));
  stored.forEach((test) => allCases.set(test.question, {
    question: test.question,
    expected: test.expectedSource,
    shouldAnswer: test.expectedMode === "answer",
  }));
  const threshold = getRagMinScore();
  const full = process.argv.includes("--full");
  let passed = 0;
  let expectedSourceCases = 0;
  let sourceHits = 0;
  let refusalCases = 0;
  let correctRefusals = 0;
  let citationCases = 0;
  let citationPasses = 0;

  for (const test of allCases.values()) {
    const matches = await searchKnowledge(test.question, undefined, 3);
    const top = matches[0];
    const wouldAnswer = Boolean(top && top.score >= threshold);
    const sourceMatches = !test.expected || Boolean(top && `${top.repository}/${top.path}`.includes(test.expected));
    const ok = wouldAnswer === test.shouldAnswer && sourceMatches;
    if (ok) passed += 1;
    if (test.expected) {
      expectedSourceCases += 1;
      if (sourceMatches) sourceHits += 1;
    }
    if (!test.shouldAnswer) {
      refusalCases += 1;
      if (!wouldAnswer) correctRefusals += 1;
    }
    console.log(`${ok ? "PASS" : "FAIL"} | ${top?.score.toFixed(3) ?? "0.000"} | ${wouldAnswer ? "answer" : "refuse"} | ${test.question}`);
    if (top) console.log(`       ${top.repository}/${top.path}`);
    if (full && test.shouldAnswer && wouldAnswer) {
      const result = await answerWithLocalRag(test.question);
      citationCases += 1;
      if (!result.refused && result.citationScore >= getCitationMinScore()) citationPasses += 1;
      console.log(`       citation=${result.citationScore.toFixed(3)} ${result.refused ? "REFUSED" : "SUPPORTED"}`);
    }
  }

  const total = allCases.size;
  console.log(`\nDecision accuracy: ${passed}/${total} (${Math.round(passed / total * 100)}%)`);
  console.log(`Source hit rate: ${sourceHits}/${expectedSourceCases || 0}`);
  console.log(`Correct refusal rate: ${correctRefusals}/${refusalCases || 0}`);
  if (full) console.log(`Citation consistency pass rate: ${citationPasses}/${citationCases || 0}`);
  console.log(`Thresholds: retrieval=${threshold.toFixed(2)}, citation=${getCitationMinScore().toFixed(2)}`);
  await prisma.$disconnect();
  if (passed !== total || (full && citationPasses !== citationCases)) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
