import { connection } from "next/server";

import { publicEnv } from "@/config/env";
import { STREAM_REVIEW_SLUG } from "@/lib/public-review/streamReviewDefinition";
import { resolveConfiguredStreamReviewFeedbackDestination } from "@/lib/public-review/streamReviewFeedback.server";
import { isStreamReviewPubliclyAvailable } from "@/lib/public-review/streamReviewRoutes";

export const runtime = "nodejs";

const RESPONSE_HEADERS = {
  "Cache-Control": "private, max-age=60",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, noarchive",
} as const;

/**
 * The review's discussion Wave for this site's environment, which its review
 * pages already show to every reader. The desktop app, which carries none of
 * the site's server configuration, reads it from here.
 */
export async function GET(
  _request: Request,
  { params }: { readonly params: Promise<{ review: string }> }
): Promise<Response> {
  await connection();
  const { review } = await params;
  if (
    review !== STREAM_REVIEW_SLUG ||
    !isStreamReviewPubliclyAvailable(publicEnv.BASE_ENDPOINT)
  ) {
    return Response.json(
      { error: "Not found." },
      { headers: RESPONSE_HEADERS, status: 404 }
    );
  }

  return Response.json(
    resolveConfiguredStreamReviewFeedbackDestination(publicEnv.BASE_ENDPOINT),
    { headers: RESPONSE_HEADERS }
  );
}
