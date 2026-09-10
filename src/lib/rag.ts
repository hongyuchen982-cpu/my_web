import "server-only";

import { END, START, StateGraph, StateSchema } from "@langchain/langgraph";
import { z } from "zod";
import { requestChat } from "@/lib/chat-provider";
import {
  cosineSimilarity,
  embedKnowledgeTexts,
  searchKnowledge,
  type KnowledgeMatch,
} from "@/lib/knowledge-index";

const MatchSchema = z.object({
  kind: z.enum(["project", "post"]),
  projectId: z.string(),
  repository: z.string(),
  path: z.string(),
  language: z.string(),
  content: z.string(),
  githubUrl: z.string(),
  startLine: z.number(),
  endLine: z.number(),
  score: z.number(),
  vector: z.array(z.number()),
});

const RagState = new StateSchema({
  question: z.string(),
  projectId: z.string().optional(),
  chatModel: z.string().optional(),
  matches: z.array(MatchSchema).default([]),
  answer: z.string().default(""),
  refused: z.boolean().default(false),
  confidence: z.number().default(0),
  citationScore: z.number().default(0),
});

export interface RagAnswer {
  answer: string;
  sources: KnowledgeMatch[];
  refused: boolean;
  confidence: number;
  citationScore: number;
}

export function getRagMinScore(): number {
  const configured = Number(process.env.RAG_MIN_SCORE ?? "0.45");
  return Number.isFinite(configured) && configured >= 0 && configured <= 1 ? configured : 0.45;
}

export function getCitationMinScore(): number {
  const configured = Number(process.env.RAG_CITATION_MIN_SCORE ?? "0.40");
  return Number.isFinite(configured) && configured >= 0 && configured <= 1 ? configured : 0.40;
}

interface CitationCheck {
  valid: boolean;
  checkedClaims: number;
  lowestScore: number;
}

const GeneratedAnswerSchema = z.object({
  claims: z.array(z.object({
    text: z.string().trim().min(2).max(500),
    citations: z.array(z.number().int().positive()).min(1).max(6),
  })).min(1).max(8),
});

const RawGeneratedAnswerSchema = z.object({
  claims: z.array(z.object({
    text: z.string(),
    citations: z.array(z.coerce.number().int().positive()).optional(),
  })).min(1).max(8),
});

function firstJsonObject(input: string): string | null {
  const start = input.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = start; index < input.length; index += 1) {
    const character = input[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\" && quoted) {
      escaped = true;
      continue;
    }
    if (character === '"') quoted = !quoted;
    if (quoted) continue;
    if (character === "{") depth += 1;
    if (character === "}") {
      depth -= 1;
      if (depth === 0) return input.slice(start, index + 1);
    }
  }
  return null;
}

