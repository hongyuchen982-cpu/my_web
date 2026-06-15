"use server";

import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const PostSchema = z.object({
  title: z.string().min(1, "标题不能为空").trim(),
  slug: z
    .string()
    .min(1, "Slug 不能为空")
    .regex(/^[a-z0-9-]+$/, "Slug 只能包含小写字母、数字和连字符")
    .trim(),
  excerpt: z.string().trim().optional(),
  content: z.string().optional(),
  category: z.string().trim().optional(),
  published: z.boolean().optional(),
});

export type PostActionResult = {
  errors?: Record<string, string[]>;
  message?: string;
  success: boolean;
};

export async function createPost(
  _prevState: PostActionResult,
  formData: FormData
): Promise<PostActionResult> {
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
      excerpt: excerpt ?? "",
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
  _prevState: PostActionResult,
  formData: FormData
): Promise<PostActionResult> {
  const session = await verifySession();

  const id = formData.get("id") as string;
  if (!id) {
    return { message: "缺少文章 ID", success: false };
  }

  // Ownership check
  const existingPost = await prisma.post.findUnique({ where: { id } });
  if (!existingPost || existingPost.authorId !== session.userId) {
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
        excerpt: excerpt ?? "",
        content: content ?? "",
        category: category ?? "",
        published: published ?? false,
      },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return {
        errors: { slug: ["该 Slug 已被使用"] },
        success: false,
      };
    }
    throw e;
  }

  revalidatePath("/posts");
  revalidatePath(`/posts/${slug}`);
  revalidatePath("/");
  redirect("/admin/posts");
}

export async function deletePost(formData: FormData) {
  const session = await verifySession();

  const id = formData.get("id") as string;
  if (!id) return { success: false, message: "缺少文章 ID" };

  // Ownership check
  const existingPost = await prisma.post.findUnique({ where: { id } });
  if (!existingPost || existingPost.authorId !== session.userId) {
    return { success: false, message: "文章不存在或无权删除" };
  }

  await prisma.post.delete({ where: { id } });

  revalidatePath("/posts");
  revalidatePath("/");
  redirect("/admin/posts");
}
