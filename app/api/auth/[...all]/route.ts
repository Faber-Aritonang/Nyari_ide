// app/api/auth/[...all]/route.ts — Handler Better Auth
// Menangani /api/auth/sign-in/email, /api/auth/sign-up/email, /api/auth/sign-out, dll.

import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
