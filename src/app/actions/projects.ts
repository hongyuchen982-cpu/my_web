"use server";

import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const ProjectSchema = z.object({
  title: z.string().min(1, "标题不能为空").trim(),
  description: z.string().trim().optional(),
  category: z.string().trim().optional(),
  status: z.string().optional(),
  url: z.string().trim().optional(),
  github: z.string().trim().optional(),
  techs: z.string().optional(),
  sortOrder: z.coerce.number().optional(),
});

export type ProjectActionResult = {
  errors?: Record<string, string[]>;
  message?: string;
  success: boolean;
};

export async function createProject(
  _prevState: ProjectActionResult,
  formData: FormData
): Promise<ProjectActionResult> {
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
  _prevState: ProjectActionResult,
  formData: FormData
): Promise<ProjectActionResult> {
  const session = await verifySession();

  const id = formData.get("id") as string;
  if (!id) {
    return { message: "缺少项目 ID", success: false };
  }

  // Ownership check
  const existingProject = await prisma.project.findUnique({ where: { id } });
  if (!existingProject || existingProject.authorId !== session.userId) {
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

export async function deleteProject(formData: FormData) {
  const session = await verifySession();

  const id = formData.get("id") as string;
  if (!id) return { success: false, message: "缺少项目 ID" };

  // Ownership check
  const existingProject = await prisma.project.findUnique({ where: { id } });
  if (!existingProject || existingProject.authorId !== session.userId) {
    return { success: false, message: "项目不存在或无权删除" };
  }

  await prisma.project.delete({ where: { id } });

  revalidatePath("/");
  redirect("/admin/projects");
}
