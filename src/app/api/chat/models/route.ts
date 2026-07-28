/**
 * GET /api/chat/models — 返回当前可用的模型列表。
 * 只列出已配置 API Key 的 Provider，默认模型跟随 .env 的 AI_PROVIDER。
 */
import { NextResponse } from "next/server";

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  free: boolean;
}

export async function GET() {
  const active = process.env.AI_PROVIDER || "deepseek";
  const all: ModelInfo[] = [];

  // DeepSeek 官方
  if (process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY.length > 10) {
    all.push(
      { id: "deepseek:deepseek-chat", name: "DeepSeek V3", provider: "deepseek", free: false },
    );
  }

  // 硅基流动
  if (process.env.SILICONFLOW_API_KEY && process.env.SILICONFLOW_API_KEY.length > 10) {
    all.push(
      { id: "siliconflow:Qwen/Qwen2.5-7B-Instruct", name: "Qwen 2.5 7B", provider: "siliconflow", free: true },
      { id: "siliconflow:deepseek-ai/DeepSeek-V3", name: "DeepSeek V3 (硅基)", provider: "siliconflow", free: false },
      { id: "siliconflow:Qwen/Qwen3.6-35B-A3B", name: "Qwen 3.6 35B", provider: "siliconflow", free: false },
    );
  }

  // Groq
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.length > 10) {
    all.push(
      { id: "groq:llama-3.1-8b-instant", name: "Llama 3.1 8B", provider: "groq", free: true },
    );
  }

  // Gemini
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10) {
    all.push(
      { id: "gemini:gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "gemini", free: true },
    );
  }

  // 把当前 provider 的模型排最前
  const primary = all.filter((m) => m.provider === active);
  const rest = all.filter((m) => m.provider !== active);
  const models = [...primary, ...rest];

  return NextResponse.json({ models, default: models[0]?.id || "" });
}
