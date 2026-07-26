import "next/dist/compiled/server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  getSolidityManifestOutputSha256,
  toSha256Urn,
} from "@/lib/public-review/solidityReferenceIntegrity.server";
import {
  assertSolidityDefinitionSourceIntegrity,
  assertSolidityFileScopeSourceIntegrity,
} from "@/lib/public-review/solidityReferenceSourceIntegrity.server";
import {
  encodeSoliditySemanticId,
  getIndexedDefinitionByKey,
  getIndexedSourceByPath,
  resolveSoliditySourcePath,
  type SolidityReferenceRouteInventory,
} from "@/lib/public-review/solidityReferenceRoutes";
import type {
  SolidityDeclarationKind,
  SolidityDefinitionIndexEntry,
  SolidityDefinitionShard,
  SolidityEventDeclaration,
  SolidityFunctionDeclaration,
  SolidityReferenceIndex,
  SolidityReferenceManifest,
  SolidityReferenceReviewIdentity,
  SolidityRoutedDeclaration,
  SoliditySourceDocument,
  SoliditySourceFileReference,
} from "@/lib/public-review/solidityReferenceTypes";
import {
  assertSolidityReferenceIndex,
  assertSolidityReferenceManifest,
} from "@/lib/public-review/solidityReferenceValidation.server";
import { assertSolidityDefinitionShard } from "@/lib/public-review/solidityReferenceShardValidation.server";
import { assertSafePublicPath } from "@/lib/public-review/solidityReferenceValidationPrimitives.server";

const REVIEW_DATA_ROOT = "/review-data";

interface SolidityReferenceReaderOptions {
  readonly identity: SolidityReferenceReviewIdentity;
  readonly publicRoot?: string | undefined;
}

export class SolidityReferenceNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SolidityReferenceNotFoundError";
  }
}

export interface SolidityReferenceReader {
  loadDefinition(
    version: string,
    definitionKey: string
  ): Promise<{
    readonly indexEntry: SolidityDefinitionIndexEntry;
    readonly manifest: SolidityReferenceManifest;
    readonly shard: SolidityDefinitionShard;
  }>;
  loadDeclaration(
    version: string,
    definitionKey: string,
    kind: SolidityDeclarationKind,
    declarationKey: string
  ): Promise<{
    readonly declaration: SolidityRoutedDeclaration;
    readonly indexEntry: SolidityDefinitionIndexEntry;
    readonly manifest: SolidityReferenceManifest;
    readonly shard: SolidityDefinitionShard;
  }>;
  loadIndex(): Promise<SolidityReferenceIndex>;
  loadManifest(version?: string): Promise<{
    readonly index: SolidityReferenceIndex;
    readonly manifest: SolidityReferenceManifest;
    readonly versionEntry: SolidityReferenceIndex["versions"][number];
  }>;
  loadRouteInventory(
    version?: string
  ): Promise<SolidityReferenceRouteInventory>;
  loadSource(
    version: string,
    sourceSegments: readonly string[]
  ): Promise<{
    readonly document: SoliditySourceDocument;
    readonly manifest: SolidityReferenceManifest;
  }>;
}

function resolveContainedPublicPath(
  publicRoot: string,
  publicPath: string,
  suffix: string
): string {
  assertSafePublicPath(publicPath, suffix);
  const resolvedRoot = path.resolve(publicRoot);
  const resolvedPath = path.resolve(
    resolvedRoot,
    ...publicPath.slice(1).split("/")
  );
  const relative = path.relative(resolvedRoot, resolvedPath);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("The Solidity reference path escapes the public root.");
  }
  return resolvedPath;
}

async function readChecksummedJson(
  publicRoot: string,
  publicPath: string,
  expectedSha256?: string,
  checksumKind: "file" | "manifest-output" = "file"
): Promise<unknown> {
  const filePath = resolveContainedPublicPath(publicRoot, publicPath, ".json");
  // The path is constrained beneath the configured public root above.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const source = await readFile(filePath);
  let value: unknown;
  try {
    value = JSON.parse(source.toString("utf8")) as unknown;
  } catch {
    throw new Error("Invalid JSON in the Solidity reference.");
  }
  const actualSha256 =
    checksumKind === "manifest-output"
      ? getSolidityManifestOutputSha256(value)
      : toSha256Urn(source);
  if (expectedSha256 && actualSha256 !== expectedSha256) {
    throw new Error("Solidity reference JSON checksum drift.");
  }
  return value;
}

function splitSourceLines(source: string): readonly string[] {
  const normalized = source.endsWith("\n") ? source.slice(0, -1) : source;
  return normalized.split("\n");
}

