import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { publicEnv } from "@/config/env";
import { getSoliditySourceHref } from "@/lib/public-review/solidityReferenceRoutes";
import { renderStreamSoliditySource } from "@/lib/public-review/streamSolidityReference";
import { getStreamSoliditySourceMetadata } from "@/lib/public-review/streamSolidityReferenceMetadata";
import {
  loadVersionedStreamReferenceInventories,
  renderStreamReferenceOrNotFound,
  resolveStreamReferenceRouteOrNotFound,
} from "@/lib/public-review/streamSolidityReferencePageAdapter";
import { STREAM_REVIEW_SLUG } from "@/lib/public-review/streamReviewDefinition";

type Props = {
  readonly params: Promise<{
    review: string;
    source: string[];
    version: string;
  }>;
};

export async function generateStaticParams() {
  const versions = await loadVersionedStreamReferenceInventories({
    baseEndpoint: publicEnv.BASE_ENDPOINT,
  });
  return versions.flatMap(({ inventory, version }) =>
    inventory.sources.map(({ source }) => ({
      review: STREAM_REVIEW_SLUG,
      source,
      version,
    }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const metadata = await renderStreamReferenceOrNotFound(() =>
    getStreamSoliditySourceMetadata({
      baseEndpoint: publicEnv.BASE_ENDPOINT,
      canonicalPath: getSoliditySourceHref({
        reviewSlug: resolvedParams.review,
        sourcePath: resolvedParams.source.join("/"),
        version: resolvedParams.version,
      }),
      params: resolvedParams,
      source: resolvedParams.source,
    })
  );
  if (!metadata) {
    notFound();
  }
  return metadata;
}

export default async function VersionedStreamSoliditySourcePage({
  params,
}: Props) {
  const resolvedParams = await params;
  const route = resolveStreamReferenceRouteOrNotFound({
    baseEndpoint: publicEnv.BASE_ENDPOINT,
    params: resolvedParams,
  });
  return renderStreamReferenceOrNotFound(() =>
    renderStreamSoliditySource({
      ...route,
      source: resolvedParams.source,
    })
  );
}
