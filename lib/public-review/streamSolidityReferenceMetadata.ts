import "next/dist/compiled/server-only";

import type { Metadata } from "next";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  SolidityReferenceNotFoundError,
  type SolidityReferenceReader,
} from "@/lib/public-review/solidityReferenceData";
import type { SolidityDeclarationKind } from "@/lib/public-review/solidityReferenceTypes";
import {
  getStreamSolidityReferenceMetadata,
  getStreamSolidityReferenceReader,
  resolveStreamSolidityReferenceVersion,
  type StreamSolidityReferenceRouteParams,
} from "@/lib/public-review/streamSolidityReference";

const DEFINITION_DESCRIPTION_KEY =
  "publicReview.reference.definitionDescription";

interface StreamSolidityDetailMetadataOptions {
  readonly baseEndpoint: string;
  readonly canonicalPath: string;
  readonly params: StreamSolidityReferenceRouteParams;
  readonly reader?: SolidityReferenceReader | undefined;
}

function resolveDetailMetadataVersion({
  baseEndpoint,
  params,
}: Pick<StreamSolidityDetailMetadataOptions, "baseEndpoint" | "params">):
  | string
  | undefined {
  return resolveStreamSolidityReferenceVersion({ baseEndpoint, params });
}

export async function getStreamSolidityDefinitionMetadata({
  baseEndpoint,
  canonicalPath,
  definitionKey,
  params,
  reader = getStreamSolidityReferenceReader(),
}: StreamSolidityDetailMetadataOptions & {
  readonly definitionKey: string;
}): Promise<Metadata | undefined> {
  const version = resolveDetailMetadataVersion({ baseEndpoint, params });
  if (!version) {
    return undefined;
  }
  const { indexEntry } = await reader.loadDefinition(version, definitionKey);
  return getStreamSolidityReferenceMetadata({
    baseEndpoint,
    canonicalPath,
    description: t(DEFAULT_LOCALE, DEFINITION_DESCRIPTION_KEY),
    pageTitle: t(DEFAULT_LOCALE, "publicReview.reference.definitionTitle", {
      kind: indexEntry.kind,
      name: indexEntry.name,
    }),
    params,
  });
}

export async function getStreamSolidityInterfaceMetadata({
  baseEndpoint,
  canonicalPath,
  definitionKey,
  params,
  reader = getStreamSolidityReferenceReader(),
}: StreamSolidityDetailMetadataOptions & {
  readonly definitionKey: string;
}): Promise<Metadata | undefined> {
  const version = resolveDetailMetadataVersion({ baseEndpoint, params });
  if (!version) {
    return undefined;
  }
  const { indexEntry } = await reader.loadDefinition(version, definitionKey);
  if (!indexEntry.interface.published) {
    throw new SolidityReferenceNotFoundError(
      "The requested definition is not a published interface."
    );
  }
  return getStreamSolidityReferenceMetadata({
    baseEndpoint,
    canonicalPath,
    description: t(
      DEFAULT_LOCALE,
      "publicReview.reference.interfaceDescription"
    ),
    pageTitle: t(DEFAULT_LOCALE, "publicReview.reference.interfaceTitle", {
      name: indexEntry.name,
    }),
    params,
  });
}

export async function getStreamSoliditySourceMetadata({
  baseEndpoint,
  canonicalPath,
  params,
  reader = getStreamSolidityReferenceReader(),
  source,
}: StreamSolidityDetailMetadataOptions & {
  readonly source: readonly string[];
}): Promise<Metadata | undefined> {
  const version = resolveDetailMetadataVersion({ baseEndpoint, params });
  if (!version) {
    return undefined;
  }
  const { document } = await reader.loadSource(version, source);
  return getStreamSolidityReferenceMetadata({
    baseEndpoint,
    canonicalPath,
    description: t(DEFAULT_LOCALE, "publicReview.reference.sourceDescription"),
    pageTitle: t(DEFAULT_LOCALE, "publicReview.reference.sourceTitle", {
      path: document.file.path,
    }),
    params,
  });
}

export async function getStreamSolidityDeclarationPageMetadata({
  baseEndpoint,
  canonicalPath,
  declarationKey,
  definitionKey,
  kind,
  params,
  reader = getStreamSolidityReferenceReader(),
}: StreamSolidityDetailMetadataOptions & {
  readonly declarationKey: string;
  readonly definitionKey: string;
  readonly kind: SolidityDeclarationKind;
}): Promise<Metadata | undefined> {
  const version = resolveDetailMetadataVersion({ baseEndpoint, params });
  if (!version) {
    return undefined;
  }
  const { declaration } = await reader.loadDeclaration(
    version,
    definitionKey,
    kind,
    declarationKey
  );
  return getStreamSolidityReferenceMetadata({
    baseEndpoint,
    canonicalPath,
    description: t(DEFAULT_LOCALE, DEFINITION_DESCRIPTION_KEY),
    pageTitle: declaration.canonicalSignature ?? declaration.displaySignature,
    params,
  });
}

export async function getStreamSolidityTopLevelDeclarationMetadata({
  baseEndpoint,
  canonicalPath,
  declarationKey,
  params,
  reader = getStreamSolidityReferenceReader(),
}: StreamSolidityDetailMetadataOptions & {
  readonly declarationKey: string;
}): Promise<Metadata | undefined> {
  const version = resolveDetailMetadataVersion({ baseEndpoint, params });
  if (!version) {
    return undefined;
  }
  const { manifest } = await reader.loadManifest(version);
  const declaration = manifest.declarationIndex.find(
    (candidate) => candidate.key === declarationKey && candidate.topLevel
  );
  if (!declaration) {
    throw new SolidityReferenceNotFoundError(
      "Unknown file-scope Solidity declaration."
    );
  }
  return getStreamSolidityReferenceMetadata({
    baseEndpoint,
    canonicalPath,
    description: t(DEFAULT_LOCALE, DEFINITION_DESCRIPTION_KEY),
    pageTitle: declaration.canonicalSignature ?? declaration.displaySignature,
    params,
  });
}