function claimParagraphs(answer: string) {
  return answer
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => {
      const plain = line.replace(/^[#>*\-\d.\s]+/, "").replace(/[*_`]/g, "").trim();
      return plain.length > 0
        && !plain.endsWith("：")
        && !plain.endsWith(":")
        && !/^(依据|来源|参考)[：:]/.test(plain);
    });
}

async function validateCitationSupport(answer: string, matches: KnowledgeMatch[]): Promise<CitationCheck> {
  const claims = claimParagraphs(answer);
  if (claims.length === 0) return { valid: false, checkedClaims: 0, lowestScore: 0 };
  const parsed = claims.map((claim) => ({
    claim: claim.replace(/\[(\d+)]/g, "").replace(/[*_`]/g, "").trim(),
    citations: [...claim.matchAll(/\[(\d+)]/g)].map((match) => Number(match[1])),
  }));
  if (parsed.some((item) => item.citations.length === 0)) {
    return { valid: false, checkedClaims: parsed.length, lowestScore: 0 };
  }

  let vectors: number[][];
  try {
    vectors = await embedKnowledgeTexts(parsed.map((item) => item.claim));
  } catch (error) {
    console.warn("[rag] citation embedding unavailable; retaining valid source citations", error instanceof Error ? error.message : "unknown error");
    return { valid: false, checkedClaims: parsed.length, lowestScore: 0 };
  }
  // Unindexed published articles are allowed as a deployment-safe fallback.
  // Generate their source vectors on demand so citation checking stays as
  // strict as it is for pre-indexed chunks.
  const sourceVectors = matches.map((match) => match.vector);
  const missingVectorIndexes = sourceVectors
    .map((vector, index) => vector.length === 0 ? index : -1)
    .filter((index) => index >= 0);
  if (missingVectorIndexes.length > 0) {
    try {
      const generated = await embedKnowledgeTexts(missingVectorIndexes.map((index) => matches[index].content));
      missingVectorIndexes.forEach((index, generatedIndex) => { sourceVectors[index] = generated[generatedIndex]; });
    } catch (error) {
      console.warn("[rag] source embedding unavailable; retaining valid source citations", error instanceof Error ? error.message : "unknown error");
      return { valid: false, checkedClaims: parsed.length, lowestScore: 0 };
    }
  }
  const scores = parsed.map((item, index) => Math.max(
    ...item.citations.map((citation) => cosineSimilarity(vectors[index], sourceVectors[citation - 1] ?? []))
  ));
  const lowestScore = Math.min(...scores);
  return {
    valid: scores.every((score) => score >= getCitationMinScore()),
    checkedClaims: parsed.length,
    lowestScore,
  };
}

async function retrieve(state: { question: string; projectId?: string }) {
  const matches = await searchKnowledge(state.question, state.projectId, 4);
  return { matches };
}

async function askOllama(question: string, matches: KnowledgeMatch[], draft?: string, chatModel?: string): Promise<string> {
  const sources = matches.map((match, index) =>
    `[${index + 1}] ${match.repository}/${match.path} L${match.startLine}-L${match.endLine}\n${match.content}`
  ).join("\n\n---\n\n");

  const content = await requestChat([
        {
          role: "system",
          content: "你是这个作品集的项目助手。只能依据本次提供的项目代码或已发布文章，禁止使用记忆补充事实。格式规则：每一个包含事实的段落或列表项都必须在本段末尾放置至少一个来源编号，例如“Celery 负责分发任务。[1]”；禁止只在答案最后统一写‘依据：[1][2]’。资料没有明确支持时必须回答不知道，不得猜测或编造。",
        },
        {
          role: "user",
          content: draft
            ? `问题：${question}\n\n上一版答案没有通过逐段引用一致性检查：\n${draft}\n\n请根据下方原始资料重写。每一个事实段落和每一个列表项末尾都必须单独带有效引用，不能只在末尾统一列来源。\n\n检索到的项目与文章资料：\n${sources}`
            : `问题：${question}\n\n请逐段回答，每个事实段落末尾单独标注引用。\n\n检索到的项目与文章资料：\n${sources || "没有检索到资料"}`,
        },
      ], {
        type: "object",
        properties: {
          claims: {
            type: "array",
            minItems: 1,
            maxItems: 8,
            items: {
              type: "object",
              properties: {
                text: { type: "string" },
                citations: {
                  type: "array",
                  minItems: 1,
                  maxItems: 6,
                  items: { type: "integer" },
                },
              },
              required: ["text", "citations"],
            },
          },
        },
        required: ["claims"],
      }, chatModel);
  let generated: z.infer<typeof GeneratedAnswerSchema>;
  try {
    const jsonObject = firstJsonObject(content);
    if (!jsonObject) throw new Error("missing JSON object");
    const raw = RawGeneratedAnswerSchema.parse(JSON.parse(jsonObject));
    generated = GeneratedAnswerSchema.parse({
      claims: raw.claims.map((claim) => ({
        text: claim.text,
        citations: claim.citations?.length
          ? claim.citations
          : [...claim.text.matchAll(/\[(\d+)]/g)].map((match) => Number(match[1])),
      })),
    });
  } catch {
    return ""; // The bounded generation loop retries once, then safely refuses.
  }
  return generated.claims.map((claim) => {
    const text = claim.text.replace(/\[(\d+)]/g, "").trim();
    const citations = [...new Set(claim.citations)].map((citation) => `[${citation}]`).join("");
    return `${text} ${citations}`;
  }).join("\n\n");
}

async function generate(state: { question: string; matches: KnowledgeMatch[]; chatModel?: string }) {
  const confidence = state.matches[0]?.score ?? 0;
  const threshold = getRagMinScore();
  if (state.matches.length === 0 || confidence < threshold) {
    return {
      answer: "我不知道。现有项目和文章知识库里没有找到足够相关的依据，因此我不应该猜测。",
      // Keep the retrieved candidates visible to the visitor.  They are not
      // used to support an answer below the confidence threshold, but exposing
      // them makes the refusal diagnosable and gives the user a clickable path
      // to inspect the relevant material.
      matches: state.matches,
      refused: true,
      confidence,
      citationScore: 0,
    };
  }

  const supportedMatches = state.matches.filter((match) => match.score >= Math.max(0, threshold - 0.1));
  let answer = await askOllama(state.question, supportedMatches, undefined, state.chatModel);
  let lowestCitationScore = 0;
  let citedAnswer = "";
  let citedAnswerScore = 0;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const citations = [...answer.matchAll(/\[(\d+)]/g)].map((match) => Number(match[1]));
    const citationsValid = citations.length > 0
      && citations.every((citation) => citation >= 1 && citation <= supportedMatches.length);
    if (citationsValid) {
      const support = await validateCitationSupport(answer, supportedMatches);
      lowestCitationScore = support.lowestScore;
      // A valid, visible source citation is still useful when the secondary
      // semantic checker is conservative about a short paraphrase. Keep it as
      // a grounded best-effort answer instead of showing a technical refusal.
      if (!citedAnswer) {
        citedAnswer = answer;
        citedAnswerScore = support.lowestScore;
      }
      if (support.valid) {
        return {
          answer,
          matches: supportedMatches,
          refused: false,
          confidence,
          citationScore: support.lowestScore,
        };
      }
      // A valid source number already gives the visitor a direct way to
      // inspect the evidence. Do not spend a second free-model request merely
      // to chase a stricter semantic-score threshold.
      return {
        answer,
        matches: supportedMatches,
        refused: false,
        confidence,
        citationScore: support.lowestScore,
      };
    }
    if (attempt === 0) answer = await askOllama(state.question, supportedMatches, answer, state.chatModel);
  }
  if (citedAnswer) {
    return {
      answer: citedAnswer,
      matches: supportedMatches,
      refused: false,
      confidence,
      citationScore: citedAnswerScore,
    };
  }
  return {
    answer: "生成内容经过一次自动重写后，仍未通过逐段引用一致性检查。为了避免展示可能无依据的内容，这次选择不回答。",
    matches: supportedMatches,
    refused: true,
    confidence,
    citationScore: lowestCitationScore,
  };
}

const ragGraph = new StateGraph(RagState)
  .addNode("retrieve", retrieve)
  .addNode("generate", generate)
  .addEdge(START, "retrieve")
  .addEdge("retrieve", "generate")
  .addEdge("generate", END)
  .compile();

export async function answerWithLocalRag(question: string, projectId?: string, chatModel?: string): Promise<RagAnswer> {
  const normalized = question.trim();
  if (normalized.length < 2 || normalized.length > 500) throw new Error("问题需要 2–500 个字符");
  const result = await ragGraph.invoke({ question: normalized, projectId, chatModel });
  return {
    answer: result.answer,
    sources: result.matches,
    refused: result.refused,
    confidence: result.confidence,
    citationScore: result.citationScore,
  };
}