function getDeclarations(
  shard: SolidityDefinitionShard,
  kind: SolidityDeclarationKind
):
  | readonly SolidityFunctionDeclaration[]
  | readonly SolidityEventDeclaration[]
  | readonly SolidityRoutedDeclaration[] {
  return shard.definition.declarations[kind];
}

type LoadedManifest = Awaited<
  ReturnType<SolidityReferenceReader["loadManifest"]>
>;
type LoadedDefinition = Awaited<
  ReturnType<SolidityReferenceReader["loadDefinition"]>
>;
type SourceBufferLoader = (
  file: SoliditySourceFileReference
) => Promise<Buffer>;

function createSourceBufferLoader(
  publicRoot: string
): SourceBufferLoader {
  const cache = new Map<string, Promise<Buffer>>();
  return (file) => {
    let pending = cache.get(file.publicPath);
    if (!pending) {
      pending = (async () => {
        const filePath = resolveContainedPublicPath(
          publicRoot,
          file.publicPath,
          ".sol"
        );
        // The manifest allowlists the path and containment is checked above.
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        const source = await readFile(filePath);
        if (
          toSha256Urn(source) !== file.sha256 ||
          source.byteLength !== file.byteLength
        ) {
          throw new Error("Solidity source file checksum drift.");
        }
        return source;
      })();
      cache.set(file.publicPath, pending);
    }
    return pending;
  };
}

function createIndexLoader({
  identity,
  publicRoot,
}: {
  readonly identity: SolidityReferenceReviewIdentity;
  readonly publicRoot: string;
}): SolidityReferenceReader["loadIndex"] {
  let indexPromise: Promise<SolidityReferenceIndex> | undefined;
  return () => {
    indexPromise ??= (async () => {
      const value = await readChecksummedJson(
        publicRoot,
        `${REVIEW_DATA_ROOT}/${identity.reviewId}/index.json`
      );
      assertSolidityReferenceIndex(value, identity);
      return value;
    })();
    return indexPromise;
  };
}

function createManifestLoader({
  identity,
  loadIndex,
  publicRoot,
}: {
  readonly identity: SolidityReferenceReviewIdentity;
  readonly loadIndex: SolidityReferenceReader["loadIndex"];
  readonly publicRoot: string;
}): SolidityReferenceReader["loadManifest"] {
  const cache = new Map<string, Promise<LoadedManifest>>();
  return (requestedVersion) => {
    const version = requestedVersion ?? identity.activeVersion;
    const cached = cache.get(version);
    if (cached) {
      return cached;
    }
    const pending = (async () => {
      if (!identity.availableVersions.includes(version)) {
        throw new SolidityReferenceNotFoundError(
          `Unknown Solidity reference version: ${version}`
        );
      }
      const index = await loadIndex();
      const versionEntry = index.versions.find(
        (candidate) => candidate.version === version
      );
      if (!versionEntry) {
        throw new SolidityReferenceNotFoundError(
          `Missing Solidity reference version: ${version}`
        );
      }
      const value = await readChecksummedJson(
        publicRoot,
        versionEntry.bundlePath,
        versionEntry.bundleSha256,
        "manifest-output"
      );
      assertSolidityReferenceManifest(value, {
        identity,
        version,
        versionEntry,
      });
      return { index, manifest: value, versionEntry };
    })();
    cache.set(version, pending);
    return pending;
  };
}

function createDefinitionLoader({
  loadSourceBuffer,
  loadManifest,
  publicRoot,
}: {
  readonly loadSourceBuffer: SourceBufferLoader;
  readonly loadManifest: SolidityReferenceReader["loadManifest"];
  readonly publicRoot: string;
}): SolidityReferenceReader["loadDefinition"] {
  const cache = new Map<string, Promise<SolidityDefinitionShard>>();
  return async (version, definitionKey) => {
    const { manifest } = await loadManifest(version);
    const indexEntry = getIndexedDefinitionByKey(
      manifest.definitionIndex,
      definitionKey
    );
    if (!indexEntry) {
      throw new SolidityReferenceNotFoundError("Unknown Solidity definition.");
    }
    const cacheKey = `${version}:${definitionKey}`;
    let shardPromise = cache.get(cacheKey);
    if (!shardPromise) {
      shardPromise = (async () => {
        const value = await readChecksummedJson(
          publicRoot,
          indexEntry.shardPath,
          indexEntry.shardSha256
        );
        assertSolidityDefinitionShard(value, { indexEntry, manifest });
        const file = getIndexedSourceByPath(
          manifest.files,
          indexEntry.sourcePath
        );
        if (!file) {
          throw new Error("Solidity definition source file is missing.");
        }
        assertSolidityDefinitionSourceIntegrity({
          file,
          shard: value,
          source: await loadSourceBuffer(file),
        });
        return value;
      })();
      cache.set(cacheKey, shardPromise);
    }
    return { indexEntry, manifest, shard: await shardPromise };
  };
}

