"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { consumeRateLimit } from "@/lib/request-guard";
import {
  clearAdminSession,
  createAdminSession,
  isAdminConfigured,
  requireAdmin,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { fetchGitHubRepos, isPortfolioRepository, normalizeGitHubUrl } from "@/lib/github";
import { enableProjectKnowledge } from "@/lib/knowledge-sync";
import { queueKnowledgeJob, requireIdleKnowledge } from "@/lib/knowledge-jobs";

export interface FormState {
  error?: string;
}

const PROJECT_STATUSES = new Set(["active", "wip", "maintained", "archived"]);

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function optionalUrl(value: string): string | null {
  if (!value) return null;
  const parsed = new URL(value);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error("链接必须使用 http 或 https");
  }
  return parsed.toString().replace(/\/$/, "");
}

function projectInput(formData: FormData) {
  const title = text(formData, "title");
  const description = text(formData, "description");
  const category = text(formData, "category");
  const status = text(formData, "status") || "active";
  const sortOrderValue = Number(text(formData, "sortOrder") || "0");

  if (title.length < 2 || title.length > 80) throw new Error("项目名称需要 2–80 个字符");
  if (description.length > 600) throw new Error("项目介绍不能超过 600 个字符");
  if (category.length > 40) throw new Error("项目分类不能超过 40 个字符");
  if (!PROJECT_STATUSES.has(status)) throw new Error("项目状态无效");
  if (!Number.isInteger(sortOrderValue) || Math.abs(sortOrderValue) > 9999) {
    throw new Error("排序值必须是 -9999 到 9999 之间的整数");
  }

  const techs = text(formData, "techs")
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);

  return {
    title,
    description,
    category: category || "Code",
    status,
    url: optionalUrl(text(formData, "url")),
    github: optionalUrl(text(formData, "github")),
    techs: JSON.stringify([...new Set(techs)]),
    sortOrder: sortOrderValue,
  };
}

async function hasDuplicateGithub(github: string | null, excludeId?: string) {
  if (!github) return false;
  const projects = await prisma.project.findMany({ select: { id: true, github: true } });
  const normalized = normalizeGitHubUrl(github);
  return projects.some(
    (project) => project.id !== excludeId && normalizeGitHubUrl(project.github) === normalized
  );
}

function refreshProjects() {
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/admin/projects");
}

export async function loginAction(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    if (!await consumeRateLimit(await headers(), "login", 5, 900)) return { error: "尝试过于频繁，请 15 分钟后重试。" };
  } catch { return { error: "登录服务暂时不可用。" }; }
  if (!isAdminConfigured()) {
    return { error: "后台尚未配置，请先设置 ADMIN_PASSWORD 和 ADMIN_SESSION_SECRET。" };
  }
  if (!verifyAdminPassword(text(formData, "password"))) {
    return { error: "密码不正确。" };
  }

  await createAdminSession();
  redirect("/admin/projects");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function createProjectAction(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  try {
    const input = projectInput(formData);
    if (await hasDuplicateGithub(input.github)) {
      return { error: "这个 GitHub 仓库已经在精选项目中。" };
    }
    await prisma.project.create({ data: input });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "创建项目失败" };
  }

  refreshProjects();
  redirect("/admin/projects?changed=created");
}

export async function updateProjectAction(
  projectId: string,
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  try {
    await requireIdleKnowledge(projectId);
    const input = projectInput(formData);
    if (await hasDuplicateGithub(input.github, projectId)) {
      return { error: "这个 GitHub 仓库已经被另一个精选项目使用。" };
    }
    await prisma.project.update({ where: { id: projectId }, data: input });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "保存项目失败" };
  }

  refreshProjects();
  redirect("/admin/projects?changed=updated");
}

export async function deleteProjectAction(formData: FormData) {
  await requireAdmin();
  const projectId = text(formData, "projectId");
  if (!projectId) return;

  await requireIdleKnowledge(projectId);

  await prisma.project.deleteMany({ where: { id: projectId } });
  refreshProjects();
}

