"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/language-provider";
import { t } from "@/lib/i18n";
import { useAuth } from "@/components/auth-provider";
import AdminActions from "@/components/admin-actions";
import { LogOut, ChevronRight } from "lucide-react";

const border = "border-[var(--color-border)]";
const surface = "bg-[var(--color-surface)]";

interface AdminDashboardProps {
  userName: string;
  userCount: number;
  postsCount: number;
  projectsCount: number;
}

export default function AdminDashboard({
  userName,
  userCount,
  postsCount,
  projectsCount,
}: AdminDashboardProps) {
  const { lang } = useLang();
  const router = useRouter();
  const { refresh: refreshAuth } = useAuth();

  const handleLogout = useCallback(async () => {
    try {
      const res = await fetch("/api/logout", { method: "POST" });
      if (res.ok) {
        await refreshAuth();
        router.refresh();
      }
    } catch {
      router.push("/login");
    }
  }, [refreshAuth, router]);

  const stats = [
    { label: t("adminUsers", lang), value: userCount, color: "text-[var(--color-accent)]" },
    { label: t("adminPosts", lang), value: postsCount, color: "text-emerald-500" },
    { label: t("adminProjects", lang), value: projectsCount, color: "text-amber-500" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-fg)] tracking-tight">
            {t("adminDashboard", lang)}
          </h1>
          <p className="text-sm text-[var(--color-fg-muted)] font-mono mt-1">
            {t("welcome", lang)}, {userName}
          </p>
        </div>
        <button
            onClick={handleLogout}
            className={`flex items-center gap-2 text-xs font-mono text-[var(--color-fg-muted)] hover:text-red-500 transition-colors border ${border} rounded-lg px-3 py-1.5 hover:border-red-500/30`}
          >
            <LogOut className="w-3 h-3" />
            {t("signOut", lang)}
          </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`border ${border} rounded-xl p-5 ${surface} text-center`}
          >
            <div className={`text-2xl font-bold ${s.color} font-mono`}>
              {s.value}
            </div>
            <div className="text-[11px] text-[var(--color-fg-muted)] font-mono mt-1 tracking-wider">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Primary Action Buttons */}
      <AdminActions />

      {/* Management Links */}
      <div className={`border ${border} rounded-xl p-6 ${surface}`}>
        <h2 className="text-sm font-semibold text-[var(--color-fg)] mb-4 font-mono tracking-wide">
          // {t("management", lang)}
        </h2>
        <div className="grid grid-cols-1 gap-1.5">
          <Link
            href="/admin/posts"
            className="flex items-center justify-between text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors font-mono py-2 px-2 rounded hover:bg-[var(--color-surface-hover)]"
          >
            <span>→ {t("managePosts", lang)} ({postsCount})</span>
            <ChevronRight className="w-3 h-3 opacity-50" />
          </Link>
          <Link
            href="/admin/projects"
            className="flex items-center justify-between text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors font-mono py-2 px-2 rounded hover:bg-[var(--color-surface-hover)]"
          >
            <span>→ {t("manageProjects", lang)} ({projectsCount})</span>
            <ChevronRight className="w-3 h-3 opacity-50" />
          </Link>
          <Link
            href="/register"
            className="flex items-center justify-between text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors font-mono py-2 px-2 rounded hover:bg-[var(--color-surface-hover)]"
          >
            <span>→ {t("registerNewUser", lang)}</span>
            <ChevronRight className="w-3 h-3 opacity-50" />
          </Link>
        </div>
      </div>

      {/* Footer note */}
      <div className={`border border-dashed ${border} rounded-xl p-8 text-center`}>
        <p className="text-xs text-[var(--color-fg-muted)] font-mono leading-relaxed">
          {t("syncTip", lang)}
        </p>
      </div>
    </div>
  );
}
