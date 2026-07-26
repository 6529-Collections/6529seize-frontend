import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { publicEnv } from "@/config/env";
import {
  getStreamSolidityReferenceMetadata,
  renderStreamSolidityDefinition,
} from "@/lib/public-review/streamSolidityReference";
import { getSolidityDefinitionHref } from "@/lib/public-review/solidityReferenceRoutes";
import {
  loadVersionedStreamReferenceInventories,
  renderStreamReferenceOrNotFound,
  resolveStreamReferenceRouteOrNotFound,
} from "@/lib/public-review/streamSolidityReferencePageAdapter";
import { STREAM_REVIEW_SLUG } from "@/lib/public-review/streamReviewDefinition";

type Props = {
  readonly params: Promise<{
    definitionKey: string;
    review: string;
    version: string;
  }>;
};

export async function generateStaticParams() {
  const versions = await loadVersionedStreamReferenceInventories({
    baseEndpoint: publicEnv.BASE_ENDPOINT,
  });
  return versions.flatMap(({ inventory, version }) =>
    inventory.definitions.map(({ definitionKey }) => ({
      definitionKey,
      review: STREAM_REVIEW_SLUG,
      version,
    }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const metadata = getStreamSolidityReferenceMetadata({
    baseEndpoint: publicEnv.BASE_ENDPOINT,
    canonicalPath: getSolidityDefinitionHref({
      definitionKey: resolvedParams.definitionKey,
      reviewSlug: resolvedParams.review,
      version: resolvedParams.version,
    }),
    params: resolvedParams,
  });
  if (!metadata) {
    notFound();
  }
  return metadata;
}

export default async function VersionedStreamSolidityDefinitionPage({
  params,
}: Props) {
  const resolvedParams = await params;
  const route = resolveStreamReferenceRouteOrNotFound({
    baseEndpoint: publicEnv.BASE_ENDPOINT,
    params: resolvedParams,
  });
  return renderStreamReferenceOrNotFound(() =>
    renderStreamSolidityDefinition({
      ...route,
      definitionKey: resolvedParams.definitionKey,
    })
  );
}
