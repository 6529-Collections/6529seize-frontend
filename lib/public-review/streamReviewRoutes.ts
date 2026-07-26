import { isPublicReviewEnabled } from "@/config/publicReviews";
import type {
  PublicReviewPageDefinition,
  PublicReviewVersionDefinition,
} from "@/lib/public-review/publicReviewTypes";
import {
  getStreamReviewPage,
  getStreamReviewPageHref,
  getStreamReviewVersion,
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
  readonly reviewVersion: PublicReviewVersionDefinition;
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

  const selectedVersion =
    params.version ?? STREAM_REVIEW_DEFINITION.activeVersion;
  const reviewVersion = getStreamReviewVersion(selectedVersion);
  if (!reviewVersion) {
    return undefined;
  }

  const page = getStreamReviewPage(params.page ?? "overview", selectedVersion);
  if (!page) {
    return undefined;
  }

  return {
    page,
    reviewVersion,
    version: params.version,
    canonicalPath: getStreamReviewPageHref({
      page,
      version: params.version,
    }),
  };
}
