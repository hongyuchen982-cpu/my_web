"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bot, ExternalLink, LoaderCircle, MessageCircle, RefreshCw, Send, Sparkles, ThumbsDown, ThumbsUp, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { usePathname } from "next/navigation";

interface ChatSource {
  kind: "project" | "post";
  title: string;
  url: string;
  score: number;
}

interface AssistantMessage {
  id: number;
  role: "assistant";
  text: string;
  sources?: ChatSource[];
  interactionId?: string;
  feedbackToken?: string;
  confidence?: number;
  citationScore?: number;
  refused?: boolean;
  feedback?: "positive" | "negative";
  feedbackReason?: string;
}

interface UserMessage {
  id: number;
  role: "user";
  text: string;
}

type Message = AssistantMessage | UserMessage;

const starters = [
  "这个网站用了哪些技术？",
  "Celery、MySQL 和 Redis 如何分工？",
  "介绍一下 workflowWithComfyUI 项目",
];

const feedbackReasons = [
  ["off_topic", "答非所问"],
  ["irrelevant_sources", "来源不相关"],
  ["incorrect", "内容不正确"],
  ["outdated", "内容已过期"],
  ["should_answer", "不该拒答"],
  ["should_refuse", "本应拒答"],
] as const;

export default function AiChatWidget() {
  const pathname = usePathname();
  const projectId = pathname.match(/^\/projects\/([^/]+)$/)?.[1];
  const [open, setOpen] = useState(false);
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [model, setModel] = useState("");
  const [modelStatus, setModelStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [modelReload, setModelReload] = useState(0);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    let active = true;
    const loadModels = async () => {
      setModelStatus("loading");
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const response = await fetch("/api/rag/models", {
            cache: "no-store",
            headers: { Accept: "application/json" },
            signal: controller.signal,
          });
          if (!response.ok) throw new Error(`模型接口返回 ${response.status}`);
          const data = await response.json() as { models?: { id: string; name: string }[] };
          if (!data.models?.length) throw new Error("模型列表为空");
          if (!active) return;
          setModels(data.models);
          setModel((current) => data.models!.some((item) => item.id === current) ? current : data.models![0].id);
          setModelStatus("ready");
          return;
        } catch (error) {
          if (controller.signal.aborted) return;
          if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
            continue;
          }
          console.error("[ai-chat-widget] failed to load models", error);
          if (active) setModelStatus("error");
        }
      }
    };
    void loadModels();
    return () => {
      active = false;
      controller.abort();
    };
  }, [open, modelReload]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedbackTarget, setFeedbackTarget] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "assistant",
      text: "你好，我是这个作品集的 AI 助手。你可以问我项目实现、技术栈或文章内容，我会附上实际检索来源。",
    },
  ]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function submit(rawQuestion: string) {
    const value = rawQuestion.trim();
    if (loading || value.length < 2) return;
    const userMessage: UserMessage = { id: Date.now(), role: "user", text: value };
    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const response = await fetch("/api/rag/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: value, ...(model ? { model } : {}), ...(projectId ? { projectId } : {}) }),
      });
      const payload = await response.json() as {
        answer?: string;
        sources?: ChatSource[];
        interactionId?: string;
        feedbackToken?: string;
        confidence?: number;
        citationScore?: number;
        refused?: boolean;
        error?: string;
      };
      if (!response.ok || !payload.answer) throw new Error(payload.error || "AI 助手没有返回答案");
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: payload.answer!,
          sources: payload.sources,
          interactionId: payload.interactionId,
          feedbackToken: payload.feedbackToken,
          confidence: payload.confidence,
          citationScore: payload.citationScore,
          refused: payload.refused,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: error instanceof Error ? error.message : "请求失败，请稍后再试。",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit(question);
  }

  async function sendFeedback(
    messageId: number,
    interactionId: string,
    feedback: "positive" | "negative",
    reason?: string
  ) {
    const response = await fetch("/api/rag/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interactionId, feedback, token: (messages.find((message) => message.id === messageId) as AssistantMessage)?.feedbackToken, ...(reason ? { reason } : {}) }),
    });
    if (!response.ok) return;
    setMessages((current) => current.map((message) =>
      message.id === messageId && message.role === "assistant"
        ? { ...message, feedback, feedbackReason: reason }
        : message
    ));
    setFeedbackTarget(null);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 sm:bottom-7 sm:right-7">
      {open && (
        <section
          aria-label="作品集 AI 助手"
          className="mb-3 flex h-[min(70vh,620px)] w-[calc(100vw-2.5rem)] max-w-[420px] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl shadow-black/15"
        >
          <header className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-[var(--color-accent-glow)] text-[var(--color-accent)]">
                <Bot size={19} />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-fg)]">作品集 AI 助手</h2>
                <p className="mt-0.5 flex items-center gap-1 text-[10px] font-mono text-[var(--color-fg-muted)]">
                  <Sparkles size={10} /> 知识库问答 · {projectId ? "当前项目" : "全部知识库"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="关闭 AI 助手"
              className="rounded-lg p-2 text-[var(--color-fg-muted)] transition hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-fg)]"
            >
              <X size={18} />
            </button>
          </header>
          <div className="border-b border-[var(--color-border)] px-4 py-2">
            <label htmlFor="chat-model" className="text-xs text-[var(--color-fg-muted)]">优先模型</label>
            <select id="chat-model" value={model} disabled={loading || modelStatus !== "ready"} onChange={(event) => setModel(event.target.value)} className="mt-1 w-full rounded border border-[var(--color-border)] bg-[var(--color-bg)] p-2 text-xs text-[var(--color-fg)]">
              {modelStatus === "loading" && <option value="">正在加载可用模型…</option>}
              {modelStatus === "error" && <option value="">模型列表加载失败</option>}
              {modelStatus === "idle" && <option value="">打开后加载模型</option>}
              {models.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-[var(--color-fg-muted)]">
              <p>云端回答会向模型服务发送问题和相关资料；免费服务可能限流。</p>
              {modelStatus === "error" && (
                <button
                  type="button"
                  onClick={() => setModelReload((current) => current + 1)}
                  className="flex shrink-0 items-center gap-1 text-[var(--color-accent)] hover:underline"
                >
                  <RefreshCw size={10} /> 重新加载
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={message.role === "user" ? "ml-10" : "mr-5"}>
                <div
                  className={message.role === "user"
                    ? "rounded-2xl rounded-br-sm bg-[var(--color-accent)] px-3.5 py-2.5 text-sm leading-6 text-white"
                    : "rounded-2xl rounded-bl-sm border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm leading-6 text-[var(--color-fg)]"}
                >
                  {message.role === "assistant" ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="whitespace-pre-wrap [&:not(:last-child)]:mb-2">{children}</p>,
                        ol: ({ children }) => <ol className="ml-4 list-decimal space-y-1">{children}</ol>,
                        ul: ({ children }) => <ul className="ml-4 list-disc space-y-1">{children}</ul>,
                        strong: ({ children }) => <strong className="font-semibold text-[var(--color-fg)]">{children}</strong>,
                        code: ({ children }) => <code className="rounded bg-[var(--color-surface-hover)] px-1 py-0.5 font-mono text-xs">{children}</code>,
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  )}
                </div>
                {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-fg-muted)]">
                      {message.refused ? "相关候选来源（未作为回答依据）" : "检索来源"}
                    </p>
                    {message.sources.map((source, index) => {
                      const external = source.url.startsWith("http");
                      return (
                        <a
                          key={`${source.url}-${index}`}
                          href={source.url}
                          target={external ? "_blank" : undefined}
                          rel={external ? "noreferrer" : undefined}
                          className="flex items-center justify-between gap-2 rounded-lg border border-[var(--color-border)] px-2.5 py-2 text-[11px] text-[var(--color-fg-dim)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                        >
                          <span className="min-w-0 truncate">[{index + 1}] {source.title}</span>
                          <span className="flex shrink-0 items-center gap-1 font-mono text-[10px]">
                            {source.score.toFixed(3)} <ExternalLink size={10} />
                          </span>
                        </a>
                      );
                    })}
                  </div>
                )}
                {message.role === "assistant" && message.interactionId && (
                  <div className="mt-2 flex items-center justify-between gap-3 px-1 text-[10px] text-[var(--color-fg-muted)]">
                    <span className="font-mono">
                      {message.refused
                        ? "已安全拒答"
                        : `检索 ${message.confidence?.toFixed(3) ?? "—"} · 引用 ${message.citationScore?.toFixed(3) ?? "—"}`}
                    </span>
                    <span className="flex items-center gap-1" aria-label="回答反馈">
                      <button
                        type="button"
                        onClick={() => void sendFeedback(message.id, message.interactionId!, "positive")}
                        aria-label="这个回答有帮助"
                        className={`rounded p-1.5 transition hover:text-emerald-500 ${message.feedback === "positive" ? "bg-emerald-500/10 text-emerald-500" : ""}`}
                      >
                        <ThumbsUp size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeedbackTarget((current) => current === message.id ? null : message.id)}
                        aria-label="这个回答没有帮助"
                        className={`rounded p-1.5 transition hover:text-red-500 ${message.feedback === "negative" ? "bg-red-500/10 text-red-500" : ""}`}
                      >
                        <ThumbsDown size={12} />
                      </button>
                    </span>
                  </div>
                )}
                {message.role === "assistant" && message.interactionId && feedbackTarget === message.id && (
                  <div className="mt-2 flex flex-wrap gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-2">
                    <p className="w-full text-[10px] text-[var(--color-fg-muted)]">这条回答哪里有问题？</p>
                    {feedbackReasons.map(([reason, label]) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => void sendFeedback(message.id, message.interactionId!, "negative", reason)}
                        className="rounded-full border border-[var(--color-border)] px-2 py-1 text-[10px] text-[var(--color-fg-dim)] transition hover:border-red-500 hover:text-red-500"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="mr-5 flex items-center gap-2 rounded-2xl rounded-bl-sm border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-3 text-xs text-[var(--color-fg-muted)]">
                <LoaderCircle size={14} className="animate-spin" /> 正在检索项目与文章…
              </div>
            )}
            <div ref={endRef} />
          </div>

          {messages.length === 1 && (
            <div className="flex gap-2 overflow-x-auto border-t border-[var(--color-border)] px-4 py-2.5">
              {starters.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => void submit(starter)}
                  className="shrink-0 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-[10px] text-[var(--color-fg-dim)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                >
                  {starter}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-[var(--color-border)] p-3">
            <label htmlFor="rag-question" className="sr-only">向作品集 AI 助手提问</label>
            <input
              id="rag-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={500}
              disabled={loading}
              placeholder="问项目、技术栈或文章…"
              className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-fg)] outline-none transition placeholder:text-[var(--color-fg-muted)] focus:border-[var(--color-accent)]"
            />
            <button
              type="submit"
              disabled={loading || question.trim().length < 2}
              aria-label="发送问题"
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--color-accent)] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? <LoaderCircle size={17} className="animate-spin" /> : <Send size={17} />}
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "关闭作品集 AI 助手" : "打开作品集 AI 助手"}
        aria-expanded={open}
        className="ml-auto grid size-14 place-items-center rounded-2xl bg-[var(--color-accent)] text-white shadow-lg shadow-cyan-900/20 transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
      >
        {open ? <X size={23} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
