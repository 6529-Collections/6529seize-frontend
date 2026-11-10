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
// A few documents at a time, so a batch of NFT links never stacks many
// parses. Callers hold a preview slot while they wait, so the wait is short;
// a lookup that is not admitted in time fails and the preview falls back to
// the page's own metadata.
const metadataAdmission = new AdmissionQueue({
  concurrency: 4,
  maxPending: 32,
  waitMs: 2_000,
});

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
