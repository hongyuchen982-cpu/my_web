"use server";

import { prisma } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import { SignupSchema, LoginSchema, type AuthResult } from "@/lib/validations";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function signup(
  _prevState: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const validated = SignupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      success: false,
    };
  }

  const { name, email, password } = validated.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { errors: { email: ["该邮箱已注册"] }, success: false };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  await createSession({ id: user.id, email: user.email, name: user.name });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function login(
  _prevState: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const validated = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      success: false,
    };
  }

  const { email, password } = validated.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { message: "邮箱或密码错误", success: false };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { message: "邮箱或密码错误", success: false };
  }

  await createSession({ id: user.id, email: user.email, name: user.name });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function logout() {
  await deleteSession();
  revalidatePath("/", "layout");
}
