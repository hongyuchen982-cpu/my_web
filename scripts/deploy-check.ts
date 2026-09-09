import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  const missing: string[] = [];
  if ((process.env.ADMIN_PASSWORD?.length || 0) < 16) missing.push("ADMIN_PASSWORD 至少 16 字符");
  if ((process.env.ADMIN_SESSION_SECRET?.length || 0) < 32) missing.push("ADMIN_SESSION_SECRET 至少 32 字符");
  if (!process.env.DATABASE_URL?.startsWith("file:/")) missing.push("DATABASE_URL 需要持久化绝对路径");
  const provider = process.env.CHAT_PROVIDER;
  if (provider === "openrouter") { if (!process.env.OPENROUTER_API_KEY) missing.push("OPENROUTER_API_KEY"); }
  else if (provider === "siliconflow" || provider === "compatible") {
    if (!process.env.CHAT_API_KEY || !process.env.CHAT_ALLOWED_MODELS) missing.push("CHAT_API_KEY / CHAT_ALLOWED_MODELS");
    if (provider === "compatible" && !process.env.CHAT_BASE_URL?.startsWith("https://")) missing.push("CHAT_BASE_URL HTTPS");
  } else missing.push("公网 CHAT_PROVIDER 应选择 openrouter / siliconflow / compatible");
  if (process.env.EMBEDDING_PROVIDER !== "openai-compatible" || !process.env.EMBEDDING_API_KEY || !process.env.EMBEDDING_MODEL) missing.push("云端 Embedding 配置");
  if (!process.env.EMBEDDING_BASE_URL?.startsWith("https://")) missing.push("EMBEDDING_BASE_URL HTTPS");
  const { prisma } = await import("../src/lib/db");
  try {
    await prisma.rateBucket.count();
    await prisma.knowledgeJob.count();
    const projects = await prisma.project.count();
    const posts = await prisma.post.count({ where: { published: true } });
    const model = process.env.EMBEDDING_MODEL || "";
    const vectors = await prisma.knowledgeChunk.count({ where: { embeddingModel: model, embedding: { not: "" } } }) + await prisma.postKnowledgeChunk.count({ where: { embeddingModel: model, embedding: { not: "" } } });
    console.log(`数据库：${projects} 项目 / ${posts} 已发布文章 / ${vectors} 当前模型向量`);
    if (!vectors) missing.push("当前 Embedding 模型没有向量，请重建索引");
  } catch { missing.push("数据库未就绪或尚未升级表结构"); }
  finally { await prisma.$disconnect(); }
  if (missing.length) {
    console.log("尚需完成（不显示密钥）：\n" + missing.map((item) => `- ${item}`).join("\n"));
    process.exitCode = 1;
  } else console.log("静态上线检查通过；仍需真实问答、HTTPS 和恢复演练。");
}
main().catch(() => { console.error("配置检查失败"); process.exitCode = 1; });
