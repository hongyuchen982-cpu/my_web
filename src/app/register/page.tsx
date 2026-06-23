"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signup } from "@/app/actions/auth";
import { useLang } from "@/components/language-provider";
import { useAuth } from "@/components/auth-provider";
import { t } from "@/lib/i18n";
import Link from "next/link";
import type { AuthResult } from "@/lib/validations";

import { inputClass, labelClass } from "@/lib/styles";

export default function RegisterPage() {
  const { lang } = useLang();
  const router = useRouter();
  const { refresh: refreshAuth } = useAuth();
  const [state, action, pending] = useActionState(signup, {
    success: false,
  } as AuthResult);

  // On successful registration, refresh auth state then navigate home
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
            {t("registerTitle", lang)}
          </h2>
          <p className="text-xs text-[var(--color-fg-muted)] font-mono">创建你的账号</p>
        </div>

        <form action={action} className="space-y-4">
          <div>
            <label htmlFor="name" className={labelClass}>
              {t("username", lang)}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className={inputClass}
              placeholder={t("usernamePlaceholder", lang)}
            />
            {state?.errors?.name && (
              <p className="text-xs text-red-500 mt-1 font-mono">
                {state.errors.name[0]}
              </p>
            )}
          </div>

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
              placeholder={t("passwordPlaceholder", lang)}
            />
            {state?.errors?.password && (
              <div className="text-xs text-red-500 mt-1 font-mono space-y-0.5">
                {state.errors.password.map((err, i) => (
                  <p key={i}>- {err}</p>
                ))}
              </div>
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
            {pending ? "…" : t("registerButton", lang)}
          </button>
        </form>

        <p className="text-center mt-6 text-xs text-[var(--color-fg-muted)] font-mono">
          <Link
            href="/login"
            className="hover:text-[var(--color-accent)] transition-colors"
          >
            {t("alreadyHaveAccount", lang)}
          </Link>
        </p>
      </div>
    </div>
  );
}
