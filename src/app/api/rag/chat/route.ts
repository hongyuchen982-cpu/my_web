import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { answerWithLocalRag } from "@/lib/rag";
import { prisma } from "@/lib/db";
import { availableChatModels } from "@/lib/chat-provider";
import { consumeRateLimit, feedbackToken, sameOrigin } from "@/lib/request-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function chatRateLimit() {
  const limit = Number(process.env.RAG_RATE_LIMIT ?? "60");
  return Number.isInteger(limit) && limit > 0 && limit <= 300 ? limit : 60;
}

function chatRateWindowSeconds() {
  const seconds = Number(process.env.RAG_RATE_WINDOW_SECONDS ?? "300");
  return Number.isInteger(seconds) && seconds >= 60 && seconds <= 3_600 ? seconds : 300;
}

const RequestSchema = z.object({
  question: z.string().trim().min(2).max(500),
  projectId: z.string().trim().min(1).max(100).optional(),
  model: z.string().trim().min(1).max(200).optional(),
});

export async function POST(request: NextRequest) {
  if (!sameOrigin(request.headers)) return NextResponse.json({ error: "请求来源无效" }, { status: 403 });
  try {
    const seconds = chatRateWindowSeconds();
    if (!await consumeRateLimit(request.headers, "chat", chatRateLimit(), seconds)) {
      return NextResponse.json({ error: "提问太频繁，请几分钟后再试。" }, { status: 429, headers: { "Retry-After": String(seconds) } });
    }
  } catch {
    return NextResponse.json({ error: "服务暂时不可用" }, { status: 503 });
  }

  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 4096) return NextResponse.json({ error: "请求过大" }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "请求内容不是有效的 JSON。" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "问题需要 2–500 个字符。" }, { status: 400 });
  }

  try {
    if (parsed.data.model && !(await availableChatModels()).some((model) => model.id === parsed.data.model)) {
      return NextResponse.json({ error: "该模型已下线或未启用，请刷新模型列表。" }, { status: 400 });
    }
    const result = await answerWithLocalRag(parsed.data.question, parsed.data.projectId, parsed.data.model);
    const sources = result.sources.map((source) => ({
      kind: source.kind,
      title: source.kind === "post" ? source.path : `${source.repository}/${source.path}`,
      url: source.githubUrl,
      score: Number(source.score.toFixed(3)),
    }));
    const interaction = await prisma.ragInteraction.create({
      data: {
        question: parsed.data.question,
        answer: result.answer,
        sources: JSON.stringify(sources),
        topScore: result.confidence,
        citationScore: result.citationScore,
        refused: result.refused,
      },
      select: { id: true },
    });
    return NextResponse.json({
      interactionId: interaction.id,
      feedbackToken: feedbackToken(interaction.id),
      answer: result.answer,
      sources,
      refused: result.refused,
      confidence: Number(result.confidence.toFixed(3)),
      citationScore: Number(result.citationScore.toFixed(3)),
    });
  } catch (error) {
    console.error("RAG chat failed:", error instanceof Error ? `${error.name}: ${error.message}` : "UnknownError");
    return NextResponse.json(
      { error: process.env.NODE_ENV === "production"
        ? "AI 助手暂时不可用，可能是模型限流、配置或知识库索引尚未就绪，请稍后重试。"
        : `本地调试：${error instanceof Error ? error.message : "未知错误"}` },
      { status: 503 }
    );
  }
}
