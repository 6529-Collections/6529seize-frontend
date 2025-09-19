import type { FarcasterPreviewResponse } from "@/types/farcaster.types";

const previewCache = new Map<string, Promise<FarcasterPreviewResponse>>();

const normalizeUrl = (url: string): string => url.trim();

export const fetchFarcasterPreview = async (
  url: string
): Promise<FarcasterPreviewResponse> => {
  const normalized = normalizeUrl(url);
  if (!normalized) {
    throw new Error("A valid URL is required to fetch Farcaster metadata.");
  }

  const cached = previewCache.get(normalized);
  if (cached) {
    return cached;
  }

  const params = new URLSearchParams({ url: normalized });

  const request = fetch(`/api/farcaster?${params.toString()}`, {
    headers: { Accept: "application/json" },
  })
    .then(async (response) => {
      if (!response.ok) {
        let errorMessage = "Failed to fetch Farcaster metadata.";
        try {
          const body = (await response.json()) as { error?: unknown };
          if (body && typeof body.error === "string" && body.error) {
            errorMessage = body.error;
          }
        } catch {
          // ignore parse errors
        }
        throw new Error(errorMessage);
      }

      return (await response.json()) as FarcasterPreviewResponse;
    })
    .catch((error) => {
      previewCache.delete(normalized);
      throw error;
    });

  previewCache.set(normalized, request);
  return request;
};
