import { NextResponse, type NextRequest } from "next/server";

import { readJsonBody } from "@/app/api/alchemy/readJsonBody";
import { createClientRateLimiter } from "@/lib/security/clientRateLimit";
import { resolveGithubPreview } from "./service";
import type { GithubPreviewResponse } from "@/services/api/github-preview-api";

interface GithubPreviewBatchRequest {
  readonly urls?: unknown;
}

interface GithubPreviewBatchResult {
  readonly url: string;
  readonly preview: GithubPreviewResponse;
}

interface GithubPreviewBatchError {
  readonly url: string;
  readonly error: string;
}

interface GithubPreviewBatchResponse {
  readonly results: readonly GithubPreviewBatchResult[];
  readonly errors: readonly GithubPreviewBatchError[];
}

type GithubPreviewBatchItem =
  | GithubPreviewBatchResult
  | GithubPreviewBatchError;

const GITHUB_PREVIEW_BATCH_MAX_URLS = 10;
// Ten URLs of at most a few hundred characters fit well inside this.
const GITHUB_PREVIEW_BATCH_MAX_BODY_BYTES = 16 * 1024;
const GITHUB_PREVIEW_METADATA_ERROR_MESSAGE =
  "Failed to fetch GitHub preview metadata.";

// Each requested URL costs one unit. Visible status badges poll every 30
// seconds, so even a screen full of GitHub links stays far below this budget.
const enforceRateLimit = createClientRateLimiter({
  limit: 300,
  windowMs: 60 * 1000,
  errorMessage: "Too many GitHub preview requests",
});

const readErrorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : GITHUB_PREVIEW_METADATA_ERROR_MESSAGE;

export async function GET(request: NextRequest) {
  const rateLimitResponse = enforceRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const preview = await resolveGithubPreview(
      request.nextUrl.searchParams.get("url"),
      { bypassCache: request.nextUrl.searchParams.get("refresh") === "1" }
    );
    return NextResponse.json(preview);
  } catch (error) {
    return NextResponse.json(
      { error: readErrorMessage(error) },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  const bodyResult = await readJsonBody<GithubPreviewBatchRequest | null>({
    request,
    maxBodyBytes: GITHUB_PREVIEW_BATCH_MAX_BODY_BYTES,
    jsonError: (message, status) =>
      NextResponse.json({ error: message }, { status: status ?? 400 }),
  });
  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  try {
    const rawUrls = bodyResult.body?.urls;
    const urls = Array.isArray(rawUrls)
      ? rawUrls.filter((url): url is string => typeof url === "string")
      : [];
    const uniqueUrls = Array.from(
      new Set(urls.map((url) => url.trim()))
    ).filter((url) => url.length > 0);

    if (uniqueUrls.length === 0) {
      return NextResponse.json(
        { error: "At least one GitHub URL is required." },
        { status: 400 }
      );
    }

    if (uniqueUrls.length > GITHUB_PREVIEW_BATCH_MAX_URLS) {
      return NextResponse.json(
        {
          error: `GitHub preview batches support up to ${GITHUB_PREVIEW_BATCH_MAX_URLS} URLs.`,
        },
        { status: 400 }
      );
    }

    const rateLimitResponse = enforceRateLimit(request, uniqueUrls.length);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const items: readonly GithubPreviewBatchItem[] = await Promise.all(
      uniqueUrls.map(async (url) => {
        try {
          return {
            url,
            preview: await resolveGithubPreview(url),
          };
        } catch (error: unknown) {
          return {
            url,
            error: readErrorMessage(error),
          };
        }
      })
    );
    const response: GithubPreviewBatchResponse = {
      results: items.filter(
        (item): item is GithubPreviewBatchResult => "preview" in item
      ),
      errors: items.filter(
        (item): item is GithubPreviewBatchError => "error" in item
      ),
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: readErrorMessage(error) },
      { status: 400 }
    );
  }
}

export const dynamic = "force-dynamic";
