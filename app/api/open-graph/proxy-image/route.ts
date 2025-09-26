import { NextRequest, NextResponse } from "next/server";

import {
  UrlGuardError,
  fetchPublicUrl,
  parsePublicUrl,
  type FetchPublicUrlOptions,
} from "@/lib/security/urlGuard";

const IMAGE_PROXY_TIMEOUT_MS = 5000;
const ALLOWED_HOST_SUFFIXES = ["sinaimg.cn"] as const;
const IMAGE_ACCEPT_HEADER = "image/avif,image/webp,image/png,image/jpeg;q=0.8,*/*;q=0.5";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function normalizeInputToUrl(input: RequestInfo | URL): URL {
  if (typeof input === "string") {
    return new URL(input);
  }

  if (input instanceof URL) {
    return new URL(input.toString());
  }

  if (typeof Request !== "undefined" && input instanceof Request) {
    return new URL(input.url);
  }

  if (typeof input === "object" && input !== null) {
    const maybeUrl = (input as { url?: unknown }).url;
    if (typeof maybeUrl === "string") {
      return new URL(maybeUrl);
    }

    if (maybeUrl instanceof URL) {
      return new URL(maybeUrl.toString());
    }
  }

  throw new UrlGuardError("Unsupported request input type.", "invalid-url");
}

function ensureHttpsDefaultPort(url: URL): void {
  if (url.protocol !== "https:") {
    throw new UrlGuardError("Only HTTPS URLs are supported.", "unsupported-protocol");
  }

  if (url.port && url.port !== "443") {
    throw new UrlGuardError("Only default HTTPS port is supported.", "host-not-allowed");
  }
}

const httpsOnlyFetch: typeof fetch = async (input, init) => {
  const url = normalizeInputToUrl(input);
  ensureHttpsDefaultPort(url);
  return fetch(input, init);
};

const PROXY_FETCH_OPTIONS: FetchPublicUrlOptions = {
  policy: {
    allowedHostSuffixes: ALLOWED_HOST_SUFFIXES,
  },
  timeoutMs: IMAGE_PROXY_TIMEOUT_MS,
  userAgent: USER_AGENT,
  fetchImpl: httpsOnlyFetch,
};

function ensureAllowedHttps(url: URL): NextResponse | null {
  try {
    ensureHttpsDefaultPort(url);
    return null;
  } catch (error) {
    if (error instanceof UrlGuardError) {
      return mapGuardErrorToResponse(error);
    }
    throw error;
  }
}

function mapGuardErrorToResponse(error: UrlGuardError): NextResponse {
  switch (error.kind) {
    case "missing-url":
    case "invalid-url":
    case "unsupported-protocol":
      return NextResponse.json({ error: "Invalid image url" }, { status: 400 });
    case "host-not-allowed":
    case "dns-lookup-failed":
    case "ip-not-allowed":
      return NextResponse.json({ error: "Unsupported image host" }, { status: 400 });
    case "timeout":
      return NextResponse.json({ error: "Upstream timeout" }, { status: 504 });
    default:
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
  }
}

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("url");

  if (!target) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  const remoteResult = parseRemoteUrl(target);
  if ("response" in remoteResult) {
    return remoteResult.response;
  }

  return proxyImage(remoteResult.url);
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseRemoteUrl(target: string): { url: URL } | { response: NextResponse } {
  try {
    const parsed = parsePublicUrl(target, { allowedProtocols: ["https:"] });
    const guardResponse = ensureAllowedHttps(parsed);
    if (guardResponse) {
      return { response: guardResponse };
    }
    return { url: parsed };
  } catch (error) {
    if (error instanceof UrlGuardError) {
      return { response: mapGuardErrorToResponse(error) };
    }
    return {
      response: NextResponse.json({ error: "Invalid image url" }, { status: 400 }),
    };
  }
}

async function proxyImage(remoteUrl: URL): Promise<NextResponse> {
  try {
    const response = await fetchPublicUrl(
      remoteUrl,
      {
        headers: {
          accept: IMAGE_ACCEPT_HEADER,
        },
      },
      PROXY_FETCH_OPTIONS
    );

    const finalUrl = response.url ? new URL(response.url) : remoteUrl;
    const guardResponse = ensureAllowedHttps(finalUrl);
    if (guardResponse) {
      return guardResponse;
    }

    if (!response.ok || !response.body) {
      return NextResponse.json(
        { error: `Failed to fetch image (${response.status})` },
        { status: 502 }
      );
    }

    const headers = new Headers();
    const contentType = response.headers.get("content-type");
    if (contentType) {
      headers.set("content-type", contentType);
    }
    headers.set("Cache-Control", "public, max-age=86400");

    return new NextResponse(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    if (error instanceof UrlGuardError) {
      return mapGuardErrorToResponse(error);
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json({ error: "Upstream timeout" }, { status: 504 });
    }

    return NextResponse.json({ error: "Failed to proxy image" }, { status: 502 });
  }
}
