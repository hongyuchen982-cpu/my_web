import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

let _prisma: PrismaClient | undefined;

function createPrisma(): PrismaClient {
  const adapter = new PrismaLibSql({
    url:
      process.env.TURSO_DATABASE_URL ||
      process.env.DATABASE_URL ||
      "file:./dev.db",
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  });
  return new PrismaClient({ adapter });
}

function getPrisma(): PrismaClient {
  if (!_prisma) {
    _prisma = createPrisma();
  }
  return _prisma;
}

// Proxy：透明懒加载，不改任何调用方
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
