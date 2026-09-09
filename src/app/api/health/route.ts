import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await prisma.rateBucket.count();
    return Response.json({ status: "ok" });
  } catch { return Response.json({ status: "unavailable" }, { status: 503 }); }
}
