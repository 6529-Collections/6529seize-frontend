import { isPublicReviewEnabled } from "@/config/publicReviews";
import { getPublicReviewLifecycleCapabilities } from "@/lib/public-review/publicReviewLifecycle";
import type { PublicReviewPageDefinition } from "@/lib/public-review/publicReviewTypes";
import {
  getStreamReviewPage,
  getStreamReviewPageHref,
  getStreamReviewVersion,
  isStreamReviewVersionPubliclyAvailable,
  STREAM_REVIEW_DEFINITION,
  STREAM_REVIEW_SLUG,
} from "@/lib/public-review/streamReviewDefinition";

export interface StreamReviewRouteParams {
  readonly review: string;
  readonly page?: string | undefined;
  readonly version?: string | undefined;
}

export interface StreamReviewRouteModel {
  readonly baseEndpoint: string;
  readonly page: PublicReviewPageDefinition;
  readonly version?: string | undefined;
  readonly canonicalPath: string;
}

export function isStreamReviewPubliclyAvailable(baseEndpoint: string): boolean {
  return (
    isPublicReviewEnabled(baseEndpoint) &&
    getPublicReviewLifecycleCapabilities(STREAM_REVIEW_DEFINITION.status)
      .publicRoutesAvailable &&
    isStreamReviewVersionPubliclyAvailable(
      STREAM_REVIEW_DEFINITION.activeVersion
    )
  );
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
    params.review !== STREAM_REVIEW_SLUG ||
    (params.version === undefined &&
      !isStreamReviewPubliclyAvailable(baseEndpoint))
  ) {
    return undefined;
  }

  const displayedVersion =
    params.version ?? STREAM_REVIEW_DEFINITION.activeVersion;
  const reviewVersion = getStreamReviewVersion(displayedVersion);
  if (
    !reviewVersion ||
    !getPublicReviewLifecycleCapabilities(reviewVersion.status)
      .publicRoutesAvailable
  ) {
    return undefined;
  }

  const page = getStreamReviewPage(params.page ?? "overview", displayedVersion);
  if (!page) {
    return undefined;
  }

  return {
    baseEndpoint,
    page,
    version: params.version,
    canonicalPath: getStreamReviewPageHref({
      page,
      version: params.version,
    }),
  };
}
