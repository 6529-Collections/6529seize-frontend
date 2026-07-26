import { publicEnv } from "@/config/env";
import {
  generateStreamReviewRouteMetadata,
  renderStreamReviewRoutePage,
} from "@/lib/public-review/streamReviewPage";
import {
  STREAM_REVIEW_DEFINITION,
  STREAM_REVIEW_SLUG,
} from "@/lib/public-review/streamReviewDefinition";
import { isStreamReviewPubliclyAvailable } from "@/lib/public-review/streamReviewRoutes";

export const generateMetadata = generateStreamReviewRouteMetadata;
export default renderStreamReviewRoutePage;

export function generateStaticParams() {
  if (!isStreamReviewPubliclyAvailable(publicEnv.BASE_ENDPOINT)) {
    return [];
  }

  return STREAM_REVIEW_DEFINITION.versions.flatMap((reviewVersion) =>
    reviewVersion.pages
      .filter((page) => page.id !== "overview")
      .map((page) => ({
        review: STREAM_REVIEW_SLUG,
        version: reviewVersion.version,
        page: page.slug,
      }))
  );
}
