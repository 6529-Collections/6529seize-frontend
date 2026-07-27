import type {
  SolidityDeclarationIndexEntry,
  SolidityDeclarationKind,
  SolidityDefinitionIndexEntry,
  SoliditySourceFileReference,
} from "@/lib/public-review/solidityReferenceTypes";

export interface SolidityReferenceHrefContext {
  readonly reviewSlug: string;
  readonly version?: string | undefined;
}

export function encodeSoliditySemanticId(id: string): string {
  return Buffer.from(id, "utf8").toString("base64url");
}

export function getSolidityReferenceRootHref({
  reviewSlug,
  version,
}: SolidityReferenceHrefContext): string {
  const reviewRoot = `/reviews/${reviewSlug}`;
  return version
    ? `${reviewRoot}/versions/${version}/reference`
    : `${reviewRoot}/reference`;
}

export function getSolidityDefinitionHref({
  definitionKey,
  ...context
}: SolidityReferenceHrefContext & {
  readonly definitionKey: string;
}): string {
  return `${getSolidityReferenceRootHref(context)}/definitions/${definitionKey}`;
}

export function getSolidityDeclarationHref({
  declarationKey,
  definitionKey,
  kind,
  ...context
}: SolidityReferenceHrefContext & {
  readonly declarationKey: string;
  readonly definitionKey: string;
  readonly kind: SolidityDeclarationKind;
}): string {
  return `${getSolidityDefinitionHref({
    ...context,
    definitionKey,
  })}/${kind}/${declarationKey}`;
}

export function getSolidityInterfaceHref({
  definitionKey,
  ...context
}: SolidityReferenceHrefContext & {
  readonly definitionKey: string;
}): string {
  return `${getSolidityReferenceRootHref(context)}/interfaces/${definitionKey}`;
}

export function getSoliditySourceHref({
  sourcePath,
  ...context
}: SolidityReferenceHrefContext & {
  readonly sourcePath: string;
}): string {
  const encodedPath = sourcePath.split("/").map(encodeURIComponent).join("/");
  return `${getSolidityReferenceRootHref(context)}/sources/${encodedPath}`;
}

export function getSolidityTopLevelDeclarationHref({
  declarationKey,
  ...context
}: SolidityReferenceHrefContext & {
  readonly declarationKey: string;
}): string {
  return `${getSolidityReferenceRootHref(
    context
  )}/declarations/${declarationKey}`;
}

export function getSolidityDeclarationIndexHref({
  declaration,
  ...context
}: SolidityReferenceHrefContext & {
  readonly declaration: SolidityDeclarationIndexEntry;
}): string {
  if (declaration.topLevel) {
    return getSolidityTopLevelDeclarationHref({
      ...context,
      declarationKey: declaration.key,
    });
  }
  if (!declaration.definitionKey) {
    throw new Error("Definition-scoped declaration is missing its owner.");
  }
  const kinds: Record<
    SolidityDeclarationIndexEntry["kind"],
    SolidityDeclarationKind
  > = {
    error: "errors",
    event: "events",
    function: "functions",
  };
  return getSolidityDeclarationHref({
    ...context,
    declarationKey: declaration.key,
    definitionKey: declaration.definitionKey,
    kind: kinds[declaration.kind],
  });
}

export interface SolidityReferenceRouteInventory {
  readonly definitions: readonly {
    readonly definitionKey: string;
  }[];
  readonly errors: readonly {
    readonly declarationKey: string;
    readonly definitionKey: string;
  }[];
  readonly events: readonly {
    readonly declarationKey: string;
    readonly definitionKey: string;
  }[];
  readonly functions: readonly {
    readonly declarationKey: string;
    readonly definitionKey: string;
  }[];
  readonly interfaces: readonly {
    readonly definitionKey: string;
  }[];
  readonly sources: readonly {
    readonly source: readonly string[];
  }[];
  readonly topLevelDeclarations: readonly {
    readonly declarationKey: string;
  }[];
}

function isSafeSoliditySourceSegments(segments: readonly string[]): boolean {
  return (
    segments.length > 0 &&
    segments.every(
      (segment) =>
        segment.length > 0 &&
        segment !== "." &&
        segment !== ".." &&
        !segment.includes("\\") &&
        !segment.includes("/") &&
        !segment.includes("\0")
    )
  );
}

export function resolveSoliditySourcePath(
  segments: readonly string[]
): string | undefined {
  return isSafeSoliditySourceSegments(segments)
    ? segments.join("/")
    : undefined;
}

export function getIndexedDefinitionByKey(
  definitions: readonly SolidityDefinitionIndexEntry[],
  definitionKey: string
): SolidityDefinitionIndexEntry | undefined {
  const definition = definitions.find(
    (candidate) => candidate.key === definitionKey
  );
  if (!definition) {
    return undefined;
  }
  return encodeSoliditySemanticId(definition.id) === definition.key
    ? definition
    : undefined;
}

export function getIndexedSourceByPath(
  files: readonly SoliditySourceFileReference[],
  sourcePath: string
): SoliditySourceFileReference | undefined {
  return files.find((candidate) => candidate.path === sourcePath);
}
