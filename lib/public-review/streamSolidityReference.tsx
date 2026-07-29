import "next/dist/compiled/server-only";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PublicReviewCodeFeedback } from "@/components/public-review/PublicReviewCodeFeedback";
import PublicReviewFeedbackComposer from "@/components/public-review/PublicReviewFeedbackComposer";
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
import { publicEnv } from "@/config/env";
import { isPublicReviewEnabled } from "@/config/publicReviews";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  createSolidityReferenceReader,
  SolidityReferenceNotFoundError,
  type SolidityReferenceReader,
} from "@/lib/public-review/solidityReferenceData";
import {
  getSolidityDeclarationHref,
  getSolidityDefinitionHref,
  getSolidityInterfaceHref,
  getSolidityReferenceRootHref,
  getSoliditySourceHref,
  getSolidityTopLevelDeclarationHref,
  type SolidityReferenceHrefContext,
} from "@/lib/public-review/solidityReferenceRoutes";
import { isStreamReviewPubliclyAvailable } from "@/lib/public-review/streamReviewRoutes";
import {
  createStreamReviewFeedbackConfig,
  createStreamTechnicalFeedbackPageContext,
  resolveStreamReviewFeedbackDestination,
  type StreamReviewTechnicalFeedbackPageId,
} from "@/lib/public-review/streamReviewFeedback.server";
import type {
  SolidityDeclarationKind,
  SolidityDefinitionIndexEntry,
  SolidityReferenceManifest,
  SolidityTopLevelDeclaration,
} from "@/lib/public-review/solidityReferenceTypes";
import {
  getStreamReviewFeedbackHref,
  isStreamReviewVersionPubliclyAvailable,
  STREAM_REVIEW_DEFINITION,
  STREAM_REVIEW_SLUG,
} from "@/lib/public-review/streamReviewDefinition";
import { STREAM_SOLIDITY_REFERENCE_IDENTITY } from "@/lib/public-review/streamSolidityReferenceIdentity.server";
import type {
  PublicReviewCodeSelection,
  PublicReviewDiscussionDestination,
  PublicReviewFeedbackConfig,
  PublicReviewPageContext,
} from "@/services/api/public-review/types";

export interface StreamSolidityReferenceRouteParams {
  readonly review: string;
  readonly version?: string | undefined;
}

let defaultReader: SolidityReferenceReader | undefined;

function isTopLevelCallable(
  declaration: SolidityTopLevelDeclaration
): declaration is Extract<
  SolidityTopLevelDeclaration,
  { kind: "function" | "event" | "error" }
> {
  return ["function", "event", "error"].includes(declaration.kind);
}

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
    params.review !== STREAM_REVIEW_SLUG ||
    (params.version === undefined &&
      !isStreamReviewPubliclyAvailable(baseEndpoint))
  ) {
    return undefined;
  }
  const version =
    params.version ?? STREAM_SOLIDITY_REFERENCE_IDENTITY.activeVersion;
  return STREAM_SOLIDITY_REFERENCE_IDENTITY.availableVersions.includes(
    version
  ) && isStreamReviewVersionPubliclyAvailable(version)
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

function getImmutableHrefContext(
  version: string
): SolidityReferenceHrefContext {
  return { reviewSlug: STREAM_REVIEW_SLUG, version };
}

async function getReferenceFeedback({
  canonicalPath,
  manifest,
  pageId,
  pageTitle,
  sourcePaths,
}: {
  readonly canonicalPath: string;
  readonly manifest: SolidityReferenceManifest;
  readonly pageId: StreamReviewTechnicalFeedbackPageId;
  readonly pageTitle: string;
  readonly sourcePaths?: readonly string[] | undefined;
}): Promise<{
  readonly config: PublicReviewFeedbackConfig;
  readonly destination: PublicReviewDiscussionDestination;
  readonly page: PublicReviewPageContext;
}> {
  return {
    config: await createStreamReviewFeedbackConfig({
      manifest,
      sourcePaths,
    }),
    destination: await resolveStreamReviewFeedbackDestination(
      publicEnv.BASE_ENDPOINT
    ),
    page: createStreamTechnicalFeedbackPageContext({
      canonicalPath,
      pageId,
      pageTitle,
    }),
  };
}

