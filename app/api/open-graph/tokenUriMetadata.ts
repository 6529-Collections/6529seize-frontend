import { readLimitedJson } from "@/lib/fetch/limitedBody";
import { discardResponse } from "@/lib/fetch/fetchDeadline";
import { fetchPublicUrl, type UrlGuardOptions } from "@/lib/security/urlGuard";

// NFT metadata sometimes embeds substantial artwork. Count decoded bytes, not
// the compressed Content-Length, and keep the existing permissive MIME handling.
export const TOKEN_URI_MAX_BYTES = 64 * 1024 * 1024;
const TOKEN_URI_TIMEOUT_MS = 4000;

export async function fetchTokenUriJson(
  url: URL,
  options: UrlGuardOptions
): Promise<unknown> {
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
  return readLimitedJson<unknown>(response, TOKEN_URI_MAX_BYTES);
}
