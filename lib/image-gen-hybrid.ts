// lib/image-gen-hybrid.ts — Hybrid Text-to-Image (Multi-Provider)
// Supports: Pollinations.ai (free, no key), Cloudflare Workers AI (free tier)
// Strategy: Cloudflare (quality) → Pollinations (fallback)

export type ImageProvider = "cloudflare" | "pollinations";
export type ImageSize = "512" | "768" | "1024";

export interface ImageGenerationOptions {
  provider?: ImageProvider;
  size?: ImageSize;
  seed?: number;
  aspectRatio?: "1:1" | "16:9" | "9:16";
}

export interface ImageGenerationResult {
  url: string;
  provider: ImageProvider;
  success: boolean;
  error?: string;
}

// Provider configurations
const PROVIDERS = {
  cloudflare: {
    name: "Cloudflare Workers AI (FLUX)",
    maxSize: "1024",
    freeLimit: 10000, // neurons per day
    costPerImage: 0.000053, // USD per 512x512 tile
  },
  pollinations: {
    name: "Pollinations.ai (Gratis)",
    maxSize: "1024",
    freeLimit: -1, // unlimited (rate limited)
  },
} as const;

/**
 * Generate image using Cloudflare Workers AI (FLUX.1 schnell)
 * Free tier: 10,000 neurons/day
 * Cost: ~$0.000053 per 512x512 tile
 */
async function generateWithCloudflare(
  prompt: string,
  size: ImageSize
): Promise<ImageGenerationResult> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return {
      url: "",
      provider: "cloudflare",
      success: false,
      error: "CLOUDFLARE_ACCOUNT_ID atau CLOUDFLARE_API_TOKEN belum dikonfigurasi",
    };
  }

  try {
    const model = "@cf/black-forest-labs/flux-1-schnell";
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Cloudflare] Error response:", JSON.stringify(errorData));
      const detail = errorData.errors?.[0]?.message || errorData.error || "";
      let errorMsg = `Cloudflare API error: ${response.status}`;
      if (detail) errorMsg += ` — ${detail}`;
      if (response.status === 429) {
        errorMsg = "Kuota Cloudflare gratis sudah habis. Coba lagi besok.";
      }
      return {
        url: "",
        provider: "cloudflare",
        success: false,
        error: errorMsg,
      };
    }

    const data = await response.json();

    if (data.success && data.result?.image) {
      const dataUrl = `data:image/jpeg;base64,${data.result.image}`;
      return {
        url: dataUrl,
        provider: "cloudflare",
        success: true,
      };
    }

    return {
      url: "",
      provider: "cloudflare",
      success: false,
      error: "No image in Cloudflare response",
    };
  } catch (error) {
    return {
      url: "",
      provider: "cloudflare",
      success: false,
      error: `Cloudflare error: ${error instanceof Error ? error.message : "Unknown"}`,
    };
  }
}

/**
 * Generate image using Pollinations.ai (free, no API key)
 */
async function generateWithPollinations(
  prompt: string,
  size: ImageSize,
  seed?: number
): Promise<ImageGenerationResult> {
  try {
    const encoded = encodeURIComponent(prompt);
    let url = `https://image.pollinations.ai/prompt/${encoded}?width=${size}&height=${size}&model=flux`;

    if (seed !== undefined) {
      url += `&seed=${seed}`;
    }

    // Return URL directly - image loading is verified by the caller
    return {
      url,
      provider: "pollinations",
      success: true,
    };
  } catch (error) {
    return {
      url: "",
      provider: "pollinations",
      success: false,
      error: `Pollinations error: ${error instanceof Error ? error.message : "Unknown"}`,
    };
  }
}

/**
 * Hybrid image generation with automatic fallback
 * Priority: Cloudflare → Pollinations
 */
export async function generateImageHybrid(
  prompt: string,
  options: ImageGenerationOptions = {}
): Promise<ImageGenerationResult> {
  const {
    provider = "cloudflare",
    size = "1024",
    seed,
  } = options;

  // If specific provider requested, try only that
  if (provider === "cloudflare") {
    return generateWithCloudflare(prompt, size);
  }

  if (provider === "pollinations") {
    return generateWithPollinations(prompt, size, seed);
  }

  // Auto fallback mode
  // Try Cloudflare first (better quality)
  const cloudflareResult = await generateWithCloudflare(prompt, size);
  if (cloudflareResult.success) {
    return cloudflareResult;
  }

  console.log("[ImageGen] Cloudflare failed, trying Pollinations...");

  // Fallback to Pollinations (free, no quota issues)
  const pollinationsResult = await generateWithPollinations(prompt, size, seed);
  return pollinationsResult;
}

/**
 * Generate image URL (for backward compatibility)
 */
export function generateImageUrl(
  prompt: string,
  size: ImageSize = "1024",
  seed?: number
): string {
  // For URL-based generation (sync), use Pollinations
  const encoded = encodeURIComponent(prompt);
  let url = `https://image.pollinations.ai/prompt/${encoded}?width=${size}&height=${size}&model=flux`;

  if (seed !== undefined) {
    url += `&seed=${seed}`;
  }

  return url;
}

/**
 * Download image from URL
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

/**
 * Get provider info
 */
export function getProviderInfo() {
  return PROVIDERS;
}
