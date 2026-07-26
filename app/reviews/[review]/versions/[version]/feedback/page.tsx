import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { publicEnv } from "@/config/env";
import {
  getStreamReviewFeedbackMetadata,
  renderStreamReviewFeedbackPage,
} from "@/lib/public-review/streamReviewFeedbackPage";
import {
  STREAM_REVIEW_DEFINITION,
  STREAM_REVIEW_SLUG,
} from "@/lib/public-review/streamReviewDefinition";
import { isStreamReviewPubliclyAvailable } from "@/lib/public-review/streamReviewRoutes";

type Props = {
  readonly params: Promise<{ review: string; version: string }>;
};

export function generateStaticParams() {
  if (!isStreamReviewPubliclyAvailable(publicEnv.BASE_ENDPOINT)) {
    return [];
  }
  return STREAM_REVIEW_DEFINITION.versions.map(({ version }) => ({
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
    !STREAM_REVIEW_DEFINITION.versions.some(
      (candidate) => candidate.version === version
    ) ||
    !isStreamReviewPubliclyAvailable(publicEnv.BASE_ENDPOINT)
  ) {
    notFound();
  }
  return renderStreamReviewFeedbackPage({
    baseEndpoint: publicEnv.BASE_ENDPOINT,
    version,
  });
}
