// lib/auth-client.ts — Better Auth (browser client)
// Pengganti lib/supabase/client.ts untuk kebutuhan auth di sisi client.

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export const { useSession } = authClient;
