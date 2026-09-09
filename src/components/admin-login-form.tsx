"use client";

import { useActionState } from "react";
import { loginAction, type FormState } from "@/app/admin/actions";
import AdminSubmitButton from "@/components/admin-submit-button";

const initialState: FormState = {};

export default function AdminLoginForm() {
  const [state, action] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="password" className="mb-2 block text-xs font-mono text-[var(--color-fg-dim)]">
          管理密码
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-accent)]"
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
          {state.error}
        </p>
      )}

      <AdminSubmitButton
        pendingText="正在登录…"
        className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
      >
        登录后台
      </AdminSubmitButton>
    </form>
  );
}
