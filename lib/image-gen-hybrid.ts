// lib/image-gen-hybrid.ts — Hybrid Text-to-Image (Multi-Provider)
// Supports: Gemini Flash, Pollinations.ai, FLUX Pro
// Strategy: Gemini (free 500/day) → Pollinations (fallback) → FLUX (premium)

export type ImageProvider = "gemini" | "pollinations" | "flux";
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
  gemini: {
    name: "Gemini Flash Image",
    maxSize: "1024",
    freeLimit: 500, // per day
  },
  pollinations: {
    name: "Pollinations.ai",
    maxSize: "1024",
    freeLimit: -1, // unlimited (rate limited)
  },
  flux: {
    name: "FLUX 1.1 Pro",
    maxSize: "1024",
    freeLimit: 0,
    costPerImage: 0.04, // USD
  },
} as const;

/**
 * Generate image using Google Gemini 2.5 Flash Image
 * Free tier: 500 requests/day
 */
async function generateWithGemini(
  prompt: string,
  size: ImageSize
): Promise<ImageGenerationResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      url: "",
      provider: "gemini",
      success: false,
      error: "GEMINI_API_KEY not configured",
    };
  }

  try {
    // Use gemini-2.5-flash-image for image generation
    const model = "gemini-2.5-flash-image";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Generate a high-quality image based on this description: ${prompt}. Make it detailed, vivid, and visually appealing.`,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        url: "",
        provider: "gemini",
        success: false,
        error: `Gemini API error: ${response.status}`,
      };
    }

    const data = await response.json();

    // Extract image from response
    const candidates = data.candidates || [];
    if (candidates.length === 0) {
      return {
        url: "",
        provider: "gemini",
        success: false,
        error: "No candidates in response",
      };
    }

    const parts = candidates[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        // Convert base64 to data URL
        const mimeType = part.inlineData.mimeType || "image/png";
        const dataUrl = `data:${mimeType};base64,${part.inlineData.data}`;
        return {
          url: dataUrl,
          provider: "gemini",
          success: true,
        };
      }
    }

    return {
      url: "",
      provider: "gemini",
      success: false,
      error: "No image in response",
    };
  } catch (error) {
    return {
      url: "",
      provider: "gemini",
      success: false,
      error: `Gemini error: ${error instanceof Error ? error.message : "Unknown"}`,
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
 * Generate image using FLUX 1.1 Pro via fal.ai
 * Cost: $0.04 per image
 */
async function generateWithFLUX(
  prompt: string,
  size: ImageSize
): Promise<ImageGenerationResult> {
  const apiKey = process.env.FAL_API_KEY;

  if (!apiKey) {
    return {
      url: "",
      provider: "flux",
      success: false,
      error: "FAL_API_KEY not configured",
    };
  }

  try {
    const imageSize =
      size === "1024"
        ? "landscape_16_9"
        : size === "768"
          ? "square_hd"
          : "square";

    const response = await fetch("https://fal.run/fal-ai/flux-pro/v1.1", {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        image_size: imageSize,
        num_inference_steps: 28,
        guidance_scale: 3.5,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        url: "",
        provider: "flux",
        success: false,
        error: `FLUX API error: ${response.status}`,
      };
    }

    const data = await response.json();

    if (data.images && data.images.length > 0) {
      return {
        url: data.images[0].url,
        provider: "flux",
        success: true,
      };
    }

    return {
      url: "",
      provider: "flux",
      success: false,
      error: "No images in response",
    };
  } catch (error) {
    return {
      url: "",
      provider: "flux",
      success: false,
      error: `FLUX error: ${error instanceof Error ? error.message : "Unknown"}`,
    };
  }
}

/**
 * Hybrid image generation with automatic fallback
 * Priority: Gemini → Pollinations → FLUX
 */
export async function generateImageHybrid(
  prompt: string,
  options: ImageGenerationOptions = {}
): Promise<ImageGenerationResult> {
  const {
    provider = "gemini",
    size = "1024",
    seed,
  } = options;

  // If specific provider requested, try only that
  if (provider === "gemini") {
    return generateWithGemini(prompt, size);
  }

  if (provider === "pollinations") {
    return generateWithPollinations(prompt, size, seed);
  }

  if (provider === "flux") {
    return generateWithFLUX(prompt, size);
  }

  // Auto fallback mode
  // Try Pollinations first (free, no quota issues)
  const pollinationsResult = await generateWithPollinations(prompt, size, seed);
  if (pollinationsResult.success) {
    return pollinationsResult;
  }

  console.log("[ImageGen] Pollinations failed, trying Gemini...");

  // Fallback to Gemini (free, but quota limited)
  const geminiResult = await generateWithGemini(prompt, size);
  if (geminiResult.success) {
    return geminiResult;
  }

  console.log("[ImageGen] Gemini failed, trying FLUX...");

  // Fallback to FLUX (paid)
  const fluxResult = await generateWithFLUX(prompt, size);
  return fluxResult;
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
  let url = `https://image.pollinations.ai/prompt/${encoded}?width=${size}&height=${size}&model=gpt-image-2&nologo=true`;

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
