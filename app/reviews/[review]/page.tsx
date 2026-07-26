import { publicEnv } from "@/config/env";
import { isPublicReviewEnabled } from "@/config/publicReviews";
import {
  generateStreamReviewRouteMetadata,
  renderStreamReviewRoutePage,
} from "@/lib/public-review/streamReviewPage";
import { STREAM_REVIEW_SLUG } from "@/lib/public-review/streamReviewDefinition";

export const generateMetadata = generateStreamReviewRouteMetadata;
export default renderStreamReviewRoutePage;

export function generateStaticParams() {
  return isPublicReviewEnabled(publicEnv.BASE_ENDPOINT)
    ? [{ review: STREAM_REVIEW_SLUG }]
    : [];
}
