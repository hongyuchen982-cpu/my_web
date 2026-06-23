"use server";

import { verifySession } from "@/lib/session";
import { fetchGitHubRepos } from "@/lib/github";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type SyncResult = {
  success: boolean;
  created: number;
  updated: number;
  message?: string;
};

export async function syncGitHubProjects(): Promise<SyncResult> {
  const session = await verifySession();

  try {
    const repos = await fetchGitHubRepos();

    if (repos.length === 0) {
      return {
        success: false,
        created: 0,
        updated: 0,
        message: "未获取到 GitHub 仓库数据，请检查 GITHUB_TOKEN 或网络连接。",
      };
    }

    // Batch-load all existing projects by their GitHub URLs (avoid N+1)
    const githubUrls = repos.map((r) => r.html_url);
    const existingProjects = await prisma.project.findMany({
      where: { github: { in: githubUrls } },
      select: { id: true, github: true, authorId: true, sortOrder: true },
    });

    const existingMap = new Map(
      existingProjects.map((p) => [p.github!, p])
    );

    let created = 0;
    let updated = 0;

    for (const repo of repos) {
      const existing = existingMap.get(repo.html_url);

      const data = {
        title: repo.name,
        description: repo.description ?? "暂无描述",
        category: repo.language ?? "Code",
        status: "active" as const,
        url: repo.homepage ?? null,
        github: repo.html_url,
        techs: JSON.stringify(repo.topics.slice(0, 6)),
        sortOrder: 0,
      };

      if (existing) {
        // Only update if current user owns the project (null = legacy, allowed)
        if (existing.authorId && existing.authorId !== session.userId) continue;
        await prisma.project.update({
          where: { id: existing.id },
          data: {
            ...data,
            sortOrder: existing.sortOrder, // preserve existing sort order
          },
        });
        updated++;
      } else {
        await prisma.project.create({
          data: { ...data, authorId: session.userId },
        });
        created++;
      }
    }

    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath("/admin");
    revalidatePath("/admin/projects");

    return {
      success: true,
      created,
      updated,
      message: `成功同步：新增 ${created} 个项目，更新 ${updated} 个项目。`,
    };
  } catch (e) {
    console.error("[github-sync]", e);
    return {
      success: false,
      created: 0,
      updated: 0,
      message: "同步失败，请查看服务器日志。",
    };
  }
}
