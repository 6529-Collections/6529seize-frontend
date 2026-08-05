import { publicEnv } from "@/config/env";
import {
  generateStreamReviewRouteMetadata,
  renderStreamReviewRoutePage,
} from "@/lib/public-review/streamReviewPage";
import {
  STREAM_REVIEW_PAGES,
  STREAM_REVIEW_SLUG,
} from "@/lib/public-review/streamReviewDefinition";
import { isStreamReviewPubliclyAvailable } from "@/lib/public-review/streamReviewRoutes";

export const generateMetadata = generateStreamReviewRouteMetadata;
export default renderStreamReviewRoutePage;

export function generateStaticParams() {
  if (!isStreamReviewPubliclyAvailable(publicEnv.BASE_ENDPOINT)) {
    return [];
  }

  return STREAM_REVIEW_PAGES.filter((page) => page.id !== "overview").map(
    (page) => ({
      review: STREAM_REVIEW_SLUG,
      page: page.slug,
    })
  );
}
