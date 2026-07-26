import { isPublicReviewEnabled } from "@/config/publicReviews";
import type { PublicReviewPageDefinition } from "@/lib/public-review/publicReviewTypes";
import {
  getStreamReviewPage,
  getStreamReviewPageHref,
  STREAM_REVIEW_DEFINITION,
  STREAM_REVIEW_SLUG,
} from "@/lib/public-review/streamReviewDefinition";

export interface StreamReviewRouteParams {
  readonly review: string;
  readonly page?: string | undefined;
  readonly version?: string | undefined;
}

export interface StreamReviewRouteModel {
  readonly page: PublicReviewPageDefinition;
  readonly version?: string | undefined;
  readonly canonicalPath: string;
}

export function resolveStreamReviewRoute({
  baseEndpoint,
  params,
}: {
  readonly baseEndpoint: string;
  readonly params: StreamReviewRouteParams;
}): StreamReviewRouteModel | undefined {
  if (
    !isPublicReviewEnabled(baseEndpoint) ||
    params.review !== STREAM_REVIEW_SLUG
  ) {
    return undefined;
  }

  if (
    params.version !== undefined &&
    !STREAM_REVIEW_DEFINITION.availableVersions.includes(params.version)
  ) {
    return undefined;
  }

  const page = getStreamReviewPage(params.page ?? "overview");
  if (!page) {
    return undefined;
  }

  return {
    page,
    version: params.version,
    canonicalPath: getStreamReviewPageHref({
      page,
      version: params.version,
    }),
  };
}
