// lib/image-gen.ts — Text-to-image (Hybrid Multi-Provider)
// Supports: Gemini Flash (free), Pollinations.ai (free), FLUX Pro (paid)

export type ImageSize = "512" | "768" | "1024";
export type ImageProvider = "gemini" | "pollinations" | "flux";

export const IMAGE_SIZES: { value: ImageSize; label: string }[] = [
  { value: "512", label: "512×512 (cepat)" },
  { value: "768", label: "768×768 (sedang)" },
  { value: "1024", label: "1024×1024 (detail)" },
];

export const IMAGE_PROVIDERS: { value: ImageProvider; label: string; free: boolean }[] = [
  { value: "gemini", label: "🤖 Gemini Flash (Gratis 500/day)", free: true },
  { value: "pollinations", label: "🎨 Pollinations.ai (Gratis)", free: true },
  { value: "flux", label: "✨ FLUX 1.1 Pro ($0.04/img)", free: false },
];

// Re-export hybrid functions
export {
  generateImageHybrid,
  downloadImage,
  getProviderInfo,
  type ImageGenerationOptions,
  type ImageGenerationResult,
} from "./image-gen-hybrid";

// Legacy function for backward compatibility (sync URL generation)
const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";

export function generateImageUrl(
  prompt: string,
  size: ImageSize = "1024",
  seed?: number
): string {
  const encoded = encodeURIComponent(prompt);
  let url = `${POLLINATIONS_BASE}/${encoded}?width=${size}&height=${size}&model=flux`;
  if (seed !== undefined) {
    url += `&seed=${seed}`;
  }
  return url;
}
