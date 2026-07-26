import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { publicEnv } from "@/config/env";
import { isPublicReviewEnabled } from "@/config/publicReviews";
import {
  getStreamReviewMetadata,
  renderStreamReviewRoute,
  resolveStreamReviewRoute,
} from "@/lib/public-review/streamReviewPage";
import {
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

  return STREAM_REVIEW_DEFINITION.availableVersions.map((version) => ({
    review: STREAM_REVIEW_SLUG,
    version,
  }));
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

export default async function VersionedPublicReviewOverviewPage({
  params,
}: Props) {
  const route = resolveStreamReviewRoute({
    baseEndpoint: publicEnv.BASE_ENDPOINT,
    params: await params,
  });
  if (!route) {
    notFound();
  }
  return renderStreamReviewRoute(route);
}
