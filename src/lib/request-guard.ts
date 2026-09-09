import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";

export function sameOrigin(headers: Headers): boolean {
  const origin = headers.get("origin");
  if (!origin) return true; // CLI clients still pass the rate limiter.
  try { return new URL(origin).host === headers.get("host"); } catch { return false; }
}

export async function consumeRateLimit(headers: Headers, scope: string, limit: number, seconds = 300) {
  // Only trust the proxy-installed header when explicitly configured. Docker binds to loopback.
  const client = process.env.TRUST_PROXY === "true" ? headers.get("x-real-ip") || "unknown" : "shared";
  const bucket = Math.floor(Date.now() / (seconds * 1000));
  const key = createHash("sha256").update(`${scope}:${client}:${bucket}`).digest("hex");
  const expiresAt = new Date((bucket + 2) * seconds * 1000);
  const row = await prisma.rateBucket.upsert({
    where: { key }, create: { key, count: 1, expiresAt }, update: { count: { increment: 1 } },
  });
  return row.count <= limit;
}

export function feedbackToken(id: string): string {
  const configured = process.env.ADMIN_SESSION_SECRET?.trim();
  const secret = configured && configured.length >= 32
    ? configured
    : process.env.NODE_ENV === "production"
      ? null
      : "local-development-feedback-secret-change-before-production";
  if (!secret) throw new Error("生产环境必须配置 ADMIN_SESSION_SECRET（至少 32 字符）");
  return createHmac("sha256", secret).update(`feedback:${id}`).digest("hex");
}

export function validFeedbackToken(id: string, token: string) {
  const expected = Buffer.from(feedbackToken(id));
  const actual = Buffer.from(token);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
