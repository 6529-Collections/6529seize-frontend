import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  MUSEUM_MEDIA_PROXY_ALLOWED_HOSTS,
  isMuseumMediaProxyAllowedUrl,
} from "@/lib/museum/runtime/mediaDelivery";
import {
  UrlGuardError,
  fetchPublicUrl,
  parsePublicUrl,
  type FetchPublicUrlOptions,
} from "@/lib/security/urlGuard";

const REQUEST_TIMEOUT_MS = 8_000;
const MAX_ASSET_BYTES = 16 * 1024 * 1024;
const CACHE_CONTROL = "public, max-age=31536000, immutable";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const FETCH_OPTIONS: FetchPublicUrlOptions = {
  policy: { allowedHosts: MUSEUM_MEDIA_PROXY_ALLOWED_HOSTS },
  timeoutMs: REQUEST_TIMEOUT_MS,
  userAgent: USER_AGENT,
};
const ERROR_CACHE_HEADERS = { "Cache-Control": "no-store" };

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json(
    { error: message },
    { status, headers: ERROR_CACHE_HEADERS }
  );
}

function parseAssetUrl(value: string | null): URL | NextResponse {
  try {
    const parsed = parsePublicUrl(value, { allowedProtocols: ["https:"] });
    if (!isMuseumMediaProxyAllowedUrl(parsed.toString())) {
      return jsonError("Unsupported Museum media URL", 400);
    }
    return parsed;
  } catch (error) {
    if (error instanceof UrlGuardError) {
      return jsonError("Invalid Museum media URL", error.statusCode);
    }
    return jsonError("Invalid Museum media URL", 400);
  }
}

function isOversizedResponse(headers: Headers): boolean {
  const contentLength = headers.get("content-length");
  if (contentLength === null) return false;
  const bytes = Number(contentLength);
  return Number.isFinite(bytes) && bytes > MAX_ASSET_BYTES;
}

async function readBodyWithLimit(
  body: ReadableStream<Uint8Array>
): Promise<ArrayBuffer | NextResponse> {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_ASSET_BYTES) {
        await reader.cancel("Museum media response is too large");
        return jsonError("Museum media response is too large", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const result = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result.buffer;
}

function guardErrorResponse(error: UrlGuardError): NextResponse {
  if (error.kind === "timeout") {
    return jsonError("Museum media upstream timeout", 504);
  }
  if (
    error.kind === "fetch-failed" ||
    error.kind === "too-many-redirects" ||
    error.kind === "redirect-location-missing" ||
    error.kind === "redirect-location-invalid"
  ) {
    return jsonError("Failed to fetch Museum media", 502);
  }
  return jsonError("Unsupported Museum media URL", error.statusCode);
}

async function proxyAsset(url: URL): Promise<NextResponse> {
  try {
    const response = await fetchPublicUrl(
      url,
      { headers: { accept: "image/webp" } },
      FETCH_OPTIONS
    );
    if (!response.ok || response.body === null) {
      return jsonError(
        `Failed to fetch Museum media (${response.status})`,
        502
      );
    }

    const finalUrl = response.url.length > 0 ? new URL(response.url) : url;
    if (!isMuseumMediaProxyAllowedUrl(finalUrl.toString())) {
      return jsonError("Unsupported Museum media URL", 400);
    }
    if (response.headers.get("content-type")?.toLowerCase() !== "image/webp") {
      return jsonError("Unsupported Museum media content type", 415);
    }
    if (isOversizedResponse(response.headers)) {
      return jsonError("Museum media response is too large", 413);
    }

    const body = await readBodyWithLimit(response.body);
    if (body instanceof NextResponse) return body;
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Cache-Control": CACHE_CONTROL,
        "Content-Type": "image/webp",
        "Cross-Origin-Resource-Policy": "same-origin",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof UrlGuardError) return guardErrorResponse(error);
    return jsonError("Failed to fetch Museum media", 502);
  }
}

export async function GET(request: NextRequest) {
  const parsed = parseAssetUrl(request.nextUrl.searchParams.get("url"));
  return parsed instanceof NextResponse ? parsed : proxyAsset(parsed);
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
