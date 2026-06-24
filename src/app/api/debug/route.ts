import { NextResponse } from "next/server";

export async function GET() {
  const info: Record<string, unknown> = {
    TURSO_URL_SET: !!process.env.TURSO_DATABASE_URL,
    TURSO_URL_PREFIX:
      (process.env.TURSO_DATABASE_URL ?? "").substring(0, 40) + "...",
    TURSO_TOKEN_SET: !!process.env.TURSO_AUTH_TOKEN,
    TURSO_TOKEN_LEN: (process.env.TURSO_AUTH_TOKEN ?? "").length,
    DATABASE_URL: process.env.DATABASE_URL ?? "(not set)",
    SESSION_SECRET_SET: !!process.env.SESSION_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  };

  // 试连数据库
  try {
    const { prisma } = await import("@/lib/db");
    const postCount = await prisma.post.count();
    const userCount = await prisma.user.count();
    info.db_ok = true;
    info.post_count = postCount;
    info.user_count = userCount;
  } catch (e) {
    info.db_ok = false;
    info.db_error = (e as Error).message;
  }

  return NextResponse.json(info);
}
