"use client";

import { useActionState } from "react";
import {
  createProjectAction,
  updateProjectAction,
  type FormState,
} from "@/app/admin/actions";
import AdminSubmitButton from "@/components/admin-submit-button";
import type { Project } from "@/lib/projects";

const initialState: FormState = {};
const inputClass = "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]";
const labelClass = "mb-1.5 block text-[11px] font-mono text-[var(--color-fg-dim)]";

export default function ProjectAdminForm({ project }: { project?: Project }) {
  const serverAction = project
    ? updateProjectAction.bind(null, project.id)
    : createProjectAction;
  const [state, action] = useActionState(serverAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="title" className={labelClass}>项目名称 *</label>
          <input id="title" name="title" required minLength={2} maxLength={80} defaultValue={project?.title} className={inputClass} />
        </div>
        <div>
          <label htmlFor="category" className={labelClass}>分类 / 主语言</label>
          <input id="category" name="category" maxLength={40} defaultValue={project?.category} placeholder="TypeScript" className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>项目介绍</label>
        <textarea id="description" name="description" maxLength={600} rows={4} defaultValue={project?.description} className={`${inputClass} resize-y`} />
      </div>

      <div>
        <label htmlFor="techs" className={labelClass}>技术栈（使用逗号分隔）</label>
        <input id="techs" name="techs" defaultValue={project?.techs.join(", ")} placeholder="Next.js, TypeScript, SQLite" className={inputClass} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="github" className={labelClass}>GitHub 地址</label>
          <input id="github" name="github" type="url" defaultValue={project?.github} placeholder="https://github.com/..." className={inputClass} />
          <p className="mt-1.5 text-[10px] leading-5 text-[var(--color-fg-muted)]">项目详情页会自动读取这个仓库的 README 作为完整介绍。</p>
        </div>
        <div>
          <label htmlFor="url" className={labelClass}>在线演示地址</label>
          <input id="url" name="url" type="url" defaultValue={project?.url} placeholder="https://..." className={inputClass} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="status" className={labelClass}>状态</label>
          <select id="status" name="status" defaultValue={project?.status ?? "active"} className={inputClass}>
            <option value="active">活跃</option>
            <option value="wip">开发中</option>
            <option value="maintained">维护中</option>
            <option value="archived">已归档</option>
          </select>
        </div>
        <div>
          <label htmlFor="sortOrder" className={labelClass}>排序值（越小越靠前）</label>
          <input id="sortOrder" name="sortOrder" type="number" min={-9999} max={9999} defaultValue={project?.sortOrder ?? 0} className={inputClass} />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
          {state.error}
        </p>
      )}

      <AdminSubmitButton
        pendingText="正在保存…"
        className="rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
      >
        {project ? "保存修改" : "新增精选项目"}
      </AdminSubmitButton>
    </form>
  );
}
