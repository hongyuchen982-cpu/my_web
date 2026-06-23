"use server";

import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { verifySession } from "@/lib/session";
import { PostSchema, type ActionResult } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPost(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await verifySession();

  const validated = PostSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    category: formData.get("category"),
    published: formData.get("published") === "true",
  });

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      success: false,
    };
  }

  const { title, slug, excerpt, content, category, published } = validated.data;

  const existing = await prisma.post.findUnique({ where: { slug } });
  if (existing) {
    return {
      errors: { slug: ["该 Slug 已被使用"] },
      success: false,
    };
  }

  await prisma.post.create({
    data: {
      title,
      slug,
      excerpt: excerpt || (content ? content.slice(0, 160).replace(/#/g, "").trim() : ""),
      content: content ?? "",
      category: category ?? "",
      published: published ?? false,
      authorId: session.userId,
    },
  });

  revalidatePath("/posts");
  revalidatePath("/");
  redirect("/admin/posts");
}

export async function updatePost(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await verifySession();

  const rawId = formData.get("id");
  const id = typeof rawId === "string" ? rawId : "";
  if (!id) {
    return { message: "缺少文章 ID", success: false };
  }

  // Ownership check (null authorId = legacy data, allowed)
  const existingPost = await prisma.post.findUnique({ where: { id } });
  if (!existingPost || (existingPost.authorId && existingPost.authorId !== session.userId)) {
    return { message: "文章不存在或无权编辑", success: false };
  }

  const validated = PostSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    category: formData.get("category"),
    published: formData.get("published") === "true",
  });

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      success: false,
    };
  }

  const { title, slug, excerpt, content, category, published } = validated.data;

  // Check slug uniqueness (exclude current post)
  const existing = await prisma.post.findUnique({ where: { slug } });
  if (existing && existing.id !== id) {
    return {
      errors: { slug: ["该 Slug 已被使用"] },
      success: false,
    };
  }

  try {
    await prisma.post.update({
      where: { id },
      data: {
        title,
        slug,
        excerpt: excerpt || (content ? content.slice(0, 160).replace(/#/g, "").trim() : ""),
        content: content ?? "",
        category: category ?? "",
        published: published ?? false,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return { errors: { slug: ["该 Slug 已被使用"] }, success: false };
      }
      if (e.code === "P2025") {
        return { message: "文章不存在或已被删除", success: false };
      }
    }
    throw e;
  }

  revalidatePath("/posts");
  revalidatePath(`/posts/${slug}`);
  revalidatePath("/");
  redirect("/admin/posts");
}

export async function deletePost(
  _prevState: { success: boolean; message?: string },
  formData: FormData
) {
  const session = await verifySession();

  const rawId = formData.get("id");
  const id = typeof rawId === "string" ? rawId : "";
  if (!id) return { success: false, message: "缺少文章 ID" };

  // Ownership check
  const existingPost = await prisma.post.findUnique({ where: { id } });
  if (!existingPost || (existingPost.authorId && existingPost.authorId !== session.userId)) {
    return { success: false, message: "文章不存在或无权删除" };
  }

  await prisma.post.delete({ where: { id } });

  revalidatePath("/posts");
  revalidatePath("/");
  redirect("/admin/posts");
}
