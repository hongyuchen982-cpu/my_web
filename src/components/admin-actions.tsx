"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw, CheckCircle, XCircle, FolderPlus } from "lucide-react";
import { syncGitHubProjects, type SyncResult } from "@/app/actions/github-sync";
import { useLang } from "@/components/language-provider";
import { t } from "@/lib/i18n";

const border = "border-[var(--color-border)]";
const surface = "bg-[var(--color-surface)]";

export default function AdminActions() {
  const { lang } = useLang();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const router = useRouter();

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncGitHubProjects();
      setSyncResult(result);
      if (result.success) {
        router.refresh();
      }
    } catch {
      setSyncResult({
        success: false,
        created: 0,
        updated: 0,
        message: t("syncFail", lang),
      });
    } finally {
      setSyncing(false);
    }
  };

  const syncMessage = () => {
    if (!syncResult) return "";
    if (syncResult.message) return syncResult.message;
    return syncResult.success
      ? `${t("syncSuccess", lang)}：+${syncResult.created} / Δ${syncResult.updated}`
      : `${t("syncFail", lang)}`;
  };

  return (
    <div className={`border ${border} rounded-xl p-6 ${surface}`}>
      <h2 className="text-sm font-semibold text-[var(--color-fg)] mb-5 font-mono tracking-wide">
        // {t("quickActions", lang)}
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {/* New Markdown Post */}
        <Link
          href="/admin/posts/new"
          className={`flex flex-col items-center justify-center gap-3 p-5 rounded-lg border ${border} hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-accent)]/5 transition-all group`}
        >
          <div className="w-10 h-10 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5 text-[var(--color-accent)]" />
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-[var(--color-fg)] font-mono">
              {t("newPost", lang)}
            </div>
            <div className="text-[10px] text-[var(--color-fg-muted)] font-mono mt-0.5">
              {t("newPostDesc", lang)}
            </div>
          </div>
        </Link>

        {/* New Project (manual) */}
        <Link
          href="/admin/projects/new"
          className={`flex flex-col items-center justify-center gap-3 p-5 rounded-lg border ${border} hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-accent)]/5 transition-all group`}
        >
          <div className="w-10 h-10 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FolderPlus className="w-5 h-5 text-[var(--color-accent)]" />
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-[var(--color-fg)] font-mono">
              {t("newProject", lang)}
            </div>
            <div className="text-[10px] text-[var(--color-fg-muted)] font-mono mt-0.5">
              {t("newProjectDesc", lang)}
            </div>
          </div>
        </Link>
      </div>

      {/* Sync GitHub Projects — full width below the two buttons */}
      <div className="mt-3">
        <button
          onClick={handleSync}
          disabled={syncing}
          className={`w-full flex items-center justify-center gap-3 p-4 rounded-lg border ${border} hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <div className="w-8 h-8 rounded-full border border-amber-500/30 bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <RefreshCw
              className={`w-4 h-4 text-amber-500 ${syncing ? "animate-spin" : ""}`}
            />
          </div>
          <span className="text-xs font-semibold text-[var(--color-fg)] font-mono">
            {syncing ? t("syncing", lang) : t("syncGitHub", lang)}
          </span>
        </button>
      </div>

      {/* Sync result feedback */}
      {syncResult && (
        <div
          className={`mt-4 p-3 rounded-lg border text-xs font-mono flex items-center gap-2 ${
            syncResult.success
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
              : "border-red-500/30 bg-red-500/10 text-red-500"
          }`}
        >
          {syncResult.success ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{syncMessage()}</span>
        </div>
      )}
    </div>
  );
}
