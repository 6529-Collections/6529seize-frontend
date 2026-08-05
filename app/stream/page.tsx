import { notFound, redirect } from "next/navigation";

import { publicEnv } from "@/config/env";
import { STREAM_REVIEW_SLUG } from "@/lib/public-review/streamReviewDefinition";
import { isStreamReviewPubliclyAvailable } from "@/lib/public-review/streamReviewRoutes";

export default function StreamReviewRedirectPage() {
  if (!isStreamReviewPubliclyAvailable(publicEnv.BASE_ENDPOINT)) {
    notFound();
  }

  redirect(`/reviews/${STREAM_REVIEW_SLUG}`);
}
