import "next/dist/compiled/server-only";

import {
  SOLIDITY_DECLARATION_MAX_PAGE_SIZE,
  SOLIDITY_DECLARATION_MAX_QUERY_LENGTH,
  type SolidityDeclarationSearchKind,
  type SolidityDeclarationSearchLocation,
  type SolidityDeclarationSearchPage,
  type SolidityDeclarationSearchQuery,
  type SolidityGlobalDeclarationListItem,
} from "@/lib/public-review/solidityDeclarationSearchTypes";
import { getSolidityDeclarationIndexHref } from "@/lib/public-review/solidityReferenceRoutes";
import type { SolidityReferenceHrefContext } from "@/lib/public-review/solidityReferenceRoutes";
import type {
  SolidityDeclarationIndexEntry,
  SolidityReferenceManifest,
} from "@/lib/public-review/solidityReferenceTypes";

const SEARCH_KINDS = new Set<SolidityDeclarationSearchKind>([
  "",
  "function",
  "event",
  "error",
]);
const SEARCH_LOCATIONS = new Set<SolidityDeclarationSearchLocation>([
  "",
  "definition",
  "file-scope",
]);
const MAX_SCOPE_LENGTH = 200;

function parseBoundedInteger({
  fallback,
  maximum,
  minimum,
  value,
}: {
  readonly fallback: number;
  readonly maximum: number;
  readonly minimum: number;
  readonly value: string | null;
}): number {
  if (value === null) {
    return fallback;
  }
  if (!/^\d+$/.test(value)) {
    throw new Error("Invalid declaration pagination parameter.");
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error("Declaration pagination parameter is out of range.");
  }
  return parsed;
}

function parseKind(value: string | null): SolidityDeclarationSearchKind {
  const kind = value ?? "";
  if (!SEARCH_KINDS.has(kind as SolidityDeclarationSearchKind)) {
    throw new Error("Invalid declaration kind.");
  }
  return kind as SolidityDeclarationSearchKind;
}

function parseLocation(
  value: string | null
): SolidityDeclarationSearchLocation {
  const location = value ?? "";
  if (!SEARCH_LOCATIONS.has(location as SolidityDeclarationSearchLocation)) {
    throw new Error("Invalid declaration location.");
  }
  return location as SolidityDeclarationSearchLocation;
}

function parseBoundedText({
  maximum,
  name,
  value,
}: {
  readonly maximum: number;
  readonly name: string;
  readonly value: string | null;
}): string {
  const normalized = (value ?? "").trim();
  if (normalized.length > maximum) {
    throw new Error(`${name} is too long.`);
  }
  return normalized;
}

export function parseSolidityDeclarationSearchQuery(
  searchParams: URLSearchParams
): SolidityDeclarationSearchQuery {
  return {
    kind: parseKind(searchParams.get("kind")),
    limit: parseBoundedInteger({
      fallback: SOLIDITY_DECLARATION_MAX_PAGE_SIZE,
      maximum: SOLIDITY_DECLARATION_MAX_PAGE_SIZE,
      minimum: 1,
      value: searchParams.get("limit"),
    }),
    location: parseLocation(searchParams.get("location")),
    offset: parseBoundedInteger({
      fallback: 0,
      maximum: Number.MAX_SAFE_INTEGER,
      minimum: 0,
      value: searchParams.get("offset"),
    }),
    query: parseBoundedText({
      maximum: SOLIDITY_DECLARATION_MAX_QUERY_LENGTH,
      name: "Declaration search query",
      value: searchParams.get("q"),
    }),
    scope: parseBoundedText({
      maximum: MAX_SCOPE_LENGTH,
      name: "Declaration scope",
      value: searchParams.get("scope"),
    }),
  };
}

function matchesQuery(
  declaration: SolidityDeclarationIndexEntry,
  definitionName: string,
  normalizedQuery: string
): boolean {
  if (!normalizedQuery) {
    return true;
  }
  return [
    declaration.name,
    declaration.canonicalSignature ?? declaration.displaySignature,
    declaration.selector ?? "",
    declaration.topic0 ?? "",
    declaration.sourcePath,
    definitionName,
  ].some((value) => value.toLowerCase().includes(normalizedQuery));
}

function matchesLocation(
  declaration: SolidityDeclarationIndexEntry,
  location: SolidityDeclarationSearchLocation
): boolean {
  if (!location) {
    return true;
  }
  return location === "file-scope"
    ? declaration.topLevel
    : !declaration.topLevel;
}

function mapDeclaration({
  declaration,
  definitionName,
  hrefContext,
}: {
  readonly declaration: SolidityDeclarationIndexEntry;
  readonly definitionName: string | undefined;
  readonly hrefContext: SolidityReferenceHrefContext;
}): SolidityGlobalDeclarationListItem {
  return {
    ...(definitionName ? { definitionName } : {}),
    href: getSolidityDeclarationIndexHref({
      ...hrefContext,
      declaration,
    }),
    key: declaration.key,
    kind: declaration.kind,
    name: declaration.name,
    scope: declaration.scope,
    selectorOrTopic: declaration.selector ?? declaration.topic0 ?? "\u2014",
    signature: declaration.canonicalSignature ?? declaration.displaySignature,
    sourcePath: declaration.sourcePath,
    syntheticGetter: declaration.syntheticGetter,
    topLevel: declaration.topLevel,
  };
}

export function searchSolidityDeclarations({
  hrefContext,
  manifest,
  query,
}: {
  readonly hrefContext: SolidityReferenceHrefContext;
  readonly manifest: SolidityReferenceManifest;
  readonly query: SolidityDeclarationSearchQuery;
}): SolidityDeclarationSearchPage {
  const definitionsById = new Map(
    manifest.definitionIndex.map((definition) => [
      definition.id,
      definition.name,
    ])
  );
  const normalizedQuery = query.query.toLowerCase();
  const matchingDeclarations = manifest.declarationIndex.filter(
    (declaration) => {
      const definitionName = declaration.definitionId
        ? (definitionsById.get(declaration.definitionId) ?? "")
        : "";
      return (
        matchesQuery(declaration, definitionName, normalizedQuery) &&
        (!query.kind || declaration.kind === query.kind) &&
        (!query.scope || declaration.scope === query.scope) &&
        matchesLocation(declaration, query.location)
      );
    }
  );
  const items = matchingDeclarations
    .slice(query.offset, query.offset + query.limit)
    .map((declaration) =>
      mapDeclaration({
        declaration,
        definitionName: declaration.definitionId
          ? definitionsById.get(declaration.definitionId)
          : undefined,
        hrefContext,
      })
    );
  const nextOffset =
    query.offset + items.length < matchingDeclarations.length
      ? query.offset + items.length
      : null;

  return {
    items,
    nextOffset,
    reviewId: manifest.reviewId,
    sourceCommit: manifest.source.commit,
    total: matchingDeclarations.length,
    version: manifest.reviewVersion,
  };
}
