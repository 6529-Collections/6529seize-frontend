import { NextResponse, type NextRequest } from "next/server";

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
const TWITTER_PREVIEW_METADATA_ERROR_MESSAGE =
  "Unable to fetch Twitter/X post.";

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

export async function POST(request: Request) {
  let body: TwitterPreviewBatchRequest | null;

  try {
    body = (await request.json()) as TwitterPreviewBatchRequest | null;
  } catch {
    return NextResponse.json(
      { error: "Invalid Twitter/X preview batch request body." },
      { status: 400 }
    );
  }

  const urls = normalizeBatchUrls(body?.urls);
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
