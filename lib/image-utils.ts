// lib/image-utils.ts — Kompres gambar sebelum dikirim ke API
// Gambar yang dikirim ke Groq dikonversi ke token, semakin besar gambar = semakin banyak token = semakin cepat rate limit habis.

const MAX_WIDTH = 512;
const MAX_HEIGHT = 512;
const JPEG_QUALITY = 0.7;

/**
 * Compress image: resize ke max 512x512 + convert ke JPEG quality 70%
 * Mengembalikan data URL (base64)
 */
export function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Resize jika lebih besar dari MAX
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      resolve(compressed);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
}
