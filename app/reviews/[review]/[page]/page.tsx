import { publicEnv } from "@/config/env";
import { isPublicReviewEnabled } from "@/config/publicReviews";
import {
  generateStreamReviewRouteMetadata,
  renderStreamReviewRoutePage,
} from "@/lib/public-review/streamReviewPage";
import {
  STREAM_REVIEW_PAGES,
  STREAM_REVIEW_SLUG,
} from "@/lib/public-review/streamReviewDefinition";

export const generateMetadata = generateStreamReviewRouteMetadata;
export default renderStreamReviewRoutePage;

export function generateStaticParams() {
  if (!isPublicReviewEnabled(publicEnv.BASE_ENDPOINT)) {
    return [];
  }

  return STREAM_REVIEW_PAGES.filter((page) => page.id !== "overview").map(
    (page) => ({
      review: STREAM_REVIEW_SLUG,
      page: page.slug,
    })
  );
}
