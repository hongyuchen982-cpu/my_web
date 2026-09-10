import test from "node:test";
import assert from "node:assert/strict";
import { filterFreeModels, requestChat } from "../src/lib/chat-provider";
import { directTextMatchScore, keywordMatchScore, titleMatchScore } from "../src/lib/knowledge-index";

test("mixed Chinese and English questions can directly match article titles", () => {
  assert.equal(titleMatchScore("agent等于rag吗？说说为什么", "Agent Memory 不等于 RAG：从知识检索到持续认知状态"), 0.98);
  assert.equal(titleMatchScore("数据库与 AI 云端部署问题复盘", "本地能跑，上线却不工作：数据库与 AI 云端部署问题复盘"), 1);
  assert.equal(titleMatchScore("晚饭吃什么", "Agent Memory 不等于 RAG"), 0);
  assert.equal(directTextMatchScore("为什么 agent 需要记忆", "## 二、为什么 Agent 需要记忆"), 0.99);
  assert.equal(directTextMatchScore("晚饭吃什么", "## 二、为什么 Agent 需要记忆"), 0);
  assert.equal(keywordMatchScore("agent memory 有哪些？怎么做？", "Agent Memory 维护持续变化的认知状态。"), 0.98);
  assert.equal(keywordMatchScore("agent memory 有哪些？怎么做？", "Redis 用于缓存。"), 0);
  assert.equal(keywordMatchScore("i乱改代码怎么解决？说一个就行了", "AI 总乱改代码？用规则文件固定项目上下文"), 0.97);
});

test("free catalog rejects paid, unknown pricing and non-text models", () => {
  const base = { id: "test/model:free", pricing: { prompt: "0", completion: "0" }, architecture: { output_modalities: ["text"] } };
  assert.equal(filterFreeModels([base]).length, 1);
  assert.equal(filterFreeModels([{ ...base, pricing: { prompt: "1", completion: "0" } }, { ...base, id: "paid" }, { ...base, pricing: undefined }, { ...base, architecture: { output_modalities: ["image"] } }]).length, 0);
});

test("cloud chat validates selection, protects key and falls back only to free router", async () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };
  process.env.CHAT_PROVIDER = "openrouter";
  process.env.OPENROUTER_API_KEY = "test-key";
  delete process.env.CHAT_MODEL;
  const calls: string[] = [];
  globalThis.fetch = async (url, init) => {
    if (String(url).endsWith("/models")) return Response.json({ data: [{ id: "test/model:free", pricing: { prompt: "0", completion: "0" }, architecture: { output_modalities: ["text"] } }] });
    const payload = JSON.parse(String(init?.body));
    calls.push(payload.model);
    assert.equal(payload.provider.max_price.prompt, 0);
    assert.equal(payload.provider.max_price.completion, 0);
    assert.ok(!String(init?.body).includes("test-key"));
    if (payload.model === "test/model:free") return new Response("limited", { status: 429 });
    return Response.json({ choices: [{ message: { content: '{"claims":[{"text":"test","citations":[1]}]}' } }] });
  };
  try {
    await assert.rejects(requestChat([], {}, "paid-model"));
    assert.deepEqual(calls, []);
    assert.ok((await requestChat([], {}, "test/model:free")).includes("claims"));
    assert.deepEqual(calls, ["test/model:free", "openrouter/free"]);
    calls.length = 0;
    globalThis.fetch = async () => new Response("unauthorized", { status: 401 });
    await assert.rejects(requestChat([], {}, "test/model:free"), /CHAT_FATAL_401/);
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key];
    Object.assign(process.env, originalEnv);
  }
});

test("automatic free routing tries another free model after the router is saturated", async () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };
  process.env.CHAT_PROVIDER = "openrouter";
  process.env.OPENROUTER_API_KEY = "test-key";
  const calls: string[] = [];
  globalThis.fetch = async (url, init) => {
    if (String(url).endsWith("/models")) return Response.json({ data: [{ id: "test/model:free", pricing: { prompt: "0", completion: "0" }, architecture: { output_modalities: ["text"] } }] });
    const payload = JSON.parse(String(init?.body));
    calls.push(payload.model);
    if (payload.model === "openrouter/free") return new Response("limited", { status: 429 });
    return Response.json({ choices: [{ message: { content: "{}" } }] });
  };
  try {
    assert.equal(await requestChat([], {}, "openrouter/free"), "{}");
    assert.deepEqual(calls, ["openrouter/free", "test/model:free"]);
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key];
    Object.assign(process.env, originalEnv);
  }
});

test("DeepSeek Flash is selectable alongside the existing free-model pool", async () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };
  process.env.CHAT_PROVIDER = "openrouter";
  process.env.OPENROUTER_API_KEY = "router-key";
  process.env.DEEPSEEK_API_KEY = "deepseek-key";
  globalThis.fetch = async (url, init) => {
    if (String(url).endsWith("/models")) return Response.json({ data: [] });
    assert.equal(String(url), "https://api.deepseek.com/chat/completions");
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer deepseek-key");
    assert.equal(JSON.parse(String(init?.body)).model, "deepseek-v4-flash");
    return Response.json({ choices: [{ message: { content: "{}" } }] });
  };
  try {
    const { availableChatModels } = await import("../src/lib/chat-provider");
    assert.ok((await availableChatModels()).some((model) => model.id === "openrouter/free"));
    assert.ok((await availableChatModels()).some((model) => model.id === "deepseek-v4-flash"));
    assert.equal(await requestChat([], {}, "deepseek-v4-flash"), "{}");
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key];
    Object.assign(process.env, originalEnv);
  }
});
