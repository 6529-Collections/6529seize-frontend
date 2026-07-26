import "next/dist/compiled/server-only";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PublicReviewReferenceShell } from "@/components/public-review/PublicReviewReferenceShell";
import {
  SolidityDeclarationView,
  SolidityInterfaceView,
  SoliditySourceView,
} from "@/components/public-review/SolidityReferenceDetailViews";
import {
  SolidityDefinitionView,
  SolidityReferenceOverview,
} from "@/components/public-review/SolidityReferenceViews";
import { getAppMetadata } from "@/components/providers/metadata";
import { isPublicReviewEnabled } from "@/config/publicReviews";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  createSolidityReferenceReader,
  type SolidityReferenceReader,
} from "@/lib/public-review/solidityReferenceData";
import {
  getSolidityReferenceRootHref,
  type SolidityReferenceHrefContext,
} from "@/lib/public-review/solidityReferenceRoutes";
import type {
  SolidityDeclarationKind,
  SolidityReferenceReviewIdentity,
} from "@/lib/public-review/solidityReferenceTypes";
import {
  STREAM_REVIEW_DEFINITION,
  STREAM_REVIEW_SLUG,
} from "@/lib/public-review/streamReviewDefinition";

export interface StreamSolidityReferenceRouteParams {
  readonly review: string;
  readonly version?: string | undefined;
}

const STREAM_SOLIDITY_REFERENCE_IDENTITY: SolidityReferenceReviewIdentity = {
  activeVersion: STREAM_REVIEW_DEFINITION.activeVersion,
  availableVersions: STREAM_REVIEW_DEFINITION.availableVersions,
  reviewId: STREAM_REVIEW_SLUG,
  sourceCommit: STREAM_REVIEW_DEFINITION.source.commit,
  sourceRepository: STREAM_REVIEW_DEFINITION.source.repository,
};

let defaultReader: SolidityReferenceReader | undefined;

export function getStreamSolidityReferenceReader({
  publicRoot,
}: {
  readonly publicRoot?: string | undefined;
} = {}): SolidityReferenceReader {
  if (publicRoot) {
    return createSolidityReferenceReader({
      identity: STREAM_SOLIDITY_REFERENCE_IDENTITY,
      publicRoot,
    });
  }
  defaultReader ??= createSolidityReferenceReader({
    identity: STREAM_SOLIDITY_REFERENCE_IDENTITY,
  });
  return defaultReader;
}

export function resolveStreamSolidityReferenceVersion({
  baseEndpoint,
  params,
}: {
  readonly baseEndpoint: string;
  readonly params: StreamSolidityReferenceRouteParams;
}): string | undefined {
  if (
    !isPublicReviewEnabled(baseEndpoint) ||
    params.review !== STREAM_REVIEW_SLUG
  ) {
    return undefined;
  }
  const version =
    params.version ?? STREAM_SOLIDITY_REFERENCE_IDENTITY.activeVersion;
  return STREAM_SOLIDITY_REFERENCE_IDENTITY.availableVersions.includes(version)
    ? version
    : undefined;
}

function getHrefContext(
  routeVersion: string | undefined
): SolidityReferenceHrefContext {
  return {
    reviewSlug: STREAM_REVIEW_SLUG,
    ...(routeVersion ? { version: routeVersion } : {}),
  };
}

function getEditorialHref(routeVersion: string | undefined): string {
  return routeVersion
    ? `/reviews/${STREAM_REVIEW_SLUG}/versions/${routeVersion}`
    : `/reviews/${STREAM_REVIEW_SLUG}`;
}

