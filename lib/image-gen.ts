// lib/image-gen.ts — Text-to-image via Pollinations.ai (Flux model)
// 100% gratis, tanpa API key. Cukup GET request.

const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";

export type ImageSize = "512" | "768" | "1024";

export const IMAGE_SIZES: { value: ImageSize; label: string }[] = [
  { value: "512", label: "512×512 (cepat)" },
  { value: "768", label: "768×768 (sedang)" },
  { value: "1024", label: "1024×1024 (detail)" },
];

/**
 * Generate image URL dari text prompt via Pollinations.ai
 * Mengembalikan URL gambar (JPEG) yang bisa langsung ditampilkan di <img>.
 */
export function generateImageUrl(
  prompt: string,
  size: ImageSize = "1024",
  seed?: number
): string {
  const encoded = encodeURIComponent(prompt);
  let url = `${POLLINATIONS_BASE}/${encoded}?width=${size}&height=${size}&model=flux&nologo=true`;
  if (seed !== undefined) {
    url += `&seed=${seed}`;
  }
  return url;
}

/**
 * Download gambar dari URL sebagai file.
 */
export async function downloadImage(
  url: string,
  filename: string = "nyari-ide-image.jpg"
): Promise<void> {
  const response = await fetch(url);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}
