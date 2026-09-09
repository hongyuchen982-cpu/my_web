import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { getRagMinScore } from "@/lib/rag";
import { addRagEvaluationCaseAction } from "@/app/admin/actions";
import AdminSubmitButton from "@/components/admin-submit-button";

export const metadata: Metadata = {
  title: "RAG 质量与反馈",
  robots: { index: false, follow: false },
};

interface StoredSource {
  title: string;
  url: string;
  score: number;
}

const feedbackReasonLabels: Record<string, string> = {
  off_topic: "答非所问",
  irrelevant_sources: "来源不相关",
  incorrect: "内容不正确",
  outdated: "内容已过期",
  should_answer: "不该拒答",
  should_refuse: "本应拒答",
};

function sourcesFrom(value: string): StoredSource[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is StoredSource => (
      typeof item === "object" && item !== null && "title" in item && "url" in item && "score" in item
    )) : [];
  } catch {
    return [];
  }
}

export default async function RagQualityPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await requireAdmin();
  const { filter } = await searchParams;
  const where = filter === "negative"
    ? { feedback: "negative" }
    : filter === "refused"
      ? { refused: true }
      : {};
  const [total, positive, negative, refused, interactions, evaluationCount] = await Promise.all([
    prisma.ragInteraction.count(),
    prisma.ragInteraction.count({ where: { feedback: "positive" } }),
    prisma.ragInteraction.count({ where: { feedback: "negative" } }),
    prisma.ragInteraction.count({ where: { refused: true } }),
    prisma.ragInteraction.findMany({ where, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.ragEvaluationCase.count({ where: { enabled: true } }),
  ]);

  return (
    <div className="space-y-8">
      <header className="border-b border-[var(--color-border)] pb-6">
        <Link href="/admin/projects" className="text-xs font-mono text-[var(--color-fg-muted)] hover:text-[var(--color-accent)]">← 返回项目管理</Link>
        <p className="mb-2 mt-6 text-xs font-mono text-[var(--color-accent)]">{"// RAG QUALITY"}</p>
        <h1 className="text-2xl font-bold">问答质量与用户反馈</h1>
        <p className="mt-2 max-w-3xl text-xs leading-6 text-[var(--color-fg-muted)]">
          当前拒答阈值为 {getRagMinScore().toFixed(2)}。分数低于阈值时不会调用聊天模型生成事实答案；赞踩结果用于发现失败问题，不代表自动修改知识库。
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["全部问答", total, "/admin/rag"],
          ["有帮助", positive, "/admin/rag"],
          ["没有帮助", negative, "/admin/rag?filter=negative"],
          ["安全拒答", refused, "/admin/rag?filter=refused"],
        ].map(([label, value, href]) => (
          <Link key={String(label)} href={String(href)} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition hover:border-[var(--color-accent)]">
            <span className="text-[10px] font-mono text-[var(--color-fg-muted)]">{label}</span>
            <strong className="mt-2 block text-2xl text-[var(--color-fg)]">{value}</strong>
          </Link>
        ))}
      </section>

      <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-xs text-[var(--color-fg-muted)]">
        当前已有 <strong className="text-[var(--color-fg)]">{evaluationCount}</strong> 条后台评测案例；运行 <code className="font-mono text-[var(--color-accent)]">npm run rag:evaluate</code> 会与内置案例一起执行。
      </p>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">最近记录</h2>
            <p className="mt-1 text-xs text-[var(--color-fg-muted)]">优先检查低分回答和用户差评，再把它们加入固定评测集。</p>
          </div>
          {filter && <Link href="/admin/rag" className="text-xs text-[var(--color-accent)] hover:underline">清除筛选</Link>}
        </div>
        <div className="space-y-3">
          {interactions.map((interaction) => {
            const sources = sourcesFrom(interaction.sources);
            return (
              <article key={interaction.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-[var(--color-fg-muted)]">
                  <time>{interaction.createdAt.toLocaleString("zh-CN")}</time>
                  <span>· TOP {interaction.topScore.toFixed(3)}</span>
                  {interaction.refused && <span className="rounded bg-amber-500/10 px-2 py-0.5 text-amber-600">拒答</span>}
                  {interaction.feedback === "positive" && <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-600">有帮助</span>}
                  {interaction.feedback === "negative" && <span className="rounded bg-red-500/10 px-2 py-0.5 text-red-500">没有帮助</span>}
                  {interaction.feedbackReason && <span>· {feedbackReasonLabels[interaction.feedbackReason] ?? interaction.feedbackReason}</span>}
                  {!interaction.refused && <span>· 引用 {interaction.citationScore.toFixed(3)}</span>}
                </div>
                <h3 className="mt-3 text-sm font-semibold text-[var(--color-fg)]">{interaction.question}</h3>
                <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs leading-5 text-[var(--color-fg-dim)]">{interaction.answer}</p>
                {sources.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {sources.slice(0, 3).map((source, index) => (
                      <a key={`${source.url}-${index}`} href={source.url} target={source.url.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="max-w-full truncate rounded border border-[var(--color-border)] px-2 py-1 text-[10px] text-[var(--color-fg-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]">
                        [{index + 1}] {source.title} · {source.score.toFixed(3)}
                      </a>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-3">
                  <form action={addRagEvaluationCaseAction}>
                    <input type="hidden" name="interactionId" value={interaction.id} />
                    <input type="hidden" name="expectedMode" value="answer" />
                    <AdminSubmitButton pendingText="加入中…" className="rounded border border-[var(--color-border)] px-2 py-1 text-[10px] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]">
                      加入“应该回答”评测
                    </AdminSubmitButton>
                  </form>
                  <form action={addRagEvaluationCaseAction}>
                    <input type="hidden" name="interactionId" value={interaction.id} />
                    <input type="hidden" name="expectedMode" value="refuse" />
                    <AdminSubmitButton pendingText="加入中…" className="rounded border border-[var(--color-border)] px-2 py-1 text-[10px] hover:border-amber-500 hover:text-amber-600">
                      加入“应该拒答”评测
                    </AdminSubmitButton>
                  </form>
                </div>
              </article>
            );
          })}
          {interactions.length === 0 && <p className="rounded-xl border border-dashed border-[var(--color-border)] py-12 text-center text-xs text-[var(--color-fg-muted)]">还没有符合条件的问答记录。</p>}
        </div>
      </section>
    </div>
  );
}
