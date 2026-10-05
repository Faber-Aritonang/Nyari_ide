// lib/auth.ts — Better Auth (server)
// Pengganti Supabase Auth: email+password, whitelist maks 10 email.
// Password di-hash dengan bcrypt (kompatibel dengan hash lama dari Supabase Auth,
// jadi user lama bisa login tanpa daftar ulang setelah migrasi data).

import { betterAuth } from "better-auth";
import { createAuthMiddleware, APIError } from "better-auth/api";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";

export const ADMIN_EMAIL = "faber.aritonang@gmail.com";

export const auth = betterAuth({
  appName: "Nyari_ide",
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL,
  trustedOrigins: [
    "http://localhost:3000",
    process.env.NEXT_PUBLIC_SITE_URL,
  ].filter(Boolean) as string[],

  database: pool,

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6, // sama seperti aturan lama (min. 6 karakter)
    resetPasswordTokenExpiresIn: 60 * 60, // link reset berlaku 1 jam
    password: {
      // bcrypt — kompatibel dengan format hash Supabase ($2a$/$2b$/$2y$)
      hash: (password: string) => bcrypt.hash(password, 10),
      verify: ({ password, hash }: { password: string; hash: string }) =>
        bcrypt.compare(password, hash),
    },

    // Kirim link reset password. Tanpa penyedia email, link dicatat di log server
    // supaya admin bisa meneruskan ke user (lihat docs/setup.md).
    sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
      const apiKey = process.env.RESEND_API_KEY;
      const from = process.env.RESEND_FROM || "Nyari_ide <onboarding@resend.dev>";

      if (apiKey) {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: user.email,
            subject: "Reset password Nyari_ide",
            html: `<p>Klik link berikut untuk mengatur ulang password Anda (berlaku 1 jam):</p><p><a href="${url}">${url}</a></p><p>Jika Anda tidak meminta ini, abaikan email ini.</p>`,
          }),
        });
        if (!res.ok) {
          console.error("[auth] Gagal kirim email reset via Resend:", res.status, await res.text());
        }
        return;
      }

      // Fallback: catat link di log server
      console.log(`\n[auth] LINK RESET PASSWORD untuk ${user.email}:\n${url}\n`);
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 hari
    updateAge: 60 * 60 * 24, // refresh harian
  },

  // Whitelist: hanya email yang terdaftar di allowed_emails boleh mendaftar
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        const email = (ctx.body?.email as string | undefined)?.trim().toLowerCase();
        if (!email) {
          throw new APIError("BAD_REQUEST", { message: "Email wajib diisi." });
        }
        const result = await pool.query(
          "SELECT id FROM allowed_emails WHERE lower(email) = $1",
          [email]
        );
        if (result.rows.length === 0) {
          throw new APIError("FORBIDDEN", {
            message: "Email ini tidak terdaftar di whitelist. Hubungi admin.",
          });
        }
      }
    }),
  },
});
