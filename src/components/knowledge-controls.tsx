"use client";

import {
  enableKnowledgeAction,
  indexKnowledgeAction,
  removeKnowledgeAction,
  setKnowledgeEnabledAction,
  syncAndIndexKnowledgeAction,
  syncKnowledgeAction,
} from "@/app/admin/actions";
import AdminSubmitButton from "@/components/admin-submit-button";

const buttonClass = "rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]";

export default function KnowledgeControls({
  projectId,
  hasSource,
  enabled,
  status,
  chunkCount = 0,
}: {
  projectId: string;
  hasSource: boolean;
  enabled: boolean;
  status?: string;
  chunkCount?: number;
}) {
  if (!hasSource) {
    return (
      <form action={enableKnowledgeAction}>
        <input type="hidden" name="projectId" value={projectId} />
        <AdminSubmitButton pendingText="启用中…" className={buttonClass}>加入知识库</AdminSubmitButton>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {enabled && (
        <form action={syncKnowledgeAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="force" value="false" />
          <AdminSubmitButton pendingText="同步中…" className={buttonClass}>
            {status === "ready" ? "检查更新" : "开始同步"}
          </AdminSubmitButton>
        </form>
      )}
      {enabled && status === "ready" && (
        <form action={syncAndIndexKnowledgeAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <AdminSubmitButton pendingText="同步并索引中…" className="rounded-md border border-[var(--color-accent)] px-3 py-1.5 text-xs text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent-glow)]">
            一键同步并向量化
          </AdminSubmitButton>
        </form>
      )}
      {enabled && status === "ready" && (
        <form action={syncKnowledgeAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="force" value="true" />
          <AdminSubmitButton pendingText="重建中…" className={buttonClass}>强制重建</AdminSubmitButton>
        </form>
      )}
      {enabled && status === "ready" && (
        <form action={indexKnowledgeAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="mode" value="chunks" />
          <AdminSubmitButton pendingText="切片中…" className={buttonClass}>生成切片</AdminSubmitButton>
        </form>
      )}
      {enabled && status === "ready" && chunkCount > 0 && (
        <form action={indexKnowledgeAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="mode" value="embeddings" />
          <AdminSubmitButton pendingText="向量化中…" className={buttonClass}>生成向量</AdminSubmitButton>
        </form>
      )}
      <form action={setKnowledgeEnabledAction}>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="enabled" value={enabled ? "false" : "true"} />
        <AdminSubmitButton className={buttonClass}>{enabled ? "停用" : "重新启用"}</AdminSubmitButton>
      </form>
      <form
        action={removeKnowledgeAction}
        onSubmit={(event) => {
          if (!window.confirm("确定删除这个项目已经同步的全部知识库文件吗？GitHub 仓库不会受到影响。")) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="projectId" value={projectId} />
        <AdminSubmitButton pendingText="删除中…" className="rounded-md border border-red-500/30 px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10">删除知识库</AdminSubmitButton>
      </form>
    </div>
  );
}
