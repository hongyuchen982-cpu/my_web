import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrisma(): PrismaClient {
  const localUrl = process.env.DATABASE_URL || "file:./dev.db";
  const remoteUrl = process.env.TURSO_DATABASE_URL;
  const url = process.env.NODE_ENV === "production"
    ? remoteUrl || localUrl
    : localUrl || remoteUrl || "file:./dev.db";

  const adapter = new PrismaLibSql({
    url,
    authToken: url.startsWith("file:")
      ? undefined
      : process.env.TURSO_AUTH_TOKEN || undefined,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
