"use client";

import { Trash2 } from "lucide-react";
import { useLang } from "@/components/language-provider";
import { t } from "@/lib/i18n";

interface DeleteBtnProps {
  id: string;
  label: string;
  action: (formData: FormData) => void;
}

export default function DeleteBtn({ id, label, action }: DeleteBtnProps) {
  const { lang } = useLang();

  return (
    <form action={action} className="inline">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="p-1.5 text-[var(--color-fg-muted)] hover:text-red-500 transition-colors rounded"
        title={t("delete", lang)}
        onClick={(e) => {
          if (!confirm(`${t("confirmDelete", lang)}\n\n${label}`)) {
            e.preventDefault();
          }
        }}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </form>
  );
}
