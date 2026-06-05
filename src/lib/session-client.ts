"use client";

/**
 * Fetch the current session from the server.
 * This is a client-side helper that calls the session API route.
 */
export async function getSessionClient(): Promise<{
  userId: string;
  email: string;
  name: string;
} | null> {
  try {
    const res = await fetch("/api/session");
    if (!res.ok) return null;
    const data = await res.json();
    return data.session ?? null;
  } catch {
    return null;
  }
}