function getReferenceMetadata({
  baseEndpoint,
  canonicalPath,
  description,
  title,
}: {
  readonly baseEndpoint: string;
  readonly canonicalPath: string;
  readonly description: string;
  readonly title: string;
}): Metadata {
  return {
    ...getAppMetadata({ title, description }),
    alternates: {
      canonical: new URL(canonicalPath, baseEndpoint).toString(),
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export function getStreamSolidityReferenceMetadata({
  baseEndpoint,
  canonicalPath,
  params,
  pageTitle,
}: {
  readonly baseEndpoint: string;
  readonly canonicalPath?: string | undefined;
  readonly params: StreamSolidityReferenceRouteParams;
  readonly pageTitle?: string | undefined;
}): Metadata | undefined {
  const version = resolveStreamSolidityReferenceVersion({
    baseEndpoint,
    params,
  });
  if (!version) {
    return undefined;
  }
  const title =
    pageTitle ?? t(DEFAULT_LOCALE, "publicReview.reference.overviewTitle");
  return getReferenceMetadata({
    baseEndpoint,
    canonicalPath:
      canonicalPath ??
      getSolidityReferenceRootHref(getHrefContext(params.version)),
    description: t(
      DEFAULT_LOCALE,
      "publicReview.reference.overviewDescription"
    ),
    title,
  });
}

function ReferenceShell({
  children,
  description,
  routeVersion,
  title,
  version,
}: {
  readonly children: ReactNode;
  readonly description: string;
  readonly routeVersion?: string | undefined;
  readonly title: string;
  readonly version: string;
}) {
  const hrefContext = getHrefContext(routeVersion);
  return (
    <PublicReviewReferenceShell
      description={description}
      displayedVersion={version}
      editorialHref={getEditorialHref(routeVersion)}
      referenceHref={getSolidityReferenceRootHref(hrefContext)}
      review={STREAM_REVIEW_DEFINITION}
      title={title}
    >
      {children}
    </PublicReviewReferenceShell>
  );
}

export async function renderStreamSolidityReferenceOverview({
  reader = getStreamSolidityReferenceReader(),
  routeVersion,
  version,
}: {
  readonly reader?: SolidityReferenceReader | undefined;
  readonly routeVersion?: string | undefined;
  readonly version: string;
}) {
  const { manifest } = await reader.loadManifest(version);
  return (
    <ReferenceShell
      description={t(
        DEFAULT_LOCALE,
        "publicReview.reference.overviewDescription"
      )}
      routeVersion={routeVersion}
      title={t(DEFAULT_LOCALE, "publicReview.reference.overviewTitle")}
      version={version}
    >
      <SolidityReferenceOverview
        hrefContext={getHrefContext(routeVersion)}
        manifest={manifest}
      />
    </ReferenceShell>
  );
}

export async function renderStreamSolidityDefinition({
  definitionKey,
  reader = getStreamSolidityReferenceReader(),
  routeVersion,
  version,
}: {
  readonly definitionKey: string;
  readonly reader?: SolidityReferenceReader | undefined;
  readonly routeVersion?: string | undefined;
  readonly version: string;
}) {
  const { indexEntry, manifest, shard } = await reader.loadDefinition(
    version,
    definitionKey
  );
  return (
    <ReferenceShell
      description={t(
        DEFAULT_LOCALE,
        "publicReview.reference.definitionDescription"
      )}
      routeVersion={routeVersion}
      title={t(DEFAULT_LOCALE, "publicReview.reference.definitionTitle", {
        kind: indexEntry.kind,
        name: indexEntry.name,
      })}
      version={version}
    >
      <SolidityDefinitionView
        hrefContext={getHrefContext(routeVersion)}
        indexEntry={indexEntry}
        manifest={manifest}
        shard={shard}
      />
    </ReferenceShell>
  );
}

export async function renderStreamSolidityDeclaration({
  declarationKey,
  definitionKey,
  feedbackSlot,
  kind,
  reader = getStreamSolidityReferenceReader(),
  routeVersion,
  version,
}: {
  readonly declarationKey: string;
  readonly definitionKey: string;
  readonly feedbackSlot?: ReactNode | undefined;
  readonly kind: SolidityDeclarationKind;
  readonly reader?: SolidityReferenceReader | undefined;
  readonly routeVersion?: string | undefined;
  readonly version: string;
}) {
  const { declaration, indexEntry } = await reader.loadDeclaration(
    version,
    definitionKey,
    kind,
    declarationKey
  );
  const { document } = await reader.loadSource(
    version,
    indexEntry.sourcePath.split("/")
  );
  return (
    <ReferenceShell
      description={t(
        DEFAULT_LOCALE,
        "publicReview.reference.definitionDescription"
      )}
      routeVersion={routeVersion}
      title={declaration.canonicalSignature ?? declaration.displaySignature}
      version={version}
    >
      <SolidityDeclarationView
        declaration={declaration}
        definition={indexEntry}
        feedbackSlot={feedbackSlot}
        source={document}
      />
    </ReferenceShell>
  );
}

export async function renderStreamSolidityInterface({
  definitionKey,
  reader = getStreamSolidityReferenceReader(),
  routeVersion,
  version,
}: {
  readonly definitionKey: string;
  readonly reader?: SolidityReferenceReader | undefined;
  readonly routeVersion?: string | undefined;
  readonly version: string;
}) {
  const { indexEntry, manifest, shard } = await reader.loadDefinition(
    version,
    definitionKey
  );
  if (!indexEntry.interface.published) {
    throw new Error("The requested definition is not a published interface.");
  }
  return (
    <ReferenceShell
      description={t(
        DEFAULT_LOCALE,
        "publicReview.reference.interfaceDescription"
      )}
      routeVersion={routeVersion}
      title={t(DEFAULT_LOCALE, "publicReview.reference.interfaceTitle", {
        name: indexEntry.name,
      })}
      version={version}
    >
      <SolidityInterfaceView
        hrefContext={getHrefContext(routeVersion)}
        indexEntry={indexEntry}
        manifest={manifest}
        shard={shard}
      />
    </ReferenceShell>
  );
}

export async function renderStreamSoliditySource({
  feedbackSlot,
  reader = getStreamSolidityReferenceReader(),
  routeVersion,
  source,
  version,
}: {
  readonly feedbackSlot?: ReactNode | undefined;
  readonly reader?: SolidityReferenceReader | undefined;
  readonly routeVersion?: string | undefined;
  readonly source: readonly string[];
  readonly version: string;
}) {
  const result = await reader.loadSource(version, source);
  return (
    <ReferenceShell
      description={t(
        DEFAULT_LOCALE,
        "publicReview.reference.sourceDescription"
      )}
      routeVersion={routeVersion}
      title={t(DEFAULT_LOCALE, "publicReview.reference.sourceTitle", {
        path: result.document.file.path,
      })}
      version={version}
    >
      <SoliditySourceView
        document={result.document}
        feedbackSlot={feedbackSlot}
        hrefContext={getHrefContext(routeVersion)}
        manifest={result.manifest}
      />
    </ReferenceShell>
  );
}
