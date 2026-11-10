import { NextResponse, type NextRequest } from "next/server";

import { readJsonBody } from "@/app/api/alchemy/readJsonBody";
import { createClientRateLimiter } from "@/lib/security/clientRateLimit";
import { fetchTweetPreview, type TweetPreview } from "@/lib/twitter";

interface TwitterPreviewBatchRequest {
  readonly urls?: unknown;
}

type TwitterPreviewBatchResult = {
  readonly url: string;
  readonly preview: TweetPreview;
};

type TwitterPreviewBatchError = {
  readonly url: string;
  readonly error: string;
};

type TwitterPreviewBatchItem =
  | TwitterPreviewBatchResult
  | TwitterPreviewBatchError;

const TWITTER_PREVIEW_BATCH_MAX_URLS = 5;
// Five URLs of at most a few hundred characters fit well inside this.
const TWITTER_PREVIEW_BATCH_MAX_BODY_BYTES = 8 * 1024;
const TWITTER_PREVIEW_METADATA_ERROR_MESSAGE =
  "Unable to fetch Twitter/X post.";

// Each requested URL costs one unit. Clients batch and cache previews by
// tweet, so reading a busy wave stays far below this budget.
const enforceRateLimit = createClientRateLimiter({
  limit: 240,
  windowMs: 60 * 1000,
  errorMessage: "Too many Twitter/X preview requests",
});

const batchJsonError = (message: string, status = 400): NextResponse =>
  NextResponse.json({ error: message }, { status });

const readErrorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : TWITTER_PREVIEW_METADATA_ERROR_MESSAGE;

const getErrorStatus = (message: string): number =>
  message === "Invalid Twitter/X status URL." ? 400 : 502;

const normalizeBatchUrls = (value: unknown): readonly string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const urls = value
    .filter((url): url is string => typeof url === "string")
    .map((url) => url.trim())
    .filter((url) => url.length > 0);

  return Array.from(new Set(urls));
};

const createBatchRecords = (
  items: readonly TwitterPreviewBatchItem[]
): {
  readonly results: Record<string, TweetPreview>;
  readonly errors: Record<string, string>;
} => {
  const results: Record<string, TweetPreview> = {};
  const errors: Record<string, string> = {};

  for (const item of items) {
    if ("preview" in item) {
      results[item.url] = item.preview;
    } else {
      errors[item.url] = item.error;
    }
  }

  return { results, errors };
};

export async function GET(request: NextRequest) {
  const href = request.nextUrl.searchParams.get("url");

  if (!href) {
    return NextResponse.json(
      { error: "Missing Twitter/X URL." },
      { status: 400 }
    );
  }

  const rateLimitResponse = enforceRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const preview = await fetchTweetPreview(href);
    return NextResponse.json(preview);
  } catch (error: unknown) {
    const message = readErrorMessage(error);
    return NextResponse.json(
      { error: message },
      { status: getErrorStatus(message) }
    );
  }
}

export async function POST(request: NextRequest) {
  const bodyResult = await readJsonBody<TwitterPreviewBatchRequest | null>({
    request,
    maxBodyBytes: TWITTER_PREVIEW_BATCH_MAX_BODY_BYTES,
    jsonError: (message, status) =>
      batchJsonError(
        status === 413
          ? message
          : "Invalid Twitter/X preview batch request body.",
        status
      ),
  });
  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const urls = normalizeBatchUrls(bodyResult.body?.urls);
  if (urls.length === 0) {
    return NextResponse.json(
      { error: "At least one Twitter/X URL is required." },
      { status: 400 }
    );
  }

  if (urls.length > TWITTER_PREVIEW_BATCH_MAX_URLS) {
    return NextResponse.json(
      {
        error: `Twitter/X preview batches support up to ${TWITTER_PREVIEW_BATCH_MAX_URLS} URLs.`,
      },
      { status: 400 }
    );
  }

  const rateLimitResponse = enforceRateLimit(request, urls.length);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const items: readonly TwitterPreviewBatchItem[] = await Promise.all(
    urls.map(async (url) => {
      try {
        return {
          url,
          preview: await fetchTweetPreview(url),
        };
      } catch (error: unknown) {
        return {
          url,
          error: readErrorMessage(error),
        };
      }
    })
  );

  return NextResponse.json(createBatchRecords(items));
}

export const dynamic = "force-dynamic";
