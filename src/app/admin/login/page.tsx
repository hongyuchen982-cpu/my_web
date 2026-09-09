import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminLoginForm from "@/components/admin-login-form";
import { isAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "项目管理登录",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin/projects");

  return (
    <div className="mx-auto max-w-sm py-16">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <p className="mb-2 text-xs font-mono text-[var(--color-accent)]">{"// OWNER ONLY"}</p>
        <h1 className="mb-2 text-xl font-semibold">项目管理</h1>
        <p className="mb-6 text-xs leading-relaxed text-[var(--color-fg-muted)]">
          登录后可以增加、编辑和删除网站展示的精选项目。
        </p>
        <AdminLoginForm />
      </div>
    </div>
  );
}
