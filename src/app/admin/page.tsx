import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getAllPosts } from "@/lib/posts";
import { getProjects } from "@/lib/projects";
import { LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";

const border = "border-[var(--color-border)]";
const surface = "bg-[var(--color-surface)]";

export default async function AdminPage() {
  const session = await verifySession();
  const userCount = await prisma.user.count();
  const postCount = getAllPosts().length;
  const projectCount = getProjects().length;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-fg)] tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-[var(--color-fg-muted)] font-mono mt-1">
            Welcome, {session.name}
          </p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className={`flex items-center gap-2 text-xs font-mono text-[var(--color-fg-muted)] hover:text-red-500 transition-colors border ${border} rounded-lg px-3 py-1.5 hover:border-red-500/30`}
          >
            <LogOut className="w-3 h-3" />
            Sign Out
          </button>
        </form>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Users", value: userCount, color: "text-[var(--color-accent)]" },
          { label: "Posts", value: postCount, color: "text-emerald-500" },
          { label: "Projects", value: projectCount, color: "text-amber-500" },
        ].map((s) => (
          <div
            key={s.label}
            className={`border ${border} rounded-xl p-5 ${surface} text-center`}
          >
            <div className={`text-2xl font-bold ${s.color} font-mono`}>
              {s.value}
            </div>
            <div className="text-[11px] text-[var(--color-fg-muted)] font-mono mt-1 tracking-wider uppercase">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div className={`border ${border} rounded-xl p-6 ${surface}`}>
        <h2 className="text-sm font-semibold text-[var(--color-fg)] mb-4 font-mono tracking-wide">
          // Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-2">
          <a
            href="/posts"
            className="text-xs text-[var(--color-fg-dim)] hover:text-[var(--color-accent)] transition-colors font-mono"
          >
            → View all posts
          </a>
          <a
            href="/register"
            className="text-xs text-[var(--color-fg-dim)] hover:text-[var(--color-accent)] transition-colors font-mono"
          >
            → Register new user
          </a>
        </div>
      </div>

      <div className={`border border-dashed ${border} rounded-xl p-8 text-center`}>
        <p className="text-xs text-[var(--color-fg-muted)] font-mono">
          Post editor &amp; project management coming soon.
        </p>
      </div>
    </div>
  );
}
