import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { consumeRateLimit, sameOrigin, validFeedbackToken } from "@/lib/request-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FeedbackSchema = z.object({
  interactionId: z.string().uuid(),
  token: z.string().length(64),
  feedback: z.enum(["positive", "negative"]),
  reason: z.enum([
    "off_topic",
    "irrelevant_sources",
    "incorrect",
    "outdated",
    "should_answer",
    "should_refuse",
  ]).optional(),
});

export async function PATCH(request: Request) {
  if (!sameOrigin(request.headers)) return NextResponse.json({ error: "请求来源无效" }, { status: 403 });
  try {
    if (!await consumeRateLimit(request.headers, "feedback", 30)) return NextResponse.json({ error: "反馈过于频繁" }, { status: 429 });
  } catch { return NextResponse.json({ error: "服务暂时不可用" }, { status: 503 }); }
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 4096) return NextResponse.json({ error: "请求过大" }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "请求内容无效。" }, { status: 400 });
  }
  const parsed = FeedbackSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "反馈参数无效。" }, { status: 400 });
  if (!validFeedbackToken(parsed.data.interactionId, parsed.data.token)) return NextResponse.json({ error: "反馈凭证无效" }, { status: 403 });

  const updated = await prisma.ragInteraction.updateMany({
    where: { id: parsed.data.interactionId },
    data: {
      feedback: parsed.data.feedback,
      feedbackReason: parsed.data.feedback === "negative" ? parsed.data.reason ?? null : null,
    },
  });
  if (updated.count === 0) return NextResponse.json({ error: "问答记录不存在。" }, { status: 404 });
  return NextResponse.json({ saved: true });
}
