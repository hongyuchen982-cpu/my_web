/**
 * AI 多模型适配层 — 随意切换，OpenAI 兼容协议统一。
 *
 * 支持的 Provider（改 AI_PROVIDER 即可切换）：
 *   deepseek    — DeepSeek 官方，充 10 块用半年，极便宜
 *   siliconflow — 硅基流动，注册送 2000 万 tokens，Qwen/DeepSeek/Llama 全免费
 *   groq        — Groq Cloud，完全免费，速度极快，Llama/Mixtral
 *   gemini      — Google Gemini Flash，完全免费，每月 1500 次
 */

import https from "https";
import http from "http";

// ── Provider 配置表 ──
interface ProviderConfig {
  baseURL: string;
  apiKey: string | undefined;
  model: string;
  openaiCompat: boolean; // true = 标准 /v1/chat/completions 接口
}

function getConfig(): ProviderConfig {
  const provider = process.env.AI_PROVIDER || "siliconflow";
  const model = process.env.AI_MODEL || "";

  switch (provider) {
    case "deepseek":
      return {
        baseURL: "https://api.deepseek.com",
        apiKey: process.env.DEEPSEEK_API_KEY,
        model: model || "deepseek-chat",
        openaiCompat: true,
      };
    case "groq":
      return {
        baseURL: "https://api.groq.com/openai/v1",
        apiKey: process.env.GROQ_API_KEY,
        model: model || "llama-3.1-8b-instant",
        openaiCompat: true,
      };
    case "gemini":
      return {
        baseURL: "https://generativelanguage.googleapis.com/v1beta",
        apiKey: process.env.GEMINI_API_KEY,
        model: model || "gemini-2.0-flash",
        openaiCompat: false,
      };
    case "siliconflow":
    default:
      return {
        baseURL: "https://api.siliconflow.cn/v1",
        apiKey: process.env.SILICONFLOW_API_KEY,
        model: model || "Qwen/Qwen2.5-7B-Instruct",
        openaiCompat: true,
      };
  }
}

// ── 系统提示词 ──
const SITE_NAME = "Cheefrain 的技术博客";
const SYSTEM_PROMPT = `你是「${SITE_NAME}」的 AI 助手，名叫「小驰」。

你的知识完全来自站长（cheefrain）的技术博客文章和项目。你必须严格遵守以下规则：

1. 只使用下面"参考内容"中提供的信息来回答。不要使用你自己的训练数据。
2. 每当你引用某篇文章的内容，必须在引用处用 Markdown 链接指向原文，例如：「根据《JWT 认证实战》这篇文章的讲解……」
3. 如果参考内容不足以回答问题，直接说「我目前的知识库中还没有覆盖这个问题」，然后列出参考内容中最相关的文章标题和链接供用户自行查阅。不要编造。
4. 用中文回答，保持简洁、准确、友好。`;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// ── 原生 HTTPS 请求，绕过 Turbopack fetch 的中文编码 bug ──
function httpRequest(
  url: string,
  opts: { headers: Record<string, string>; body: string }
): Promise<{ status: number; body: ReadableStream<Uint8Array>; error?: string }> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const mod = u.protocol === "https:" ? https : http;
    const bodyBytes = Buffer.from(opts.body, "utf-8");
    const req = mod.request(
      u,
      {
        method: "POST",
        headers: { ...opts.headers, "Content-Length": String(bodyBytes.length) },
      },
      (res) => {
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            res.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
            res.on("end", () => controller.close());
            res.on("error", (e) => controller.error(e));
          },
        });
        if (res.statusCode && res.statusCode >= 400) {
          let data = "";
          res.on("data", (c: Buffer) => (data += c.toString()));
          res.on("end", () => resolve({ status: res.statusCode!, body: stream, error: data }));
        } else {
          resolve({ status: res.statusCode!, body: stream });
        }
      }
    );
    req.on("error", reject);
    req.write(bodyBytes);
    req.end();
  });
}

// ── OpenAI 兼容调用（siliconflow / deepseek / groq 通用） ──
async function callOpenAICompat(
  messages: ChatMessage[],
  _stream: true
): Promise<ReadableStream<Uint8Array>> {
  const cfg = getConfig();
  if (!cfg.apiKey) {
    throw new Error(
      `AI_PROVIDER=${process.env.AI_PROVIDER} 缺少 API Key，请检查环境变量`
    );
  }

  const json = JSON.stringify({
    model: cfg.model,
    messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 1200,
  });

  const result = await httpRequest(`${cfg.baseURL}/chat/completions`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: json,
  });

  if (result.status >= 400) {
    throw new Error(
      `${process.env.AI_PROVIDER} API ${result.status}: ${(result.error || "").slice(0, 200)}`
    );
  }

  return result.body;
}

// ── Gemini 调用（协议不同，需转换） ──
function buildGeminiBody(messages: ChatMessage[]) {
  const systemMsg = messages.find((m) => m.role === "system");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
  return {
    systemInstruction: systemMsg
      ? { parts: [{ text: systemMsg.content }] }
      : undefined,
    contents,
  };
}

function convertGeminiStream(
  body: ReadableStream<Uint8Array>
): ReadableStream<Uint8Array> {
  let buffer = "";
  const encoder = new TextEncoder();
  return body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += new TextDecoder().decode(chunk);
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6);
          if (json === "[DONE]") {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            continue;
          }
          try {
            const text =
              JSON.parse(json).candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`
                )
              );
            }
          } catch {
            /* skip */
          }
        }
      },
    })
  );
}

async function callGeminiStream(
  messages: ChatMessage[]
): Promise<ReadableStream<Uint8Array>> {
  const cfg = getConfig();
  if (!cfg.apiKey) throw new Error("GEMINI_API_KEY not set");

  const result = await httpRequest(
    `${cfg.baseURL}/models/${cfg.model}:streamGenerateContent?alt=sse&key=${cfg.apiKey}`,
    {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildGeminiBody(messages)),
    }
  );

  if (result.status >= 400) {
    throw new Error(`Gemini API ${result.status}: ${(result.error || "").slice(0, 200)}`);
  }

  return convertGeminiStream(result.body);
}

// ── 统一入口。provider / model 可选覆盖 .env 默认值 ──
export async function chat(
  userMessage: string,
  context: string,
  override?: { provider?: string; model?: string }
): Promise<ReadableStream<Uint8Array>> {
  // 临时覆盖环境变量
  if (override?.provider) process.env.AI_PROVIDER = override.provider;
  if (override?.model) process.env.AI_MODEL = override.model;

  const cfg = getConfig();
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `以下是网站的相关文章和项目内容供参考：\n\n${context}\n\n用户问题：${userMessage}`,
    },
  ];

  console.log(`[ai] provider=${process.env.AI_PROVIDER || "siliconflow"} model=${cfg.model}`);

  if (cfg.openaiCompat) {
    return await callOpenAICompat(messages, true);
  }
  return await callGeminiStream(messages);
}

/** 方便前端查询当前用的模型 */
export function getCurrentModel(): string {
  return getConfig().model;
}
