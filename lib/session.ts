// lib/session.ts — Helper session di server (API routes & Server Components)
// Pengganti supabase.auth.getUser() di sisi server.

import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

/**
 * Ambil user yang sedang login dari cookie session.
 * Return null jika belum login / session tidak valid.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? "",
  };
}
