import { NextRequest, NextResponse } from "next/server";
import { searchRelevant } from "@/lib/search";
import { chat } from "@/lib/ai";
import { checkAIPermission, incrementAICallCount } from "@/lib/ai-permission";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // ── 1. 权限校验 ──
  const perm = await checkAIPermission();
  if (!perm.allowed) {
    return NextResponse.json(
      { error: perm.message },
      { status: perm.status }
    );
  }

  // ── 2. 解析消息（可选 model override） ──
  let message: string;
  let modelOverride: { provider?: string; model?: string } | undefined;
  try {
    const body = await req.json();
    message = body.message;
    if (body.provider || body.model) {
      modelOverride = { provider: body.provider, model: body.model };
    }
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "消息不能为空" }, { status: 400 });
  }

  // ── 3. RAG 检索 ──
  const { context, results } = await searchRelevant(message.trim());
  const contextWithFallback =
    results.length > 0
      ? context
      : "未找到与用户问题直接匹配的文章。请友好地告诉用户当前知识库可能不涵盖此问题，建议他们浏览网站文章和项目页面。";

  // ── 4. 调用 AI（流式返回） ──
  try {
    const stream = await chat(message.trim(), contextWithFallback, modelOverride);
    const userId = perm.userId; // TypeScript: 走到这里必定有 userId

    // 异步递增次数（不阻塞响应）
    incrementAICallCount(userId).catch((e) =>
      console.error("[chat] increment count failed:", e)
    );

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Remaining": String(perm.remaining),
        "X-Search-Results": JSON.stringify(
          results.map((r) => ({ title: r.title, url: r.url, type: r.type }))
        ),
      },
    });
  } catch (error) {
    const msg = (error as Error).message;
    console.error("[chat] AI error:", msg);
    return NextResponse.json(
      {
        error: msg.includes("balance") ? "AI 免费额度已用完，请切换 Provider 或充值" : `AI 调用失败：${msg}`,
        detail: msg,
      },
      { status: 502 }
    );
  }
}
