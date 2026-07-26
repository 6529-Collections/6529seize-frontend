import "next/dist/compiled/server-only";

import { notFound } from "next/navigation";

import { isPublicReviewEnabled } from "@/config/publicReviews";
import {
  SolidityReferenceNotFoundError,
  type SolidityReferenceReader,
} from "@/lib/public-review/solidityReferenceData";
import {
  getStreamSolidityReferenceReader,
  resolveStreamSolidityReferenceVersion,
  type StreamSolidityReferenceRouteParams,
} from "@/lib/public-review/streamSolidityReference";
import type { SolidityReferenceRouteInventory } from "@/lib/public-review/solidityReferenceRoutes";
import {
  STREAM_REVIEW_DEFINITION,
  STREAM_REVIEW_SLUG,
} from "@/lib/public-review/streamReviewDefinition";

export interface ResolvedStreamReferenceRoute {
  readonly routeVersion?: string | undefined;
  readonly version: string;
}

export function resolveStreamReferenceRouteOrNotFound({
  baseEndpoint,
  params,
}: {
  readonly baseEndpoint: string;
  readonly params: StreamSolidityReferenceRouteParams;
}): ResolvedStreamReferenceRoute {
  const version = resolveStreamSolidityReferenceVersion({
    baseEndpoint,
    params,
  });
  if (!version) {
    notFound();
  }
  return {
    version,
    ...(params.version ? { routeVersion: params.version } : {}),
  };
}

export async function renderStreamReferenceOrNotFound(
  render: () => Promise<React.ReactNode>
): Promise<React.ReactNode> {
  try {
    return await render();
  } catch (error) {
    if (error instanceof SolidityReferenceNotFoundError) {
      notFound();
    }
    throw error;
  }
}

export async function loadActiveStreamReferenceInventory({
  baseEndpoint,
  reader = getStreamSolidityReferenceReader(),
}: {
  readonly baseEndpoint: string;
  readonly reader?: SolidityReferenceReader | undefined;
}): Promise<SolidityReferenceRouteInventory | undefined> {
  if (!isPublicReviewEnabled(baseEndpoint)) {
    return undefined;
  }
  return reader.loadRouteInventory(STREAM_REVIEW_DEFINITION.activeVersion);
}

export async function loadVersionedStreamReferenceInventories({
  baseEndpoint,
  reader = getStreamSolidityReferenceReader(),
}: {
  readonly baseEndpoint: string;
  readonly reader?: SolidityReferenceReader | undefined;
}): Promise<
  readonly {
    readonly inventory: SolidityReferenceRouteInventory;
    readonly version: string;
  }[]
> {
  if (!isPublicReviewEnabled(baseEndpoint)) {
    return [];
  }
  return Promise.all(
    STREAM_REVIEW_DEFINITION.availableVersions.map(async (version) => ({
      inventory: await reader.loadRouteInventory(version),
      version,
    }))
  );
}

export function getActiveStreamReferenceRootParams() {
  return [{ review: STREAM_REVIEW_SLUG }];
}

export function getVersionedStreamReferenceRootParams() {
  return STREAM_REVIEW_DEFINITION.availableVersions.map((version) => ({
    review: STREAM_REVIEW_SLUG,
    version,
  }));
}
