import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { publicEnv } from "@/config/env";
import {
  getStreamReviewFeedbackMetadata,
  renderStreamReviewFeedbackPage,
} from "@/lib/public-review/streamReviewFeedbackPage";
import { STREAM_REVIEW_SLUG } from "@/lib/public-review/streamReviewDefinition";
import { isStreamReviewPubliclyAvailable } from "@/lib/public-review/streamReviewRoutes";

type Props = {
  readonly params: Promise<{ review: string }>;
};

export function generateStaticParams() {
  return isStreamReviewPubliclyAvailable(publicEnv.BASE_ENDPOINT)
    ? [{ review: STREAM_REVIEW_SLUG }]
    : [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { review } = await params;
  const metadata = getStreamReviewFeedbackMetadata({
    baseEndpoint: publicEnv.BASE_ENDPOINT,
    review,
  });
  if (!metadata) {
    notFound();
  }
  return metadata;
}

export default async function PublicReviewFeedbackPage({ params }: Props) {
  const { review } = await params;
  if (
    review !== STREAM_REVIEW_SLUG ||
    !isStreamReviewPubliclyAvailable(publicEnv.BASE_ENDPOINT)
  ) {
    notFound();
  }
  return renderStreamReviewFeedbackPage({
    baseEndpoint: publicEnv.BASE_ENDPOINT,
  });
}
