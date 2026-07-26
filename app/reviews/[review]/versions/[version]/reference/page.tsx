import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { publicEnv } from "@/config/env";
import {
  getStreamSolidityReferenceMetadata,
  renderStreamSolidityReferenceOverview,
} from "@/lib/public-review/streamSolidityReference";
import {
  getVersionedStreamReferenceRootParams,
  resolveStreamReferenceRouteOrNotFound,
} from "@/lib/public-review/streamSolidityReferencePageAdapter";
import { isStreamReviewPubliclyAvailable } from "@/lib/public-review/streamReviewRoutes";

type Props = {
  readonly params: Promise<{ review: string; version: string }>;
};

export function generateStaticParams() {
  return isStreamReviewPubliclyAvailable(publicEnv.BASE_ENDPOINT)
    ? getVersionedStreamReferenceRootParams()
    : [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const metadata = getStreamSolidityReferenceMetadata({
    baseEndpoint: publicEnv.BASE_ENDPOINT,
    params: resolvedParams,
  });
  if (!metadata) {
    notFound();
  }
  return metadata;
}

export default async function VersionedStreamSolidityReferencePage({
  params,
}: Props) {
  const route = resolveStreamReferenceRouteOrNotFound({
    baseEndpoint: publicEnv.BASE_ENDPOINT,
    params: await params,
  });
  return renderStreamSolidityReferenceOverview(route);
}
