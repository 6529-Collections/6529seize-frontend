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
  STREAM_REVIEW_PAGES,
  STREAM_REVIEW_SLUG,
} from "@/lib/public-review/streamReviewDefinition";

type Props = {
  readonly params: Promise<{ review: string; page: string }>;
};

export function generateStaticParams() {
  if (!isPublicReviewEnabled(publicEnv.BASE_ENDPOINT)) {
    return [];
  }

  return STREAM_REVIEW_PAGES.filter((page) => page.id !== "overview").map(
    (page) => ({
      review: STREAM_REVIEW_SLUG,
      page: page.slug,
    })
  );
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

export default async function PublicReviewEditorialPage({ params }: Props) {
  const route = resolveStreamReviewRoute({
    baseEndpoint: publicEnv.BASE_ENDPOINT,
    params: await params,
  });
  if (!route) {
    notFound();
  }
  return renderStreamReviewRoute(route);
}
