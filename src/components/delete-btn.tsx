"use client";

import { Trash2 } from "lucide-react";
import { useActionState } from "react";
import { useLang } from "@/components/language-provider";
import { t } from "@/lib/i18n";

interface DeleteBtnProps {
  id: string;
  label: string;
  action: (
    _prevState: { success: boolean; message?: string },
    formData: FormData
  ) => Promise<{ success: boolean; message?: string }>;
}

export default function DeleteBtn({ id, label, action }: DeleteBtnProps) {
  const { lang } = useLang();
  const [state, formAction, pending] = useActionState(action, {
    success: false,
  });

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="p-1.5 text-[var(--color-fg-muted)] hover:text-red-500 transition-colors rounded disabled:opacity-50"
        title={t("delete", lang)}
        onClick={(e) => {
          if (!confirm(`${t("confirmDelete", lang)}\n\n${label}`)) {
            e.preventDefault();
          }
        }}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
      {state?.message && !state.success && (
        <span className="text-[10px] text-red-500 font-mono ml-1">
          {state.message}
        </span>
      )}
    </form>
  );
}
