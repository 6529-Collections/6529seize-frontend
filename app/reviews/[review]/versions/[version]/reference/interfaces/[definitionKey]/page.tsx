import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { publicEnv } from "@/config/env";
import { getSolidityInterfaceHref } from "@/lib/public-review/solidityReferenceRoutes";
import {
  getStreamSolidityReferenceMetadata,
  renderStreamSolidityInterface,
} from "@/lib/public-review/streamSolidityReference";
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
    inventory.interfaces.map(({ definitionKey }) => ({
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
    canonicalPath: getSolidityInterfaceHref({
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

export default async function VersionedStreamSolidityInterfacePage({
  params,
}: Props) {
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
