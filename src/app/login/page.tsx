"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/app/actions/auth";
import { useLang } from "@/components/language-provider";
import { useAuth } from "@/components/auth-provider";
import { t } from "@/lib/i18n";
import Link from "next/link";
import type { AuthResult } from "@/lib/validations";

import { inputClass, labelClass } from "@/lib/styles";

export default function LoginPage() {
  const { lang } = useLang();
  const router = useRouter();
  const { refresh: refreshAuth } = useAuth();
  const [state, action, pending] = useActionState(login, {
    success: false,
  } as AuthResult);

  // On successful login, refresh auth state then navigate home
  useEffect(() => {
    if (state?.success) {
      refreshAuth().then(() => router.push("/"));
    }
  }, [state?.success, router, refreshAuth]);

  return (
    <div className="flex items-center justify-center min-h-[65vh]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-[var(--color-fg)] mb-1 tracking-tight">
            {t("signInTitle", lang)}
          </h2>
          <p className="text-xs text-[var(--color-fg-muted)] font-mono">欢迎回来</p>
        </div>

        <form action={action} className="space-y-4">
          <div>
            <label htmlFor="email" className={labelClass}>
              {t("email", lang)}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className={inputClass}
              placeholder={t("emailPlaceholder", lang)}
            />
            {state?.errors?.email && (
              <p className="text-xs text-red-500 mt-1 font-mono">
                {state.errors.email[0]}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className={labelClass}>
              {t("password", lang)}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className={inputClass}
              placeholder="••••••••"
            />
            {state?.errors?.password && (
              <p className="text-xs text-red-500 mt-1 font-mono">
                {state.errors.password[0]}
              </p>
            )}
          </div>

          {state?.message && (
            <p className="text-xs text-red-500 text-center font-mono">
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-2.5 px-4 bg-[var(--color-accent)] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all tracking-wide font-mono"
          >
            {pending ? "…" : t("loginButton", lang)}
          </button>
        </form>

        <p className="text-center mt-6 text-xs text-[var(--color-fg-muted)] font-mono">
          <Link
            href="/register"
            className="hover:text-[var(--color-accent)] transition-colors"
          >
            {t("noAccount", lang)}
          </Link>
        </p>
      </div>
    </div>
  );
}
