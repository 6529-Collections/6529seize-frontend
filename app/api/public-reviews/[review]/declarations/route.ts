import type { NextRequest } from "next/server";

import { publicEnv } from "@/config/env";
import {
  parseSolidityDeclarationSearchQuery,
  searchSolidityDeclarations,
} from "@/lib/public-review/solidityDeclarationSearch.server";
import { SolidityReferenceNotFoundError } from "@/lib/public-review/solidityReferenceData";
import {
  getStreamSolidityReferenceReader,
  resolveStreamSolidityReferenceVersion,
} from "@/lib/public-review/streamSolidityReference";
import { STREAM_REVIEW_SLUG } from "@/lib/public-review/streamReviewDefinition";

export const runtime = "nodejs";

const RESPONSE_HEADERS = {
  "Cache-Control": "private, max-age=60",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, noarchive",
} as const;

function jsonError(message: string, status: number): Response {
  return Response.json(
    { error: message },
    { headers: RESPONSE_HEADERS, status }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { readonly params: Promise<{ review: string }> }
): Promise<Response> {
  const { review } = await params;
  if (review !== STREAM_REVIEW_SLUG) {
    return jsonError("Not found.", 404);
  }

  const requestedVersion =
    request.nextUrl.searchParams.get("version") ?? undefined;
  const version = resolveStreamSolidityReferenceVersion({
    baseEndpoint: publicEnv.BASE_ENDPOINT,
    params: { review, version: requestedVersion },
  });
  if (!version) {
    return jsonError("Not found.", 404);
  }

  const links = request.nextUrl.searchParams.get("links") ?? "active";
  if (links !== "active" && links !== "versioned") {
    return jsonError("Invalid declaration link mode.", 400);
  }

  let query;
  try {
    query = parseSolidityDeclarationSearchQuery(request.nextUrl.searchParams);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Invalid declaration query.",
      400
    );
  }

  try {
    const { manifest } =
      await getStreamSolidityReferenceReader().loadManifest(version);
    return Response.json(
      searchSolidityDeclarations({
        hrefContext: {
          reviewSlug: STREAM_REVIEW_SLUG,
          ...(links === "versioned" ? { version } : {}),
        },
        manifest,
        query,
      }),
      { headers: RESPONSE_HEADERS }
    );
  } catch (error) {
    if (error instanceof SolidityReferenceNotFoundError) {
      return jsonError("Not found.", 404);
    }
    throw error;
  }
}
