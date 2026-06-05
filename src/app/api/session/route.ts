import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ session: null });
  }

  return NextResponse.json({
    session: {
      userId: session.userId,
      email: session.email,
      name: session.name,
    },
  });
}
