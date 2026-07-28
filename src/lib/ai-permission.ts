/**
 * AI 权限校验 + 每日调用次数限制。
 * - 未登录 → 401
 * - 无 AI 权限 → 403
 * - 超过每日限制（默认 20 次）→ 429
 */
import { prisma } from "@/lib/db";
import { verifySession, getSession, type SessionPayload } from "@/lib/session";

const DAILY_LIMIT = 20;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface AIPermissionResult {
  allowed: true;
  status: 200;
  userId: string;
  remaining: number;
}

export interface AIPermissionDenied {
  allowed: false;
  status: 401 | 403 | 429;
  message: string;
}

export type AICheckResult = AIPermissionResult | AIPermissionDenied;

/**
 * 检查当前请求的用户是否有 AI 权限，以及是否超过每日调用限制。
 * 调用时机：在 /api/chat 处理请求的最开头。
 */
export async function checkAIPermission(): Promise<AICheckResult> {
  // 1. 验证登录
  let session: SessionPayload | null;
  try {
    session = await getSession();
  } catch {
    return { allowed: false, status: 401, message: "请先登录" };
  }

  if (!session?.userId) {
    return { allowed: false, status: 401, message: "请先登录" };
  }

  // 2. 查用户权限
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, canUseAI: true },
  });

  if (!user) {
    return { allowed: false, status: 401, message: "用户不存在" };
  }

  if (!user.canUseAI) {
    return {
      allowed: false,
      status: 403,
      message: "你没有 AI 使用权限，请联系管理员开通",
    };
  }

  // 3. 检查每日次数限制
  const today = todayStr();
  const log = await prisma.aICallLog.findUnique({
    where: { userId_date: { userId: user.id, date: today } },
  });

  if (log && log.count >= DAILY_LIMIT) {
    return {
      allowed: false,
      status: 429,
      message: `今日 AI 调用次数已用完（${DAILY_LIMIT} 次/天），请明天再试`,
    };
  }

  const used = log?.count ?? 0;
  return {
    allowed: true,
    status: 200,
    userId: user.id,
    remaining: DAILY_LIMIT - used - 1,
  } as AIPermissionResult;
}

/**
 * 调用成功后，递增当日次数。
 */
export async function incrementAICallCount(userId: string): Promise<void> {
  const today = todayStr();
  await prisma.aICallLog.upsert({
    where: { userId_date: { userId, date: today } },
    create: { userId, date: today, count: 1 },
    update: { count: { increment: 1 } },
  });
}
