import { publicEnv } from "@/config/env";
import { isPublicReviewEnabled } from "@/config/publicReviews";
import { STREAM_REVIEW_SLUG } from "@/lib/public-review/streamReviewDefinition";

export {
  renderStreamReviewRoutePage as default,
  generateStreamReviewRouteMetadata as generateMetadata,
} from "@/lib/public-review/streamReviewPage";

export function generateStaticParams() {
  return isPublicReviewEnabled(publicEnv.BASE_ENDPOINT)
    ? [{ review: STREAM_REVIEW_SLUG }]
    : [];
}
