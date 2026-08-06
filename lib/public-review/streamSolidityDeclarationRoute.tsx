import "next/dist/compiled/server-only";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { publicEnv } from "@/config/env";
import { getSolidityDeclarationHref } from "@/lib/public-review/solidityReferenceRoutes";
import { renderStreamSolidityDeclaration } from "@/lib/public-review/streamSolidityReference";
import { getStreamSolidityDeclarationPageMetadata } from "@/lib/public-review/streamSolidityReferenceMetadata";
import {
  renderStreamReferenceOrNotFound,
  resolveStreamReferenceRouteOrNotFound,
} from "@/lib/public-review/streamSolidityReferencePageAdapter";
import type { SolidityDeclarationKind } from "@/lib/public-review/solidityReferenceTypes";

export interface StreamSolidityDeclarationParams {
  readonly declarationKey: string;
  readonly definitionKey: string;
  readonly review: string;
  readonly version?: string | undefined;
}

export async function getSolidityDeclarationMetadata({
  kind,
  params,
}: {
  readonly kind: SolidityDeclarationKind;
  readonly params: StreamSolidityDeclarationParams;
}): Promise<Metadata> {
  const metadata = await renderStreamReferenceOrNotFound(() =>
    getStreamSolidityDeclarationPageMetadata({
      baseEndpoint: publicEnv.BASE_ENDPOINT,
      canonicalPath: getSolidityDeclarationHref({
        declarationKey: params.declarationKey,
        definitionKey: params.definitionKey,
        kind,
        reviewSlug: params.review,
        ...(params.version ? { version: params.version } : {}),
      }),
      declarationKey: params.declarationKey,
      definitionKey: params.definitionKey,
      kind,
      params,
    })
  );
  if (!metadata) {
    notFound();
  }
  return metadata;
}

export function renderSolidityDeclarationRoute({
  kind,
  params,
}: {
  readonly kind: SolidityDeclarationKind;
  readonly params: StreamSolidityDeclarationParams;
}) {
  const route = resolveStreamReferenceRouteOrNotFound({
    baseEndpoint: publicEnv.BASE_ENDPOINT,
    params,
  });
  return renderStreamReferenceOrNotFound(() =>
    renderStreamSolidityDeclaration({
      ...route,
      declarationKey: params.declarationKey,
      definitionKey: params.definitionKey,
      kind,
    })
  );
}