function getDefinitionSelection(
  definition: SolidityDefinitionIndexEntry
): PublicReviewCodeSelection {
  return {
    kind: "code",
    path: definition.sourcePath,
    sourceSha256: definition.range.sourceSha256,
    lineStart: definition.range.lineStart,
    lineEnd: definition.range.lineEnd,
    contract: definition.name,
    declaration: definition.id,
    snippetSha256: definition.range.snippetSha256,
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
  description,
  params,
  pageTitle,
}: {
  readonly baseEndpoint: string;
  readonly canonicalPath?: string | undefined;
  readonly description?: string | undefined;
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
    description:
      description ??
      t(DEFAULT_LOCALE, "publicReview.reference.overviewDescription"),
    title,
  });
}

function ReferenceShell({
  children,
  description,
  feedbackSlot,
  manifest,
  routeVersion,
  title,
  version,
}: {
  readonly children: ReactNode;
  readonly description: string;
  readonly feedbackSlot?: ReactNode | undefined;
  readonly manifest: SolidityReferenceManifest;
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
      feedbackHref={getStreamReviewFeedbackHref(routeVersion)}
      referenceHref={getSolidityReferenceRootHref(hrefContext)}
      review={STREAM_REVIEW_DEFINITION}
      source={{
        repository: manifest.source.repository,
        commit: manifest.source.commit,
      }}
      title={title}
    >
      {children}
      {feedbackSlot !== undefined && feedbackSlot !== null ? (
        <div
          id="public-review-feedback"
          className="tw-mt-8 tw-scroll-mt-28"
          tabIndex={-1}
        >
          {feedbackSlot}
        </div>
      ) : null}
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
  const pageTitle = t(DEFAULT_LOCALE, "publicReview.reference.overviewTitle");
  const feedback = await getReferenceFeedback({
    canonicalPath: getSolidityReferenceRootHref(
      getImmutableHrefContext(version)
    ),
    manifest,
    pageId: "reference-overview",
    pageTitle,
  });
  return (
    <ReferenceShell
      description={t(
        DEFAULT_LOCALE,
        "publicReview.reference.overviewDescription"
      )}
      routeVersion={routeVersion}
      manifest={manifest}
      feedbackSlot={
        <PublicReviewFeedbackComposer
          locale={DEFAULT_LOCALE}
          config={feedback.config}
          destination={feedback.destination}
          page={feedback.page}
        />
      }
      title={pageTitle}
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
  const pageTitle = t(
    DEFAULT_LOCALE,
    "publicReview.reference.definitionTitle",
    {
      kind: indexEntry.kind,
      name: indexEntry.name,
    }
  );
  const feedback = await getReferenceFeedback({
    canonicalPath: getSolidityDefinitionHref({
      ...getImmutableHrefContext(version),
      definitionKey,
    }),
    manifest,
    pageId: "reference-definition",
    pageTitle,
    sourcePaths: [indexEntry.sourcePath],
  });
  return (
    <ReferenceShell
      description={t(
        DEFAULT_LOCALE,
        "publicReview.reference.definitionDescription"
      )}
      routeVersion={routeVersion}
      manifest={manifest}
      feedbackSlot={
        <PublicReviewFeedbackComposer
          locale={DEFAULT_LOCALE}
          config={feedback.config}
          destination={feedback.destination}
          page={feedback.page}
          referenceSelection={getDefinitionSelection(indexEntry)}
        />
      }
      title={pageTitle}
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
  const { document, manifest } = await reader.loadSource(
    version,
    indexEntry.sourcePath.split("/")
  );
  const pageTitle =
    declaration.canonicalSignature ?? declaration.displaySignature;
  let pageId: StreamReviewTechnicalFeedbackPageId = "reference-error";
  if (kind === "functions") {
    pageId = "reference-function";
  } else if (kind === "events") {
    pageId = "reference-event";
  }
  const feedback = await getReferenceFeedback({
    canonicalPath: getSolidityDeclarationHref({
      ...getImmutableHrefContext(version),
      declarationKey,
      definitionKey,
      kind,
    }),
    manifest,
    pageId,
    pageTitle,
    sourcePaths: [indexEntry.sourcePath],
  });
  return (
    <ReferenceShell
      description={t(
        DEFAULT_LOCALE,
        "publicReview.reference.definitionDescription"
      )}
      routeVersion={routeVersion}
      manifest={manifest}
      title={pageTitle}
      version={version}
    >
      <SolidityDeclarationView
        declaration={declaration}
        definition={indexEntry}
        feedbackSubmissionsOpen={feedback.config.submissionsOpen}
        feedbackSlot={
          feedbackSlot ?? (
            <PublicReviewCodeFeedback
              config={feedback.config}
              destination={feedback.destination}
              page={feedback.page}
            />
          )
        }
        source={document}
      />
    </ReferenceShell>
  );
}

export async function renderStreamSolidityTopLevelDeclaration({
  declarationKey,
  feedbackSlot,
  reader = getStreamSolidityReferenceReader(),
  routeVersion,
  version,
}: {
  readonly declarationKey: string;
  readonly feedbackSlot?: ReactNode | undefined;
  readonly reader?: SolidityReferenceReader | undefined;
  readonly routeVersion?: string | undefined;
  readonly version: string;
}) {
  const { manifest } = await reader.loadManifest(version);
  const indexEntry = manifest.declarationIndex.find(
    (declaration) => declaration.key === declarationKey && declaration.topLevel
  );
  if (!indexEntry) {
    throw new SolidityReferenceNotFoundError(
      "Unknown file-scope Solidity declaration."
    );
  }
  const { document } = await reader.loadSource(
    version,
    indexEntry.sourcePath.split("/")
  );
  const declaration = document.file.topLevelDeclarations.find(
    (candidate) => candidate.id === indexEntry.id
  );
  if (!declaration || !isTopLevelCallable(declaration)) {
    throw new Error("File-scope Solidity declaration projection drift.");
  }
  const pageTitle =
    indexEntry.canonicalSignature ?? indexEntry.displaySignature;
  const feedback = await getReferenceFeedback({
    canonicalPath: getSolidityTopLevelDeclarationHref({
      ...getImmutableHrefContext(version),
      declarationKey,
    }),
    manifest,
    pageId: "reference-declaration",
    pageTitle,
    sourcePaths: [indexEntry.sourcePath],
  });
  return (
    <ReferenceShell
      description={t(
        DEFAULT_LOCALE,
        "publicReview.reference.definitionDescription"
      )}
      routeVersion={routeVersion}
      manifest={manifest}
      title={pageTitle}
      version={version}
    >
      <SolidityDeclarationView
        declaration={declaration}
        feedbackSubmissionsOpen={feedback.config.submissionsOpen}
        feedbackSlot={
          feedbackSlot ?? (
            <PublicReviewCodeFeedback
              config={feedback.config}
              destination={feedback.destination}
              page={feedback.page}
            />
          )
        }
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
    throw new SolidityReferenceNotFoundError(
      "The requested definition is not a published interface."
    );
  }
  const pageTitle = t(DEFAULT_LOCALE, "publicReview.reference.interfaceTitle", {
    name: indexEntry.name,
  });
  const feedback = await getReferenceFeedback({
    canonicalPath: getSolidityInterfaceHref({
      ...getImmutableHrefContext(version),
      definitionKey,
    }),
    manifest,
    pageId: "reference-interface",
    pageTitle,
    sourcePaths: [indexEntry.sourcePath],
  });
  return (
    <ReferenceShell
      description={t(
        DEFAULT_LOCALE,
        "publicReview.reference.interfaceDescription"
      )}
      routeVersion={routeVersion}
      manifest={manifest}
      feedbackSlot={
        <PublicReviewFeedbackComposer
          locale={DEFAULT_LOCALE}
          config={feedback.config}
          destination={feedback.destination}
          page={feedback.page}
          referenceSelection={getDefinitionSelection(indexEntry)}
        />
      }
      title={pageTitle}
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
  const pageTitle = t(DEFAULT_LOCALE, "publicReview.reference.sourceTitle", {
    path: result.document.file.path,
  });
  const feedback = await getReferenceFeedback({
    canonicalPath: getSoliditySourceHref({
      ...getImmutableHrefContext(version),
      sourcePath: result.document.file.path,
    }),
    manifest: result.manifest,
    pageId: "reference-source",
    pageTitle,
    sourcePaths: [result.document.file.path],
  });
  return (
    <ReferenceShell
      description={t(
        DEFAULT_LOCALE,
        "publicReview.reference.sourceDescription"
      )}
      routeVersion={routeVersion}
      manifest={result.manifest}
      title={pageTitle}
      version={version}
    >
      <SoliditySourceView
        document={result.document}
        feedbackSubmissionsOpen={feedback.config.submissionsOpen}
        feedbackSlot={
          feedbackSlot ?? (
            <PublicReviewCodeFeedback
              config={feedback.config}
              destination={feedback.destination}
              page={feedback.page}
            />
          )
        }
        hrefContext={getHrefContext(routeVersion)}
        manifest={result.manifest}
      />
    </ReferenceShell>
  );
}
