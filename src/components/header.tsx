"use client";

import Link from "next/link";
import { useLang } from "@/components/language-provider";
import { t } from "@/lib/i18n";
import LanguageSwitcher from "@/components/language-switcher";
import ThemeToggle from "@/components/theme-toggle";
import { getSessionClient } from "@/lib/session-client";
import { useEffect, useState } from "react";
import { Mail, LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";

export default function Header() {
  const { lang } = useLang();
  const [session, setSession] = useState<{
    name: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    getSessionClient().then(setSession);
  }, []);

  const navLink =
    "text-xs font-mono tracking-wide uppercase transition-colors";
  const iconClass = "transition-colors";
  const headerBg = "bg-[var(--color-bg)]/80 backdrop-blur-xl border-b border-[var(--color-border)]";

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
            <Link
              href="/"
              className={`${navLink} text-[var(--color-fg-muted)] hover:text-[var(--color-accent)]`}
            >
              Home
            </Link>
            <Link
              href="/posts"
              className={`${navLink} text-[var(--color-fg-muted)] hover:text-[var(--color-accent)]`}
            >
              Posts
            </Link>
            <Link
              href="/projects"
              className={`${navLink} text-[var(--color-fg-muted)] hover:text-[var(--color-accent)]`}
            >
              Projects
            </Link>
          </nav>
        </div>

        {/* Right: Icons + Auth */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <LanguageSwitcher />

          {/* GitHub */}
          <a
            href="https://github.com"
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

          {/* Auth */}
          {session ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--color-fg-muted)] font-mono">
                {session.name}
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="text-[var(--color-fg-muted)] hover:text-red-400 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </form>
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
