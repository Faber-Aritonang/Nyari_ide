// lib/site-url.ts — Satu sumber kebenaran untuk URL publik app.
//
// Dipakai untuk baseURL Better Auth, trustedOrigins, dan link share.
// Di Vercel, `VERCEL_PROJECT_PRODUCTION_URL` (produksi) dan `VERCEL_URL`
// (deployment yang sedang jalan) tersedia otomatis. Kita pakainya sebagai
// jaring pengaman supaya link reset password / link share tidak salah arah
// ke `localhost` kalau env belum di-set dengan benar saat deploy.

const LOCALHOST_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/** Domain yang disediakan otomatis oleh Vercel (tanpa skema), jika ada. */
export function getVercelOrigin(): string | undefined {
  const host =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  return host ? `https://${stripTrailingSlash(host)}` : undefined;
}

/**
 * Origin publik app.
 * - Utamakan `BETTER_AUTH_URL`, lalu `NEXT_PUBLIC_SITE_URL`.
 * - Saat berjalan di Vercel, jangan pernah pakai localhost: kalau nilai yang
 *   dikonfigurasi mengarah ke localhost, pakai domain Vercel.
 */
export function getSiteOrigin(): string | undefined {
  const configured =
    process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL;
  const vercelOrigin = getVercelOrigin();

  if (configured && !(vercelOrigin && LOCALHOST_RE.test(configured))) {
    return stripTrailingSlash(configured);
  }
  return vercelOrigin ?? (configured ? stripTrailingSlash(configured) : undefined);
}

/** Origin yang boleh mengirim request ke endpoint auth (CSRF check Better Auth). */
export function getTrustedOrigins(): string[] {
  return Array.from(
    new Set(
      [
        "http://localhost:3000",
        process.env.NEXT_PUBLIC_SITE_URL,
        getVercelOrigin(),
        getSiteOrigin(),
      ].filter(Boolean) as string[]
    )
  ).map(stripTrailingSlash);
}
