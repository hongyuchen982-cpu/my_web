"use client";

import { deleteProjectAction } from "@/app/admin/actions";
import AdminSubmitButton from "@/components/admin-submit-button";

export default function DeleteProjectButton({ projectId, title }: { projectId: string; title: string }) {
  return (
    <form
      action={deleteProjectAction}
      onSubmit={(event) => {
        if (!window.confirm(`确定从网站中删除“${title}”吗？\n\n这不会删除 GitHub 仓库。`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="projectId" value={projectId} />
      <AdminSubmitButton
        pendingText="删除中…"
        className="rounded-md border border-red-500/30 px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10"
      >
        删除
      </AdminSubmitButton>
    </form>
  );
}