function createDeclarationLoader(
  loadDefinition: SolidityReferenceReader["loadDefinition"]
): SolidityReferenceReader["loadDeclaration"] {
  return async (version, definitionKey, kind, declarationKey) => {
    const definition = await loadDefinition(version, definitionKey);
    const declaration = getDeclarations(definition.shard, kind).find(
      (candidate) => candidate.key === declarationKey
    );
    if (
      !declaration ||
      encodeSoliditySemanticId(declaration.id) !== declarationKey
    ) {
      throw new SolidityReferenceNotFoundError("Unknown Solidity declaration.");
    }
    return { ...definition, declaration };
  };
}

function createSourceLoader({
  loadSourceBuffer,
  loadManifest,
}: {
  readonly loadSourceBuffer: SourceBufferLoader;
  readonly loadManifest: SolidityReferenceReader["loadManifest"];
}): SolidityReferenceReader["loadSource"] {
  return async (version, sourceSegments) => {
    const sourcePath = resolveSoliditySourcePath(sourceSegments);
    if (!sourcePath) {
      throw new SolidityReferenceNotFoundError(
        "Invalid Solidity source route."
      );
    }
    const { manifest } = await loadManifest(version);
    const file = getIndexedSourceByPath(manifest.files, sourcePath);
    if (!file) {
      throw new SolidityReferenceNotFoundError("Unknown Solidity source file.");
    }
    const sourceBuffer = await loadSourceBuffer(file);
    assertSolidityFileScopeSourceIntegrity({ file, source: sourceBuffer });
    const source = sourceBuffer.toString("utf8");
    const lines = splitSourceLines(source);
    if (lines.length !== file.lineCount) {
      throw new Error("Solidity source line-count drift.");
    }
    return {
      document: { file, lines, source },
      manifest,
    };
  };
}

function mapDeclarationRoutes(
  definitions: readonly LoadedDefinition[],
  kind: SolidityDeclarationKind
) {
  return definitions.flatMap(({ shard }) =>
    getDeclarations(shard, kind).map((declaration) => ({
      definitionKey: shard.definition.key,
      declarationKey: declaration.key,
    }))
  );
}

function createRouteInventoryLoader({
  identity,
  loadDefinition,
  loadManifest,
}: {
  readonly identity: SolidityReferenceReviewIdentity;
  readonly loadDefinition: SolidityReferenceReader["loadDefinition"];
  readonly loadManifest: SolidityReferenceReader["loadManifest"];
}): SolidityReferenceReader["loadRouteInventory"] {
  return async (version) => {
    const resolvedVersion = version ?? identity.activeVersion;
    const { manifest } = await loadManifest(resolvedVersion);
    const definitions = await Promise.all(
      manifest.definitionIndex.map((entry) =>
        loadDefinition(resolvedVersion, entry.key)
      )
    );
    return {
      definitions: manifest.definitionIndex.map((entry) => ({
        definitionKey: entry.key,
      })),
      functions: mapDeclarationRoutes(definitions, "functions"),
      events: mapDeclarationRoutes(definitions, "events"),
      errors: mapDeclarationRoutes(definitions, "errors"),
      interfaces: manifest.definitionIndex
        .filter((entry) => entry.interface.published)
        .map((entry) => ({ definitionKey: entry.key })),
      sources: manifest.files.map((file) => ({
        source: file.path.split("/"),
      })),
      topLevelDeclarations: manifest.declarationIndex
        .filter((declaration) => declaration.topLevel)
        .map((declaration) => ({
          declarationKey: declaration.key,
        })),
    };
  };
}

export function createSolidityReferenceReader({
  identity,
  publicRoot = path.resolve(process.cwd(), "public"),
}: SolidityReferenceReaderOptions): SolidityReferenceReader {
  const loadIndex = createIndexLoader({ identity, publicRoot });
  const loadSourceBuffer = createSourceBufferLoader(publicRoot);
  const loadManifest = createManifestLoader({
    identity,
    loadIndex,
    publicRoot,
  });
  const loadDefinition = createDefinitionLoader({
    loadSourceBuffer,
    loadManifest,
    publicRoot,
  });
  return {
    loadDefinition,
    loadDeclaration: createDeclarationLoader(loadDefinition),
    loadIndex,
    loadManifest,
    loadRouteInventory: createRouteInventoryLoader({
      identity,
      loadDefinition,
      loadManifest,
    }),
    loadSource: createSourceLoader({ loadManifest, loadSourceBuffer }),
  };
}
