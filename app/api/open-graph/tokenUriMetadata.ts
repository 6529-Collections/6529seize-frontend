import { readLimitedJson } from "@/lib/fetch/limitedBody";
import { discardResponse } from "@/lib/fetch/fetchDeadline";
import { AdmissionQueue } from "@/lib/fetch/admissionQueue";
import { fetchPublicUrl, type UrlGuardOptions } from "@/lib/security/urlGuard";

// NFT metadata sometimes embeds substantial artwork. Count decoded bytes, not
// the compressed Content-Length, and keep the existing permissive MIME handling.
export const TOKEN_URI_MAX_BYTES = 64 * 1024 * 1024;
const TOKEN_URI_TIMEOUT_MS = 4000;
// Metadata can contain substantial embedded art. Keep the generous byte limit
// without allowing a batch to buffer and parse several such documents at once.
const metadataAdmission = new AdmissionQueue({ maxPending: 32, waitMs: 15_000 });

export async function fetchTokenUriJson(
  url: URL,
  options: UrlGuardOptions
): Promise<unknown> {
  const release = await metadataAdmission.acquire();
  try {
    const response = await fetchPublicUrl(
      url,
      { headers: { Accept: "application/json" } },
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
