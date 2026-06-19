import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  PROFILE_CMS_ASSET_PROXY_ALLOWED_HOSTS,
  isProfileCmsAssetProxyAllowedUrl,
} from "@/lib/profile-cms/runtime/mediaProxy";
import {
  UrlGuardError,
  fetchPublicUrl,
  parsePublicUrl,
  type FetchPublicUrlOptions,
} from "@/lib/security/urlGuard";

const ASSET_PROXY_TIMEOUT_MS = 8000;
const MAX_ASSET_BYTES = 16 * 1024 * 1024;
const ACCEPT_HEADER =
  "image/avif,image/webp,image/png,image/jpeg,image/gif,application/json;q=0.9,*/*;q=0.2";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const FETCH_OPTIONS: FetchPublicUrlOptions = {
  policy: {
    allowedHosts: PROFILE_CMS_ASSET_PROXY_ALLOWED_HOSTS,
  },
  timeoutMs: ASSET_PROXY_TIMEOUT_MS,
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
    if (!isProfileCmsAssetProxyAllowedUrl(parsed.toString())) {
      return jsonError("Unsupported CMS asset URL", 400);
    }
    return parsed;
  } catch (error) {
    if (error instanceof UrlGuardError) {
      return jsonError("Invalid CMS asset URL", error.statusCode);
    }
    return jsonError("Invalid CMS asset URL", 400);
  }
}

function isAllowedContentType(contentType: string): boolean {
  const normalized = contentType.toLowerCase();
  return (
    normalized.startsWith("image/") || normalized.startsWith("application/json")
  );
}

function getCacheControl(contentType: string): string {
  if (contentType.toLowerCase().startsWith("application/json")) {
    return "public, max-age=300, s-maxage=300";
  }

  return "public, max-age=86400, s-maxage=86400";
}

function isOversizedResponse(headers: Headers): boolean {
  const contentLength = headers.get("content-length");
  if (!contentLength) {
    return false;
  }

  const bytes = Number(contentLength);
  return !Number.isFinite(bytes) || bytes < 0 || bytes > MAX_ASSET_BYTES;
}

function getKnownBodyByteLength(body: BodyInit): number | null {
  if (typeof body === "string") {
    return new TextEncoder().encode(body).byteLength;
  }

  if (body instanceof Blob) {
    return body.size;
  }

  if (body instanceof ArrayBuffer) {
    return body.byteLength;
  }

  if (ArrayBuffer.isView(body)) {
    return body.byteLength;
  }

  return null;
}

function combineChunks(
  chunks: readonly Uint8Array[],
  totalBytes: number
): ArrayBuffer {
  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body.buffer as ArrayBuffer;
}

async function readStreamWithLimit(
  body: ReadableStream<Uint8Array>
): Promise<BodyInit | NextResponse> {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return combineChunks(chunks, totalBytes);
      }

      totalBytes += value.byteLength;
      if (totalBytes > MAX_ASSET_BYTES) {
        await reader.cancel("CMS asset response is too large");
        return jsonError("CMS asset response is too large", 413);
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
}

async function readBodyWithLimit(
  body: BodyInit
): Promise<BodyInit | NextResponse> {
  const knownBytes = getKnownBodyByteLength(body);
  if (knownBytes !== null) {
    if (knownBytes > MAX_ASSET_BYTES) {
      return jsonError("CMS asset response is too large", 413);
    }
    return body;
  }

  if (
    typeof ReadableStream !== "undefined" &&
    body instanceof ReadableStream
  ) {
    return readStreamWithLimit(body);
  }

  return body;
}

function mapGuardErrorToResponse(error: UrlGuardError): NextResponse {
  switch (error.kind) {
    case "timeout":
      return jsonError("CMS asset upstream timeout", 504);
    case "fetch-failed":
    case "too-many-redirects":
    case "redirect-location-missing":
    case "redirect-location-invalid":
      return jsonError("Failed to fetch CMS asset", 502);
    default:
      return jsonError("Unsupported CMS asset URL", error.statusCode);
  }
}

async function proxyAsset(url: URL): Promise<NextResponse> {
  try {
    const response = await fetchPublicUrl(
      url,
      {
        headers: {
          accept: ACCEPT_HEADER,
        },
      },
      FETCH_OPTIONS
    );

    if (!response.ok || !response.body) {
      return jsonError(`Failed to fetch CMS asset (${response.status})`, 502);
    }

    const finalUrl = response.url ? new URL(response.url) : url;
    if (!isProfileCmsAssetProxyAllowedUrl(finalUrl.toString())) {
      return jsonError("Unsupported CMS asset URL", 400);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !isAllowedContentType(contentType)) {
      return jsonError("Unsupported CMS asset content type", 415);
    }

    if (isOversizedResponse(response.headers)) {
      return jsonError("CMS asset response is too large", 413);
    }

    const headers = new Headers();
    headers.set("content-type", contentType);
    headers.set("Cache-Control", getCacheControl(contentType));
    headers.set("X-Content-Type-Options", "nosniff");

    const body = await readBodyWithLimit(response.body);
    if (body instanceof NextResponse) {
      return body;
    }

    return new NextResponse(body, {
      headers,
      status: 200,
    });
  } catch (error) {
    if (error instanceof UrlGuardError) {
      return mapGuardErrorToResponse(error);
    }
    return jsonError("Failed to proxy CMS asset", 502);
  }
}

// ts-prune-ignore-next: Next.js uses exported HTTP verb handlers via convention.
export async function GET(request: NextRequest) {
  const parsed = parseAssetUrl(request.nextUrl.searchParams.get("url"));
  if (parsed instanceof NextResponse) {
    return parsed;
  }

  return proxyAsset(parsed);
}

// ts-prune-ignore-next: Next.js framework consumes this export via route conventions.
export const dynamic = "force-dynamic";
// ts-prune-ignore-next: Next.js framework consumes this export via route conventions.
export const revalidate = 0;
