import test from "node:test";
import assert from "node:assert/strict";
import { filterFreeModels, requestChat } from "../src/lib/chat-provider";

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
