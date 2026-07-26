import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { publicEnv } from "@/config/env";
import {
  getStreamReviewMetadata,
  renderStreamReviewRoute,
  resolveStreamReviewRoute,
} from "@/lib/public-review/streamReviewPage";
import { STREAM_REVIEW_SLUG } from "@/lib/public-review/streamReviewDefinition";
import { isPublicReviewEnabled } from "@/config/publicReviews";

type Props = {
  readonly params: Promise<{ review: string }>;
};

export function generateStaticParams() {
  return isPublicReviewEnabled(publicEnv.BASE_ENDPOINT)
    ? [{ review: STREAM_REVIEW_SLUG }]
    : [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const metadata = getStreamReviewMetadata({
    baseEndpoint: publicEnv.BASE_ENDPOINT,
    params: await params,
  });
  if (!metadata) {
    notFound();
  }
  return metadata;
}

export default async function PublicReviewOverviewPage({ params }: Props) {
  const route = resolveStreamReviewRoute({
    baseEndpoint: publicEnv.BASE_ENDPOINT,
    params: await params,
  });
  if (!route) {
    notFound();
  }
  return renderStreamReviewRoute(route);
}
