import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  adapter: PrismaLibSql | undefined;
};

const adapter =
  globalForPrisma.adapter ??
  new PrismaLibSql({
    url:
      process.env.TURSO_DATABASE_URL ||
      process.env.DATABASE_URL ||
      "file:./dev.db",
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  });

if (!globalForPrisma.adapter) {
  globalForPrisma.adapter = adapter;
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
