import { notFound, redirect } from "next/navigation";

import { publicEnv } from "@/config/env";
import { isPublicReviewEnabled } from "@/config/publicReviews";
import { STREAM_REVIEW_SLUG } from "@/lib/public-review/streamReviewDefinition";

export default function StreamReviewRedirectPage() {
  if (!isPublicReviewEnabled(publicEnv.BASE_ENDPOINT)) {
    notFound();
  }

  redirect(`/reviews/${STREAM_REVIEW_SLUG}`);
}
