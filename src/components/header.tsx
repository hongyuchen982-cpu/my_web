"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/language-provider";
import { t } from "@/lib/i18n";
import LanguageSwitcher from "@/components/language-switcher";
import ThemeToggle from "@/components/theme-toggle";
import { useAuth } from "@/components/auth-provider";
import { syncGitHubProjects, type SyncResult } from "@/app/actions/github-sync";
import {
  Mail,
  LogOut,
  Plus,
  FileText,
  FolderPlus,
  RefreshCw,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function Header() {
  const { lang } = useLang();
  const { session, refresh: refreshAuth } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/logout", { method: "POST" });
      if (res.ok) {
        await refreshAuth();
        router.refresh();
      }
    } catch {
      router.push("/login");
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const result: SyncResult = await syncGitHubProjects();
      setSyncMsg({
        ok: result.success,
        text: result.success
          ? `${lang === "zh" ? "同步完成" : "Sync done"}：+${result.created} / Δ${result.updated}`
          : result.message ?? `${lang === "zh" ? "同步失败" : "Sync failed"}`,
      });
      if (result.success) router.refresh();
    } catch {
      setSyncMsg({
        ok: false,
        text: lang === "zh" ? "同步失败，请重试" : "Sync failed, retry",
      });
    } finally {
      setSyncing(false);
    }
  };

  const navLink =
    "text-xs font-mono tracking-wide uppercase transition-colors";
  const iconClass = "transition-colors";
  const headerBg =
    "bg-[var(--color-bg)]/80 backdrop-blur-xl border-b border-[var(--color-border)]";

  return (
    <header className={`sticky top-0 z-50 ${headerBg}`}>
      <div className="mx-auto max-w-4xl flex items-center justify-between h-14 px-6">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="font-mono text-sm font-semibold text-[var(--color-accent)] glow-text tracking-tight"
          >
            ~/chy
          </Link>
          <nav className="hidden sm:flex items-center gap-6">
            <Link href="/" className={`${navLink} text-[var(--color-fg-muted)] hover:text-[var(--color-accent)]`}>
              Home
            </Link>
            <Link href="/posts" className={`${navLink} text-[var(--color-fg-muted)] hover:text-[var(--color-accent)]`}>
              Posts
            </Link>
            <Link href="/projects" className={`${navLink} text-[var(--color-fg-muted)] hover:text-[var(--color-accent)]`}>
              Projects
            </Link>
          </nav>
        </div>

        {/* Right: Icons + Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageSwitcher />

          {/* GitHub */}
          <a
            href="https://github.com/hongyuchen982-cpu"
            target="_blank"
            rel="noopener noreferrer"
            className={`${iconClass} text-[var(--color-fg-muted)] hover:text-[var(--color-accent)]`}
            title="GitHub"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>

          {/* Email */}
          <a
            href="mailto:hi@example.com"
            className={`${iconClass} text-[var(--color-fg-muted)] hover:text-[var(--color-accent)]`}
            title="Email"
          >
            <Mail className="w-4 h-4" />
          </a>

          {/* ── Auth state ── */}
          {session ? (
            <div className="flex items-center gap-2">
              {/* + Action button dropdown */}
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => {
                    setMenuOpen(!menuOpen);
                    setSyncMsg(null);
                  }}
                  className={`flex items-center justify-center w-8 h-8 rounded-full border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 hover:border-[var(--color-accent)]/60 transition-all ${
                    menuOpen ? "bg-[var(--color-accent)]/20 border-[var(--color-accent)]/60" : ""
                  }`}
                  title={lang === "zh" ? "新建 / 同步" : "New / Sync"}
                >
                  <Plus className="w-4 h-4" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl shadow-black/20 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* New Post */}
                    <Link
                      href="/admin/posts/new"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)] transition-colors font-mono"
                    >
                      <FileText className="w-4 h-4 text-[var(--color-accent)]" />
                      <span>{t("newPost", lang)}</span>
                    </Link>

                    {/* New Project */}
                    <Link
                      href="/admin/projects/new"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)] transition-colors font-mono"
                    >
                      <FolderPlus className="w-4 h-4 text-[var(--color-accent)]" />
                      <span>{t("newProject", lang)}</span>
                    </Link>

                    {/* Divider */}
                    <div className="my-1 border-t border-[var(--color-border)]" />

                    {/* Sync GitHub */}
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleSync();
                      }}
                      disabled={syncing}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)] transition-colors font-mono disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 text-amber-500 ${syncing ? "animate-spin" : ""}`} />
                      <span>{syncing ? t("syncing", lang) : t("syncGitHub", lang)}</span>
                    </button>

                    {/* Sync feedback */}
                    {syncMsg && (
                      <div className="mx-3 mt-2 px-3 py-2 rounded-lg text-[10px] font-mono flex items-center gap-2 border border-[var(--color-border)]">
                        {syncMsg.ok ? (
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-500" />
                        )}
                        <span className={syncMsg.ok ? "text-emerald-500" : "text-red-500"}>
                          {syncMsg.text}
                        </span>
                      </div>
                    )}

                    {/* Divider */}
                    <div className="my-1 border-t border-[var(--color-border)]" />

                    {/* Manage Posts / Projects links */}
                    <Link
                      href="/admin/posts"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-2 text-xs text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)] transition-colors font-mono"
                    >
                      <span>{t("managePostsTitle", lang)}</span>
                      <span className="text-[10px] opacity-50">→</span>
                    </Link>
                    <Link
                      href="/admin/projects"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-2 text-xs text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)] transition-colors font-mono"
                    >
                      <span>{t("manageProjectsTitle", lang)}</span>
                      <span className="text-[10px] opacity-50">→</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Username */}
              <span className="text-[11px] text-[var(--color-fg-muted)] font-mono hidden lg:inline max-w-[100px] truncate">
                {session.name}
              </span>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="text-[var(--color-fg-muted)] hover:text-red-400 transition-colors ml-1"
                title={t("signOut", lang)}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className={`${navLink} text-[var(--color-fg-muted)] hover:text-[var(--color-accent)]`}
            >
              {t("signIn", lang)}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
