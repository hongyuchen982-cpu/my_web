import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "知识库文件",
  robots: { index: false, follow: false },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default async function KnowledgeFilesPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const source = await prisma.knowledgeSource.findUnique({
    where: { projectId: id },
    include: {
      project: { select: { title: true } },
      files: { orderBy: { path: "asc" } },
    },
  });
  if (!source) notFound();

  return (
    <div className="space-y-8">
      <header className="border-b border-[var(--color-border)] pb-6">
        <Link href="/admin/projects" className="text-xs font-mono text-[var(--color-fg-muted)] hover:text-[var(--color-accent)]">← 返回项目管理</Link>
        <p className="mb-2 mt-6 text-xs font-mono text-[var(--color-accent)]">{"// KNOWLEDGE SOURCE"}</p>
        <h1 className="text-2xl font-bold">{source.project.title}</h1>
        <div className="mt-4 grid gap-3 text-xs text-[var(--color-fg-muted)] sm:grid-cols-2 lg:grid-cols-5">
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-3"><span className="block text-[10px] font-mono">REPOSITORY</span><strong className="mt-1 block text-[var(--color-fg)]">{source.repository}</strong></div>
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-3"><span className="block text-[10px] font-mono">BRANCH</span><strong className="mt-1 block text-[var(--color-fg)]">{source.defaultBranch || "—"}</strong></div>
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-3"><span className="block text-[10px] font-mono">COMMIT</span><strong className="mt-1 block font-mono text-[var(--color-fg)]">{source.lastCommitSha.slice(0, 12) || "—"}</strong></div>
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-3"><span className="block text-[10px] font-mono">FILES</span><strong className="mt-1 block text-[var(--color-fg)]">{source.fileCount}</strong></div>
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-3"><span className="block text-[10px] font-mono">CHUNKS</span><strong className="mt-1 block text-[var(--color-fg)]">{source.chunkCount}{source.embeddingModel ? ` · ${source.embeddingModel}` : ""}</strong></div>
        </div>
      </header>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">已收录文件</h2>
            <p className="mt-1 text-xs text-[var(--color-fg-muted)]">这里只展示通过安全规则并已保存的文本与代码文件。</p>
          </div>
          {source.lastSyncedAt && <time className="text-xs font-mono text-[var(--color-fg-muted)]">{source.lastSyncedAt.toLocaleString("zh-CN")}</time>}
        </div>

        <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          {source.files.map((file) => (
            <a key={file.id} href={file.githubUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 border-b border-[var(--color-border)] px-4 py-3 last:border-b-0 hover:bg-[var(--color-surface-hover)]">
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-[var(--color-fg-dim)] group-hover:text-[var(--color-accent)]">{file.path}</span>
              <span className="hidden shrink-0 text-[10px] font-mono text-[var(--color-fg-muted)] sm:block">{file.language}</span>
              <span className="w-16 shrink-0 text-right text-[10px] font-mono text-[var(--color-fg-muted)]">{formatBytes(file.size)}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[var(--color-fg-muted)]" />
            </a>
          ))}
          {source.files.length === 0 && <p className="py-12 text-center text-xs text-[var(--color-fg-muted)]">尚未同步文件。</p>}
        </div>
      </section>
    </div>
  );
}
