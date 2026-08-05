import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { publicEnv } from "@/config/env";
import { isPublicReviewEnabled } from "@/config/publicReviews";
import {
  getStreamReviewFeedbackMetadata,
  renderStreamReviewFeedbackPage,
} from "@/lib/public-review/streamReviewFeedbackPage";
import {
  isStreamReviewVersionPubliclyAvailable,
  STREAM_REVIEW_DEFINITION,
  STREAM_REVIEW_SLUG,
} from "@/lib/public-review/streamReviewDefinition";

type Props = {
  readonly params: Promise<{ review: string; version: string }>;
};

export function generateStaticParams() {
  if (!isPublicReviewEnabled(publicEnv.BASE_ENDPOINT)) {
    return [];
  }
  return STREAM_REVIEW_DEFINITION.versions
    .filter(({ version }) => isStreamReviewVersionPubliclyAvailable(version))
    .map(({ version }) => ({
      review: STREAM_REVIEW_SLUG,
      version,
    }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { review, version } = await params;
  const metadata = getStreamReviewFeedbackMetadata({
    baseEndpoint: publicEnv.BASE_ENDPOINT,
    review,
    version,
  });
  if (!metadata) {
    notFound();
  }
  return metadata;
}

export default async function VersionedPublicReviewFeedbackPage({
  params,
}: Props) {
  const { review, version } = await params;
  if (
    review !== STREAM_REVIEW_SLUG ||
    !isStreamReviewVersionPubliclyAvailable(version) ||
    !isPublicReviewEnabled(publicEnv.BASE_ENDPOINT)
  ) {
    notFound();
  }
  return renderStreamReviewFeedbackPage({
    baseEndpoint: publicEnv.BASE_ENDPOINT,
    version,
  });
}
