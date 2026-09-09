import { availableChatModels, providerName } from "@/lib/chat-provider";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return Response.json({ provider: providerName(), models: await availableChatModels() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ models: [], error: "模型列表暂时不可用" }, { status: 503 });
  }
}
