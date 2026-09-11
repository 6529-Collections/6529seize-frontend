import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { publicEnv } from "@/config/env";
import { getSolidityInterfaceHref } from "@/lib/public-review/solidityReferenceRoutes";
import { renderStreamSolidityInterface } from "@/lib/public-review/streamSolidityReference";
import { getStreamSolidityInterfaceMetadata } from "@/lib/public-review/streamSolidityReferenceMetadata";
import {
  loadActiveStreamReferenceInventory,
  renderStreamReferenceOrNotFound,
  resolveStreamReferenceRouteOrNotFound,
} from "@/lib/public-review/streamSolidityReferencePageAdapter";
import { STREAM_REVIEW_SLUG } from "@/lib/public-review/streamReviewDefinition";

type Props = {
  readonly params: Promise<{ definitionKey: string; review: string }>;
};

export async function generateStaticParams() {
  const inventory = await loadActiveStreamReferenceInventory({
    baseEndpoint: publicEnv.BASE_ENDPOINT,
  });
  return (
    inventory?.interfaces.map(({ definitionKey }) => ({
      definitionKey,
      review: STREAM_REVIEW_SLUG,
    })) ?? []
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const metadata = await renderStreamReferenceOrNotFound(() =>
    getStreamSolidityInterfaceMetadata({
      baseEndpoint: publicEnv.BASE_ENDPOINT,
      canonicalPath: getSolidityInterfaceHref({
        definitionKey: resolvedParams.definitionKey,
        reviewSlug: resolvedParams.review,
      }),
      definitionKey: resolvedParams.definitionKey,
      params: resolvedParams,
    })
  );
  if (!metadata) {
    notFound();
  }
  return metadata;
}

export default async function StreamSolidityInterfacePage({ params }: Props) {
  const resolvedParams = await params;
  const route = resolveStreamReferenceRouteOrNotFound({
    baseEndpoint: publicEnv.BASE_ENDPOINT,
    params: resolvedParams,
  });
  return renderStreamReferenceOrNotFound(() =>
    renderStreamSolidityInterface({
      ...route,
      definitionKey: resolvedParams.definitionKey,
    })
  );
}
