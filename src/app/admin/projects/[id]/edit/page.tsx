import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProjectAdminForm from "@/components/project-admin-form";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import type { Project } from "@/lib/projects";

export const metadata: Metadata = {
  title: "编辑项目",
  robots: { index: false, follow: false },
};

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const row = await prisma.project.findUnique({ where: { id } });
  if (!row) notFound();

  let techs: string[] = [];
  try { techs = JSON.parse(row.techs); } catch { techs = []; }
  const project: Project = {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    status: row.status as Project["status"],
    url: row.url ?? undefined,
    github: row.github ?? undefined,
    techs,
    sortOrder: row.sortOrder,
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/admin/projects" className="text-xs font-mono text-[var(--color-fg-muted)] hover:text-[var(--color-accent)]">← 返回项目管理</Link>
        <h1 className="mt-4 text-xl font-semibold">编辑 {project.title}</h1>
      </div>
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <ProjectAdminForm project={project} />
      </div>
    </div>
  );
}
