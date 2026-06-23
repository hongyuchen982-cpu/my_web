import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

const protectedRoutes = ["/admin"];
const authRoutes = ["/login"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Check if route is protected — match "/admin" or "/admin/..." (not "/admin-something")
  const isProtected = protectedRoutes.some(
    (r) => path === r || path.startsWith(r + "/")
  );
  const isAuthRoute = authRoutes.some(
    (r) => path === r || path.startsWith(r + "/")
  );

  // Read session cookie — use req.cookies in middleware, NOT cookies() from next/headers
  const cookie = req.cookies.get("session")?.value;
  const session = await decrypt(cookie);

  // Redirect unauthenticated users from protected routes
  if (isProtected && !session?.userId) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && session?.userId) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
}

// Match all routes except static assets and API
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
