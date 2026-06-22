import { NextResponse, type NextRequest } from "next/server";

import { resolveGithubPreview } from "./service";
import type { GithubPreviewResponse } from "@/services/api/github-preview-api";

interface GithubPreviewBatchRequest {
  readonly urls?: unknown;
}

interface GithubPreviewBatchResponse {
  readonly results: Record<string, GithubPreviewResponse>;
  readonly errors: Record<string, string>;
}

const GITHUB_PREVIEW_BATCH_MAX_URLS = 10;
const GITHUB_PREVIEW_METADATA_ERROR_MESSAGE =
  "Failed to fetch GitHub preview metadata.";

const readErrorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : GITHUB_PREVIEW_METADATA_ERROR_MESSAGE;

export async function GET(request: NextRequest) {
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GithubPreviewBatchRequest | null;
    const rawUrls = body?.urls;
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

    const response: GithubPreviewBatchResponse = {
      results: {},
      errors: {},
    };

    await Promise.all(
      uniqueUrls.map(async (url) => {
        try {
          response.results[url] = await resolveGithubPreview(url);
        } catch (error: unknown) {
          response.errors[url] = readErrorMessage(error);
        }
      })
    );

    return NextResponse.json(response);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: readErrorMessage(error) },
      { status: 400 }
    );
  }
}

export const dynamic = "force-dynamic";