export async function addGitHubProjectAction(formData: FormData) {
  await requireAdmin();
  const fullName = text(formData, "fullName");
  const repo = (await fetchGitHubRepos()).find((item) => item.full_name === fullName);
  if (!repo || !isPortfolioRepository(repo)) return;
  if (await hasDuplicateGithub(repo.html_url)) return;

  await prisma.project.create({
    data: {
      title: repo.name,
      description: repo.description ?? "暂无描述",
      category: repo.language ?? "Code",
      status: "active",
      url: repo.homepage?.replace(/\/$/, "") || null,
      github: repo.html_url.replace(/\/$/, ""),
      techs: JSON.stringify(repo.topics.slice(0, 12)),
      sortOrder: 0,
    },
  });
  refreshProjects();
}

function refreshKnowledge(projectId: string) {
  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${projectId}/knowledge`);
}

export async function enableKnowledgeAction(formData: FormData) {
  await requireAdmin();
  const projectId = text(formData, "projectId");
  let result = "enabled";
  try {
    await enableProjectKnowledge(projectId);
  } catch {
    result = "failed";
  }
  refreshKnowledge(projectId);
  redirect(`/admin/projects?knowledge=${result}`);
}

export async function syncKnowledgeAction(formData: FormData) {
  await requireAdmin();
  const projectId = text(formData, "projectId");
  const force = text(formData, "force") === "true";
  let result = "synced";
  try {
    await queueKnowledgeJob(projectId, "sync", force);
    result = "queued";
  } catch {
    result = "failed";
  }
  refreshKnowledge(projectId);
  redirect(`/admin/projects?knowledge=${result}`);
}

export async function syncAndIndexKnowledgeAction(formData: FormData) {
  await requireAdmin();
  const projectId = text(formData, "projectId");
  let result = "embedded";
  try {
    await queueKnowledgeJob(projectId, "sync-index");
    result = "queued";
  } catch {
    result = "failed";
  }
  refreshKnowledge(projectId);
  redirect(`/admin/projects?index=${result}`);
}

export async function setKnowledgeEnabledAction(formData: FormData) {
  await requireAdmin();
  const projectId = text(formData, "projectId");
  await requireIdleKnowledge(projectId);
  const enabled = text(formData, "enabled") === "true";
  await prisma.knowledgeSource.updateMany({
    where: { projectId },
    data: { enabled, status: enabled ? "pending" : "disabled" },
  });
  refreshKnowledge(projectId);
}

export async function removeKnowledgeAction(formData: FormData) {
  await requireAdmin();
  const projectId = text(formData, "projectId");
  await requireIdleKnowledge(projectId);
  await prisma.knowledgeSource.deleteMany({ where: { projectId } });
  refreshKnowledge(projectId);
}

export async function indexKnowledgeAction(formData: FormData) {
  await requireAdmin();
  const projectId = text(formData, "projectId");
  const withEmbeddings = text(formData, "mode") === "embeddings";
  let result = withEmbeddings ? "embedded" : "chunks";
  try {
    await queueKnowledgeJob(projectId, withEmbeddings ? "embeddings" : "chunks");
    result = "queued";
  } catch {
    result = "failed";
  }
  refreshKnowledge(projectId);
  redirect(`/admin/projects?index=${result}`);
}

export async function addRagEvaluationCaseAction(formData: FormData) {
  await requireAdmin();
  const interactionId = text(formData, "interactionId");
  const expectedMode = text(formData, "expectedMode");
  if (!interactionId || !["answer", "refuse"].includes(expectedMode)) return;
  const interaction = await prisma.ragInteraction.findUnique({
    where: { id: interactionId },
    select: { question: true, sources: true },
  });
  if (!interaction) return;
  let expectedSource = "";
  try {
    const sources = JSON.parse(interaction.sources) as Array<{ title?: string }>;
    expectedSource = sources[0]?.title?.slice(0, 200) ?? "";
  } catch {
    // A malformed historical source list should not block adding the question.
  }
  await prisma.ragEvaluationCase.upsert({
    where: { question: interaction.question },
    update: { expectedMode, expectedSource, enabled: true, originInteractionId: interactionId },
    create: {
      question: interaction.question,
      expectedMode,
      expectedSource,
      originInteractionId: interactionId,
    },
  });
  revalidatePath("/admin/rag");
}
