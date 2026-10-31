import { notFound, redirect } from "next/navigation";

import StreamHomePage from "@/components/stream/pages/StreamHomePage";
import { publicEnv } from "@/config/env";
import { isStreamProductEnabled } from "@/config/streamProduct";
import { STREAM_REVIEW_SLUG } from "@/lib/public-review/streamReviewDefinition";
import { isStreamReviewPubliclyAvailable } from "@/lib/public-review/streamReviewRoutes";
import { streamPageMetadata } from "@/lib/stream/route.server";

export default function StreamReviewRedirectPage() {
  // Where its flag is on (local, staging), the 6529 Stream section owns /stream.
  if (isStreamProductEnabled()) {
    return <StreamHomePage />;
  }

  if (!isStreamReviewPubliclyAvailable(publicEnv.BASE_ENDPOINT)) {
    notFound();
  }

  redirect(`/reviews/${STREAM_REVIEW_SLUG}`);
}

export const generateMetadata = () =>
  isStreamProductEnabled()
    ? streamPageMetadata("stream.home.title", "/stream")
    : {};
