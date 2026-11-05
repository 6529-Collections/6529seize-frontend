import { NextResponse, type NextRequest } from "next/server";

import { readJsonBody } from "@/app/api/alchemy/readJsonBody";
import {
  INTERACTIVE_MEDIA_PROVIDERS,
  type InteractiveMediaProvider,
} from "@/components/waves/memes/submission/constants/media";
import { createClientRateLimiter } from "@/lib/security/clientRateLimit";
import { validateInteractivePreview } from "./validateInteractivePreview";

// The Memes submission form asks this route whether a hosted IPFS/Arweave
// artwork answers as an HTML document. It replaces a Server Action and keeps
// that action's request guards, plus a few it lacked:
// - POST only (Next answers other methods with 405);
// - same-origin only: the Origin header is required and must match Host or
//   X-Forwarded-Host, the check Next applies to Server Actions (which also let
//   requests without Origin through);
// - a JSON body of at most MAX_BODY_BYTES with exactly `provider` and `path`;
// - a per-client rate limit;
// - every response is no-store.
// The outbound request and its allow-lists live, unchanged, in
// validateInteractivePreview.
//
// Behind CloudFront (staging and production) the page behaviour forwards all
// viewer headers (Managed-AllViewer), so Node sees the viewer's Origin and Host
// and the two match for the site's own pages. X-Forwarded-Host needs no trust:
// a cross-site page cannot set it without a CORS preflight, which this route
// never approves, and a non-browser client can send any Origin anyway.

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;
const MAX_BODY_BYTES = 2 * 1024;
// Longer than any root CID or Arweave transaction ID the validator accepts.
const MAX_PATH_LENGTH = 256;
const BODY_KEYS = ["path", "provider"];
const PROVIDERS: ReadonlySet<string> = new Set(
  INTERACTIVE_MEDIA_PROVIDERS.map((provider) => provider.key)
);

// Each check sends at most a HEAD and a ranged GET (and up to three approved
// redirects) to the media gateway; a creator validates one hash at a time.
const enforceRateLimit = createClientRateLimiter({
  limit: 30,
  windowMs: 60 * 1000,
  errorMessage: "Too many interactive preview checks",
});

type ValidationRequest = {
  readonly provider: InteractiveMediaProvider;
  readonly path: string;
};

function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json(
    { error: message },
    { status, headers: NO_STORE_HEADERS }
  );
}

function firstHeaderValue(value: string | null): string | null {
  const first = value?.split(",")[0]?.trim();
  return first === undefined || first === "" ? null : first;
}

function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") {
    return false;
  }
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  return (
    originHost === firstHeaderValue(request.headers.get("x-forwarded-host")) ||
    originHost === request.headers.get("host")
  );
}

function isJsonRequest(request: NextRequest): boolean {
  const contentType = request.headers.get("content-type") ?? "";
  return (
    contentType.split(";")[0]?.trim().toLowerCase() === "application/json"
  );
}

function parseValidationRequest(body: unknown): ValidationRequest | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return null;
  }
  const record = body as Record<string, unknown>;
  const keys = Object.keys(record).sort((left, right) =>
    left.localeCompare(right)
  );
  if (keys.join(",") !== BODY_KEYS.join(",")) {
    return null;
  }
  const { provider, path } = record;
  if (typeof provider !== "string" || !PROVIDERS.has(provider)) {
    return null;
  }
  if (typeof path !== "string" || path.length > MAX_PATH_LENGTH) {
    return null;
  }
  return { provider: provider as InteractiveMediaProvider, path };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return jsonError("Cross-origin requests are not allowed", 403);
  }

  const rateLimited = enforceRateLimit(request);
  if (rateLimited) {
    return rateLimited;
  }

  if (!isJsonRequest(request)) {
    return jsonError("Content-Type must be application/json", 415);
  }

  const read = await readJsonBody<unknown>({
    request,
    maxBodyBytes: MAX_BODY_BYTES,
    jsonError,
  });
  if (!read.ok) {
    return read.response;
  }

  const validationRequest = parseValidationRequest(read.body);
  if (!validationRequest) {
    return jsonError("Expected { provider, path }");
  }

  const result = await validateInteractivePreview(validationRequest);
  return NextResponse.json(result, { headers: NO_STORE_HEADERS });
}
