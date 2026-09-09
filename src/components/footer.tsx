"use client";

import Link from "next/link";
import { useLang } from "@/components/language-provider";
import { t } from "@/lib/i18n";

export default function Footer({ icpRecord, policeRecord }: { icpRecord?: string; policeRecord?: string }) {
  const { lang } = useLang();
  const year = new Date().getFullYear();
  const mute = "text-[var(--color-fg-muted)]";
  const border = "border-[var(--color-border)]";

  return (
    <footer className={`border-t ${border} py-8 text-center space-y-2`}>
      <p className={`text-xs font-mono ${mute}`}>
        &copy; {year} CHY &middot; {t("copyright", lang)}
      </p>
      <p className={`text-[11px] font-mono ${mute}`}>
        由 Next.js 构建
      </p>
      {(icpRecord || policeRecord) && <div className={`text-[10px] font-mono ${mute} space-x-4`}>
        {icpRecord && <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">{icpRecord}</a>}
        {policeRecord && <a href="https://beian.mps.gov.cn/" target="_blank" rel="noopener noreferrer">{policeRecord}</a>}
      </div>}
      <p className={`text-[10px] ${mute} max-w-md mx-auto leading-relaxed mt-2`}>
        本网站仅用于个人技术分享与学习交流，所含观点仅代表个人立场。
        如发现内容有误，欢迎通过邮件指正。
      </p>
      <Link
        href="/admin/projects"
        className={`inline-block text-[10px] font-mono ${mute} hover:text-[var(--color-accent)]`}
      >
        manage
      </Link>
    </footer>
  );
}
