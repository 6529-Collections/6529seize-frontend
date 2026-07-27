import "next/dist/compiled/server-only";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { publicEnv } from "@/config/env";
import { getSolidityTopLevelDeclarationHref } from "@/lib/public-review/solidityReferenceRoutes";
import { renderStreamSolidityTopLevelDeclaration } from "@/lib/public-review/streamSolidityReference";
import { getStreamSolidityTopLevelDeclarationMetadata } from "@/lib/public-review/streamSolidityReferenceMetadata";
import {
  loadActiveStreamReferenceInventory,
  loadVersionedStreamReferenceInventories,
  renderStreamReferenceOrNotFound,
  resolveStreamReferenceRouteOrNotFound,
} from "@/lib/public-review/streamSolidityReferencePageAdapter";
import { STREAM_REVIEW_SLUG } from "@/lib/public-review/streamReviewDefinition";

export interface StreamSolidityTopLevelDeclarationParams {
  readonly declarationKey: string;
  readonly review: string;
  readonly version?: string | undefined;
}

export async function getActiveTopLevelDeclarationStaticParams() {
  const inventory = await loadActiveStreamReferenceInventory({
    baseEndpoint: publicEnv.BASE_ENDPOINT,
  });
  return (
    inventory?.topLevelDeclarations.map(({ declarationKey }) => ({
      declarationKey,
      review: STREAM_REVIEW_SLUG,
    })) ?? []
  );
}

export async function getVersionedTopLevelDeclarationStaticParams() {
  const versions = await loadVersionedStreamReferenceInventories({
    baseEndpoint: publicEnv.BASE_ENDPOINT,
  });
  return versions.flatMap(({ inventory, version }) =>
    inventory.topLevelDeclarations.map(({ declarationKey }) => ({
      declarationKey,
      review: STREAM_REVIEW_SLUG,
      version,
    }))
  );
}

export async function getTopLevelDeclarationMetadata(
  params: StreamSolidityTopLevelDeclarationParams
): Promise<Metadata> {
  const metadata = await renderStreamReferenceOrNotFound(() =>
    getStreamSolidityTopLevelDeclarationMetadata({
      baseEndpoint: publicEnv.BASE_ENDPOINT,
      canonicalPath: getSolidityTopLevelDeclarationHref({
        declarationKey: params.declarationKey,
        reviewSlug: params.review,
        ...(params.version ? { version: params.version } : {}),
      }),
      declarationKey: params.declarationKey,
      params,
    })
  );
  if (!metadata) {
    notFound();
  }
  return metadata;
}

export function renderTopLevelDeclarationRoute(
  params: StreamSolidityTopLevelDeclarationParams
) {
  const route = resolveStreamReferenceRouteOrNotFound({
    baseEndpoint: publicEnv.BASE_ENDPOINT,
    params,
  });
  return renderStreamReferenceOrNotFound(() =>
    renderStreamSolidityTopLevelDeclaration({
      ...route,
      declarationKey: params.declarationKey,
    })
  );
}
