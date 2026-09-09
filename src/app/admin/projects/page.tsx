import type { Metadata } from "next";
import Link from "next/link";
import { addGitHubProjectAction, logoutAction } from "@/app/admin/actions";
import AdminSubmitButton from "@/components/admin-submit-button";
import DeleteProjectButton from "@/components/delete-project-button";
import KnowledgeControls from "@/components/knowledge-controls";
import ProjectAdminForm from "@/components/project-admin-form";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { fetchGitHubRepos, normalizeGitHubUrl } from "@/lib/github";
import { getProjects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "精选项目管理",
  robots: { index: false, follow: false },
};

const knowledgeStatus: Record<string, string> = {
  pending: "等待同步",
  syncing: "同步中",
  ready: "已就绪",
  failed: "同步失败",
  disabled: "已停用",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ changed?: string; knowledge?: string; index?: string }>;
}) {
  await requireAdmin();
  const [projects, githubRepos, sources, query] = await Promise.all([
    getProjects(),
    fetchGitHubRepos(),
    prisma.knowledgeSource.findMany(),
    searchParams,
  ]);
  const selectedUrls = new Set(projects.map((project) => normalizeGitHubUrl(project.github)).filter(Boolean));
  const sourceByProject = new Map(sources.map((source) => [source.projectId, source]));
  const jobs = await prisma.knowledgeJob.findMany({ orderBy: { updatedAt: "desc" }, take: 20 });

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-border)] pb-6">
        <div>
          <p className="mb-2 text-xs font-mono text-[var(--color-accent)]">{"// PORTFOLIO CONTROL"}</p>
          <h1 className="text-xl font-semibold">精选项目管理</h1>
          <p className="mt-2 text-xs text-[var(--color-fg-muted)]">公开页面只展示这里保存的项目。</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/rag" className="rounded-md border border-[var(--color-border)] px-3 py-2 text-xs hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]">
            RAG 质量
          </Link>
          <Link href="/projects" className="rounded-md border border-[var(--color-border)] px-3 py-2 text-xs hover:border-[var(--color-accent)]">
            查看公开页面
          </Link>
          <form action={logoutAction}>
            <AdminSubmitButton className="rounded-md border border-[var(--color-border)] px-3 py-2 text-xs hover:border-red-500 hover:text-red-500">
              退出
            </AdminSubmitButton>
          </form>
        </div>
      </header>
      <section className="rounded-xl border border-[var(--color-border)] p-4">
        <h2 className="text-sm font-semibold">后台知识库任务</h2>
        <p className="mt-2 text-xs text-[var(--color-fg-muted)]">提交后由 Worker 执行，刷新页面查看进度。若一直排队，请启动 npm run jobs:work。</p>
        {jobs.map((job) => <p key={job.projectId} className="mt-2 text-xs">{projects.find((project) => project.id === job.projectId)?.title || job.projectId} · {job.mode} · {({ queued: "排队中", running: "执行中", done: "已完成", failed: "失败" } as Record<string, string>)[job.status]} {job.error}</p>)}
      </section>

      {query.changed && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-600">
          项目已{query.changed === "updated" ? "更新" : "新增"}，公开页面已经刷新。
        </p>
      )}
      {query.knowledge && (
        <p className={`rounded-lg border px-4 py-3 text-xs ${query.knowledge === "failed" ? "border-red-500/30 bg-red-500/10 text-red-500" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"}`}>
          {query.knowledge === "queued" ? "已加入后台任务队列，刷新页面查看进度。" : query.knowledge === "failed"
            ? "知识库操作失败，请查看项目下方的错误信息。"
            : query.knowledge === "unchanged"
              ? "仓库 Commit 没有变化，现有知识库保持最新。"
              : query.knowledge === "enabled"
                ? "项目已加入知识库，请点击“开始同步”。"
                : "GitHub 仓库已经同步到知识库。"}
        </p>
      )}
      {query.index && (
        <p className={`rounded-lg border px-4 py-3 text-xs ${query.index === "failed" ? "border-red-500/30 bg-red-500/10 text-red-500" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"}`}>
          {query.index === "queued" ? "已加入后台任务队列，刷新页面查看进度。" : query.index === "failed"
            ? "索引操作失败，请查看项目下方的错误信息。"
            : query.index === "embedded"
              ? "代码切片与向量索引已经构建完成。"
              : "免费文本切片已经生成；配置 embedding 后可继续生成向量。"}
        </p>
      )}

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="section-title text-sm font-semibold">当前精选项目</h2>
            <p className="mt-1 text-xs text-[var(--color-fg-muted)]">共 {projects.length} 个；删除只影响网站，不影响 GitHub。</p>
          </div>
        </div>
        <div className="space-y-3">
          {projects.map((project) => {
            const source = sourceByProject.get(project.id);
            return (
            <article key={project.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold">{project.title}</h3>
                    <span className="tag border border-[var(--color-border)] text-[var(--color-fg-muted)]">{project.category}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-[var(--color-fg-dim)]">{project.description || "暂无介绍"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link href={`/admin/projects/${project.id}/edit`} className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]">编辑</Link>
                  <DeleteProjectButton projectId={project.id} title={project.title} />
                </div>
              </div>

              <div className="mt-4 border-t border-[var(--color-border)] pt-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-[var(--color-fg-muted)]">
                    <span className="font-mono text-[var(--color-accent)]">RAG</span>
                    <span className="mx-2">·</span>
                    {source ? knowledgeStatus[source.status] ?? source.status : "尚未加入知识库"}
                    {source?.status === "ready" && <span> · {source.fileCount} 个文件 · {source.chunkCount} 个切片 · {formatBytes(source.totalBytes)}</span>}
                    {source?.lastCommitSha && <span> · {source.lastCommitSha.slice(0, 7)}</span>}
                  </div>
                  {source && (
                    <Link href={`/admin/projects/${project.id}/knowledge`} className="text-xs font-mono text-[var(--color-accent)] hover:underline">查看文件 →</Link>
                  )}
                </div>
                {source?.error && <p className="mb-3 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-500">{source.error}</p>}
                {project.github ? (
                  <KnowledgeControls projectId={project.id} hasSource={Boolean(source)} enabled={source?.enabled ?? false} status={source?.status} chunkCount={source?.chunkCount ?? 0} />
                ) : (
                  <p className="text-xs text-amber-600">请先编辑项目并填写 GitHub 仓库地址。</p>
                )}
              </div>
            </article>
            );
          })}
          {projects.length === 0 && (
            <p className="rounded-xl border border-dashed border-[var(--color-border)] py-10 text-center text-xs text-[var(--color-fg-muted)]">还没有精选项目，可以从下面的 GitHub 仓库加入。</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="section-title text-sm font-semibold">从 GitHub 加入</h2>
        <p className="mt-1 text-xs text-[var(--color-fg-muted)]">列出原创仓库，以及你明确允许展示的 Fork；其他 Fork 仍自动排除。</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {githubRepos.map((repo) => {
            const selected = selectedUrls.has(normalizeGitHubUrl(repo.html_url));
            return (
              <article key={repo.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-semibold">{repo.name}</h3>
                      {repo.fork && <span className="tag border border-sky-500/30 bg-sky-500/10 text-sky-600">精选 Fork</span>}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--color-fg-dim)]">{repo.description || "暂无 GitHub 简介"}</p>
                  </div>
                  {selected ? (
                    <span className="tag shrink-0 border border-emerald-500/30 bg-emerald-500/10 text-emerald-600">已加入</span>
                  ) : (
                    <form action={addGitHubProjectAction}>
                      <input type="hidden" name="fullName" value={repo.full_name} />
                      <AdminSubmitButton pendingText="加入中…" className="shrink-0 rounded-md border border-[var(--color-accent)] px-3 py-1.5 text-xs text-[var(--color-accent)] hover:bg-[var(--color-accent-glow)]">
                        加入
                      </AdminSubmitButton>
                    </form>
                  )}
                </div>
                <p className="mt-3 text-[10px] font-mono text-[var(--color-fg-muted)]">{repo.language || "Code"} · {repo.full_name}</p>
              </article>
            );
          })}
        </div>
        {githubRepos.length === 0 && (
          <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-600">暂时没有读取到原创 GitHub 仓库，请检查网络和 GITHUB_TOKEN。</p>
        )}
      </section>

      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="section-title mb-5 text-sm font-semibold">手动新增项目</h2>
        <ProjectAdminForm />
      </section>
    </div>
  );
}
