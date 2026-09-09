"use client";

import { useFormStatus } from "react-dom";

export default function AdminSubmitButton({
  children,
  pendingText = "处理中…",
  className = "",
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {pending ? pendingText : children}
    </button>
  );
}
