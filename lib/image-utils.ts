// lib/image-utils.ts — Kompres gambar sebelum dikirim ke API
// Gambar yang dikirim ke Groq dikonversi ke token, semakin besar gambar = semakin banyak token = semakin cepat rate limit habis.
// Groq limit: max 8000 TPM untuk qwen/qwen3.8-27b (free tier)

const MAX_DIMENSION = 512;
const JPEG_QUALITY = 0.6;

/**
 * Compress image: resize ke max 512px + convert ke JPEG quality 60%
 * Selalu mengembalikan data:image/jpeg;base64,... (bukan WebP/PNG)
 * Groq lebih stabil dengan JPEG.
 */
export function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Resize jika lebih besar dari MAX
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Pastikan minimal 10x10 (Groq tolak gambar terlalu kecil)
      width = Math.max(width, 10);
      height = Math.max(height, 10);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      // Fill putih di belakang (untuk gambar transparan/PNG)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Selalu output JPEG (bukan WebP)
      const compressed = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      resolve(compressed);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
}
