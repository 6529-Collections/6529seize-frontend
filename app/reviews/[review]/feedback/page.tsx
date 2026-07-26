import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { publicEnv } from "@/config/env";
import { isPublicReviewEnabled } from "@/config/publicReviews";
import {
  getStreamReviewFeedbackMetadata,
  renderStreamReviewFeedbackPage,
} from "@/lib/public-review/streamReviewFeedbackPage";
import { STREAM_REVIEW_SLUG } from "@/lib/public-review/streamReviewDefinition";

type Props = {
  readonly params: Promise<{ review: string }>;
};

export function generateStaticParams() {
  return isPublicReviewEnabled(publicEnv.BASE_ENDPOINT)
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
    !isPublicReviewEnabled(publicEnv.BASE_ENDPOINT)
  ) {
    notFound();
  }
  return renderStreamReviewFeedbackPage({
    baseEndpoint: publicEnv.BASE_ENDPOINT,
  });
}
