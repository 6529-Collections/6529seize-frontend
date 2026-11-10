import { readLimitedJson } from "@/lib/fetch/limitedBody";
import { discardResponse } from "@/lib/fetch/fetchDeadline";
import { AdmissionQueue } from "@/lib/fetch/admissionQueue";
import { fetchPublicUrl, type UrlGuardOptions } from "@/lib/security/urlGuard";

// Previews read only the image, name and description. JSON.parse runs on the
// event loop, and its cost grows with the document's structure, not just its
// size: on Node 24 a 1 MiB document of tiny nested arrays still takes about
// 100-130 ms to parse. Count decoded bytes, not the compressed
// Content-Length, and keep the existing permissive MIME handling. Metadata
// that embeds larger artwork yields no metadata here, and the preview falls
// back to the page's own metadata.
export const TOKEN_URI_MAX_BYTES = 1024 * 1024;
const TOKEN_URI_TIMEOUT_MS = 4000;
// Parse one document at a time, so a batch never stacks several parses.
const metadataAdmission = new AdmissionQueue({
  maxPending: 32,
  waitMs: 15_000,
});

export async function fetchTokenUriJson(
  url: URL,
  options: UrlGuardOptions,
  signal?: AbortSignal
): Promise<unknown> {
  const release = await metadataAdmission.acquire(signal);
  try {
    const response = await fetchPublicUrl(
      url,
      {
        headers: { Accept: "application/json" },
        ...(signal ? { signal } : {}),
      },
      {
        ...options,
        timeoutMs: TOKEN_URI_TIMEOUT_MS,
        maxRedirects: 5,
      }
    );
    if (!response.ok) {
      discardResponse(response);
      throw new Error("NFT metadata request failed.");
    }
    return await readLimitedJson<unknown>(response, TOKEN_URI_MAX_BYTES);
  } finally {
    release();
  }
}
