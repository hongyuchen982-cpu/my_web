"use server";

import { prisma } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import { SignupSchema, LoginSchema, type AuthResult } from "@/lib/validations";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function signup(
  _prevState: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  // 1. Validate fields
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

  // 2. Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      errors: { email: ["该邮箱已注册"] },
      success: false,
    };
  }

  // 3. Hash password and create user
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
  });

  // 4. Create session
  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
  });

  // 5. Redirect
  redirect("/");
}

export async function login(
  _prevState: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  // 1. Validate fields
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

  // 2. Find user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return {
      message: "邮箱或密码错误",
      success: false,
    };
  }

  // 3. Verify password
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return {
      message: "邮箱或密码错误",
      success: false,
    };
  }

  // 4. Create session
  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
  });

  // 5. Redirect
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
