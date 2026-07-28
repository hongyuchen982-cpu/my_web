"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Loader2, ChevronDown } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; url: string; type: string }[];
}

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  free: boolean;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "你好！我是小驰 🐶\n\n我是这个网站的 AI 助手，你可以问我关于站长的文章、项目、技术栈等问题。\n\n比如：\n- 「这个网站用了哪些技术？」\n- 「关于 JWT 认证的文章有哪些？」\n- 「有什么 Python 相关的文章？」",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [showModelList, setShowModelList] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 拉取可用模型列表
  useEffect(() => {
    fetch("/api/chat/models")
      .then((r) => r.json())
      .then((d) => {
        setModels(d.models || []);
        if (d.default) setSelectedModel(d.default);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const defaultModel = models[0]?.id || "";
  const currentModelName = models.find((m) => m.id === selectedModel)?.name || "自动";

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // 仅当用户手动选了不同模型时才传 override，否则走 .env 默认
      const body: Record<string, string> = { message: text };
      if (selectedModel && selectedModel !== defaultModel) {
        const [provider, model] = selectedModel.split(":", 2);
        body.provider = provider;
        body.model = model;
      }
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `❌ ${err.error || "请求失败"}` },
        ]);
        setLoading(false);
        return;
      }

      const sourcesHeader = res.headers.get("X-Search-Results");
      const sources = sourcesHeader ? JSON.parse(sourcesHeader) : [];

      // 流式读取
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "", sources }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6);
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              full += delta;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = {
                  ...next[next.length - 1],
                  content: full,
                };
                return next;
              });
            }
          } catch {
            // skip incomplete chunks
          }
        }
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ 网络错误，请稍后重试。" },
      ]);
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [input, loading]);

  return (
    <>
      {/* 浮动按钮 */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-[110] w-12 h-12 rounded-full bg-[var(--color-accent)] text-white shadow-lg hover:opacity-90 transition-all flex items-center justify-center animate-pulse"
        aria-label="AI 助手"
        title="AI 助手 — 基于站内文章和项目回答问题"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>

      {/* 聊天窗口 */}
      {open && (
        <div className="fixed bottom-20 right-5 z-[110] w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-7rem)] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* 头部 */}
          <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center gap-2 shrink-0">
            <span className="text-lg">🐶</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[var(--color-fg)]">小驰 AI</div>
              <div className="relative">
                <button
                  onClick={() => setShowModelList(!showModelList)}
                  className="text-[10px] text-[var(--color-fg-muted)] font-mono hover:text-[var(--color-accent)] flex items-center gap-0.5"
                >
                  {currentModelName} <ChevronDown className="w-3 h-3" />
                </button>
                {showModelList && (
                  <div className="absolute top-full left-0 mt-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg shadow-lg z-50 min-w-[180px] py-1">
                    {models.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => { setSelectedModel(m.id); setShowModelList(false); }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-[var(--color-surface)] flex items-center justify-between ${m.id === selectedModel ? "text-[var(--color-accent)]" : "text-[var(--color-fg)]"}`}
                      >
                        <span>{m.name}</span>
                        {m.free && <span className="text-[9px] text-green-500">免费</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-[var(--color-surface)] text-[var(--color-fg)] border border-[var(--color-border)]"
                  }`}
                >
                  {msg.content || (loading && i === messages.length - 1 ? "…" : "")}

                  {/* 引用来源 */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[var(--color-border)]">
                      <div className="text-[10px] text-[var(--color-fg-muted)] font-mono mb-1">
                        参考来源：
                      </div>
                      {msg.sources.map((s, j) => (
                        <a
                          key={j}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-[11px] text-[var(--color-accent)] hover:underline truncate font-mono"
                        >
                          {s.type === "post" ? "📄" : "📦"} {s.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* 输入区 */}
          <div className="p-3 border-t border-[var(--color-border)] flex gap-2 shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="问任何关于本站的问题…"
              className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-muted)] focus:outline-none focus:border-[var(--color-accent)] font-mono"
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="px-3 py-2 rounded-lg bg-[var(--color-accent)] text-white disabled:opacity-40 transition-opacity"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
