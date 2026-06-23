"use server";

import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { ProjectSchema, type ActionResult } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProject(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await verifySession();

  const validated = ProjectSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    status: formData.get("status"),
    url: formData.get("url"),
    github: formData.get("github"),
    techs: formData.get("techs"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      success: false,
    };
  }

  const { title, description, category, status, url, github, techs, sortOrder } =
    validated.data;

  await prisma.project.create({
    data: {
      title,
      description: description ?? "",
      category: category ?? "",
      status: status ?? "active",
      url: url ?? null,
      github: github ?? null,
      techs: techs ?? "[]",
      sortOrder: sortOrder ?? 0,
      authorId: session.userId,
    },
  });

  revalidatePath("/");
  redirect("/admin/projects");
}

export async function updateProject(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await verifySession();

  const rawId = formData.get("id");
  const id = typeof rawId === "string" ? rawId : "";
  if (!id) {
    return { message: "缺少项目 ID", success: false };
  }

  // Ownership check (null authorId = legacy data, allowed)
  const existingProject = await prisma.project.findUnique({ where: { id } });
  if (!existingProject || (existingProject.authorId && existingProject.authorId !== session.userId)) {
    return { message: "项目不存在或无权编辑", success: false };
  }

  const validated = ProjectSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    status: formData.get("status"),
    url: formData.get("url"),
    github: formData.get("github"),
    techs: formData.get("techs"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      success: false,
    };
  }

  const { title, description, category, status, url, github, techs, sortOrder } =
    validated.data;

  await prisma.project.update({
    where: { id },
    data: {
      title,
      description: description ?? "",
      category: category ?? "",
      status: status ?? "active",
      url: url ?? null,
      github: github ?? null,
      techs: techs ?? "[]",
      sortOrder: sortOrder ?? 0,
    },
  });

  revalidatePath("/");
  redirect("/admin/projects");
}

export async function deleteProject(
  _prevState: { success: boolean; message?: string },
  formData: FormData
) {
  const session = await verifySession();

  const rawId = formData.get("id");
  const id = typeof rawId === "string" ? rawId : "";
  if (!id) return { success: false, message: "缺少项目 ID" };

  // Ownership check
  const existingProject = await prisma.project.findUnique({ where: { id } });
  if (!existingProject || (existingProject.authorId && existingProject.authorId !== session.userId)) {
    return { success: false, message: "项目不存在或无权删除" };
  }

  await prisma.project.delete({ where: { id } });

  revalidatePath("/");
  redirect("/admin/projects");
}
