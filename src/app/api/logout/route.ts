import { deleteSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST() {
  await deleteSession();
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true });
}
