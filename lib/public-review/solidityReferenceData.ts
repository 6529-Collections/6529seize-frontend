import "next/dist/compiled/server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  getSolidityManifestOutputSha256,
  toSha256Urn,
} from "@/lib/public-review/solidityReferenceIntegrity.server";
import {
  encodeSoliditySemanticId,
  getIndexedDefinitionByKey,
  getIndexedSourceByPath,
  resolveSoliditySourcePath,
  type SolidityReferenceRouteInventory,
} from "@/lib/public-review/solidityReferenceRoutes";
import {
  SOLIDITY_REFERENCE_BUNDLE_SCHEMA,
  SOLIDITY_REFERENCE_INDEX_SCHEMA,
  SOLIDITY_REFERENCE_SHARD_SCHEMA,
  type SolidityDeclarationKind,
  type SolidityDefinitionIndexEntry,
  type SolidityDefinitionShard,
  type SolidityEventDeclaration,
  type SolidityFunctionDeclaration,
  type SolidityReferenceIndex,
  type SolidityReferenceManifest,
  type SolidityReferenceReviewIdentity,
  type SolidityRoutedDeclaration,
  type SoliditySourceDocument,
  type SoliditySourceFileReference,
  type SoliditySourceRange,
  type SolidityWarningSummary,
} from "@/lib/public-review/solidityReferenceTypes";

const REVIEW_DATA_ROOT = "/review-data";
const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const SAFE_PUBLIC_PATH_PATTERN = /^\/review-data\/[A-Za-z0-9._/-]+$/;
const SAFE_SOURCE_PATH_PATTERN = /^[A-Za-z0-9._/-]+$/;

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0;
}

function isSha256(value: unknown): value is string {
  return typeof value === "string" && SHA256_PATTERN.test(value);
}

function assertStringRecord(
  value: unknown,
  label: string
): asserts value is Readonly<Record<string, string>> {
  if (
    !isRecord(value) ||
    Object.values(value).some((entry) => typeof entry !== "string")
  ) {
    throw new Error(`Invalid ${label} in the Solidity reference.`);
  }
}

function assertNumberRecord(
  value: unknown,
  label: string
): asserts value is Readonly<Record<string, number>> {
  if (
    !isRecord(value) ||
    Object.values(value).some((entry) => !isNonNegativeInteger(entry))
  ) {
    throw new Error(`Invalid ${label} in the Solidity reference.`);
  }
}

function assertSourceRange(
  value: unknown,
  label: string
): asserts value is SoliditySourceRange {
  if (
    !isRecord(value) ||
    !isNonNegativeInteger(value["byteStart"]) ||
    !isPositiveInteger(value["byteLength"]) ||
    !isPositiveInteger(value["lineStart"]) ||
    !isPositiveInteger(value["lineEnd"]) ||
    value["lineStart"] > value["lineEnd"] ||
    typeof value["githubUrl"] !== "string" ||
    !value["githubUrl"].startsWith("https://github.com/") ||
    !isSha256(value["sourceSha256"]) ||
    !isSha256(value["snippetSha256"])
  ) {
    throw new Error(`Invalid ${label} source range.`);
  }
}

function assertReferenceCounts(value: unknown, label: string): void {
  if (
    !isRecord(value) ||
    !isNonNegativeInteger(value["functions"]) ||
    !isNonNegativeInteger(value["events"]) ||
    !isNonNegativeInteger(value["errors"])
  ) {
    throw new Error(`Invalid ${label} counts in the Solidity reference.`);
  }
}

function assertWarningSummary(
  value: unknown
): asserts value is SolidityWarningSummary {
  if (!isRecord(value) || !isNonNegativeInteger(value["totalCount"])) {
    throw new Error("Invalid warning summary in the Solidity reference.");
  }
  assertNumberRecord(value["byCategory"], "warning categories");
  assertNumberRecord(value["byCode"], "warning codes");
}

function assertSafePublicPath(publicPath: string, suffix: string): void {
  if (
    !SAFE_PUBLIC_PATH_PATTERN.test(publicPath) ||
    !publicPath.startsWith(`${REVIEW_DATA_ROOT}/`) ||
    publicPath.includes("//") ||
    publicPath
      .split("/")
      .some((segment) => segment === "." || segment === "..") ||
    !publicPath.endsWith(suffix)
  ) {
    throw new Error("The Solidity reference contains an unsafe public path.");
  }
}

function assertSafeSourcePath(sourcePath: string): void {
  if (
    !SAFE_SOURCE_PATH_PATTERN.test(sourcePath) ||
    sourcePath.startsWith("/") ||
    sourcePath.includes("//") ||
    sourcePath.includes("\\") ||
    sourcePath
      .split("/")
      .some((segment) => segment === "." || segment === "..") ||
    !sourcePath.endsWith(".sol")
  ) {
    throw new Error("The Solidity reference contains an unsafe source path.");
  }
}

function assertIndex(
  value: unknown,
  identity: SolidityReferenceReviewIdentity
): asserts value is SolidityReferenceIndex {
  if (
    !isRecord(value) ||
    value["schemaVersion"] !== SOLIDITY_REFERENCE_INDEX_SCHEMA ||
    value["reviewId"] !== identity.reviewId ||
    value["activeVersion"] !== identity.activeVersion ||
    !Array.isArray(value["versions"]) ||
    value["versions"].length !== identity.availableVersions.length
  ) {
    throw new Error("Invalid Solidity reference index identity.");
  }

  const seenVersions = new Set<string>();
  for (const entry of value["versions"]) {
    if (
      !isRecord(entry) ||
      typeof entry["version"] !== "string" ||
      !identity.availableVersions.includes(entry["version"]) ||
      typeof entry["bundlePath"] !== "string" ||
      !isSha256(entry["bundleSha256"]) ||
      typeof entry["tree"] !== "string" ||
      !/^[0-9a-f]{40}$/.test(entry["tree"]) ||
      entry["commit"] !== identity.sourceCommit
    ) {
      throw new Error("Invalid Solidity reference version entry.");
    }
    assertSafePublicPath(entry["bundlePath"], ".json");
    if (seenVersions.has(entry["version"])) {
      throw new Error("Duplicate Solidity reference version.");
    }
    seenVersions.add(entry["version"]);
  }
}

function assertDefinitionIndexEntry(
  value: unknown
): asserts value is SolidityDefinitionIndexEntry {
  if (
    !isRecord(value) ||
    typeof value["id"] !== "string" ||
    typeof value["key"] !== "string" ||
    !BASE64URL_PATTERN.test(value["key"]) ||
    encodeSoliditySemanticId(value["id"]) !== value["key"] ||
    typeof value["name"] !== "string" ||
    typeof value["kind"] !== "string" ||
    typeof value["classification"] !== "string" ||
    typeof value["classificationReason"] !== "string" ||
    !["protocol", "script", "test"].includes(String(value["scope"])) ||
    typeof value["sourcePath"] !== "string" ||
    typeof value["shardPath"] !== "string" ||
    !isSha256(value["shardSha256"]) ||
    typeof value["abstract"] !== "boolean" ||
    !isRecord(value["interface"]) ||
    typeof value["interface"]["published"] !== "boolean" ||
    !isRecord(value["membership"]) ||
    !isRecord(value["release"])
  ) {
    throw new Error("Invalid Solidity definition index entry.");
  }
  assertSafeSourcePath(value["sourcePath"]);
  assertSafePublicPath(value["shardPath"], ".json");
  assertSourceRange(value["range"], "definition");
  assertReferenceCounts(value["abiSurfaceCounts"], "ABI surface");
  assertReferenceCounts(value["declarationCounts"], "declaration");
  assertWarningSummary(value["warningSummary"]);
}

function assertSourceFile(
  value: unknown
): asserts value is SoliditySourceFileReference {
  if (
    !isRecord(value) ||
    typeof value["path"] !== "string" ||
    typeof value["publicPath"] !== "string" ||
    typeof value["githubUrl"] !== "string" ||
    !value["githubUrl"].startsWith("https://github.com/") ||
    !["protocol", "script", "test"].includes(String(value["scope"])) ||
    !isPositiveInteger(value["lineCount"]) ||
    !isPositiveInteger(value["byteLength"]) ||
    !isSha256(value["sha256"]) ||
    !Array.isArray(value["definitionIds"]) ||
    value["definitionIds"].some((id) => typeof id !== "string") ||
    !Array.isArray(value["topLevelDeclarations"])
  ) {
    throw new Error("Invalid Solidity source file entry.");
  }
  assertSafeSourcePath(value["path"]);
  assertSafePublicPath(value["publicPath"], ".sol");
}

function assertManifest(
  value: unknown,
  {
    identity,
    version,
    versionEntry,
  }: {
    readonly identity: SolidityReferenceReviewIdentity;
    readonly version: string;
    readonly versionEntry: SolidityReferenceIndex["versions"][number];
  }
): asserts value is SolidityReferenceManifest {
  if (
    !isRecord(value) ||
    value["bundleSchemaVersion"] !== SOLIDITY_REFERENCE_BUNDLE_SCHEMA ||
    value["reviewId"] !== identity.reviewId ||
    value["reviewVersion"] !== version ||
    !isRecord(value["source"]) ||
    value["source"]["repository"] !== identity.sourceRepository ||
    value["source"]["commit"] !== identity.sourceCommit ||
    value["source"]["tree"] !== versionEntry.tree ||
    !isRecord(value["generator"]) ||
    !isRecord(value["summary"]) ||
    !Array.isArray(value["definitionIndex"]) ||
    !Array.isArray(value["files"])
  ) {
    throw new Error("Invalid Solidity reference manifest identity.");
  }

  assertStringRecord(value["source"]["sourceChecksums"], "source checksums");
  assertStringRecord(
    value["source"]["artifactChecksums"],
    "artifact checksums"
  );
  assertWarningSummary(value["warningSummary"]);
  assertNumberRecord(value["summary"]["classifications"], "classifications");
  assertNumberRecord(value["summary"]["releaseSurface"], "release surface");

  const definitionKeys = new Set<string>();
  const definitionIds = new Set<string>();
  for (const definition of value["definitionIndex"]) {
    assertDefinitionIndexEntry(definition);
    if (
      definitionKeys.has(definition.key) ||
      definitionIds.has(definition.id)
    ) {
      throw new Error("Duplicate Solidity definition identity.");
    }
    definitionKeys.add(definition.key);
    definitionIds.add(definition.id);
  }

  const sourcePaths = new Set<string>();
  for (const file of value["files"]) {
    assertSourceFile(file);
    if (sourcePaths.has(file.path)) {
      throw new Error("Duplicate Solidity source path.");
    }
    sourcePaths.add(file.path);
    if (value["source"]["sourceChecksums"][file.path] !== file.sha256) {
      throw new Error("Solidity source checksum index drift.");
    }
  }

  if (
    value["summary"]["definitionCount"] !== value["definitionIndex"].length ||
    value["summary"]["fileCount"] !== value["files"].length ||
    value["summary"]["warningCount"] !== value["warningSummary"]["totalCount"]
  ) {
    throw new Error("Solidity reference summary drift.");
  }
}

function assertDeclaration(
  value: unknown,
  kind: SolidityDeclarationKind,
  sourceSha256: string
): asserts value is SolidityRoutedDeclaration {
  const singularKind = kind.slice(0, -1);
  if (
    !isRecord(value) ||
    value["kind"] !== singularKind ||
    typeof value["id"] !== "string" ||
    typeof value["key"] !== "string" ||
    encodeSoliditySemanticId(value["id"]) !== value["key"] ||
    typeof value["name"] !== "string" ||
    typeof value["displaySignature"] !== "string" ||
    !Array.isArray(value["inputs"]) ||
    typeof value["natspec"] !== "string"
  ) {
    throw new Error(`Invalid Solidity ${singularKind} declaration.`);
  }
  assertSourceRange(value["range"], `Solidity ${singularKind}`);
  if (value["range"].sourceSha256 !== sourceSha256) {
    throw new Error("Solidity declaration source checksum drift.");
  }
  if (
    kind === "functions" &&
    ((value["canonicalSignature"] !== null &&
      typeof value["canonicalSignature"] !== "string") ||
      (value["selector"] !== null && typeof value["selector"] !== "string") ||
      !Array.isArray(value["outputs"]) ||
      typeof value["stateMutability"] !== "string" ||
      typeof value["visibility"] !== "string")
  ) {
    throw new Error("Invalid Solidity function declaration.");
  }
  if (
    kind === "events" &&
    (typeof value["canonicalSignature"] !== "string" ||
      typeof value["topic0"] !== "string")
  ) {
    throw new Error("Invalid Solidity event declaration.");
  }
  if (
    kind === "errors" &&
    (typeof value["canonicalSignature"] !== "string" ||
      typeof value["selector"] !== "string")
  ) {
    throw new Error("Invalid Solidity error declaration.");
  }
}

function assertShard(
  value: unknown,
  {
    indexEntry,
    manifest,
  }: {
    readonly indexEntry: SolidityDefinitionIndexEntry;
    readonly manifest: SolidityReferenceManifest;
  }
): asserts value is SolidityDefinitionShard {
  if (
    !isRecord(value) ||
    value["shardSchemaVersion"] !== SOLIDITY_REFERENCE_SHARD_SCHEMA ||
    value["reviewId"] !== manifest.reviewId ||
    value["reviewVersion"] !== manifest.reviewVersion ||
    !isRecord(value["definition"]) ||
    value["definition"]["id"] !== indexEntry.id ||
    value["definition"]["key"] !== indexEntry.key ||
    value["definition"]["sourcePath"] !== indexEntry.sourcePath ||
    !isRecord(value["definition"]["declarations"]) ||
    !isRecord(value["definition"]["abiSurface"]) ||
    !Array.isArray(value["warnings"])
  ) {
    throw new Error("Invalid Solidity definition shard identity.");
  }

  assertSourceRange(value["definition"]["range"], "shard definition");
  if (
    value["definition"]["range"]["sourceSha256"] !==
    indexEntry.range.sourceSha256
  ) {
    throw new Error("Solidity definition source checksum drift.");
  }
  assertWarningSummary(value["warningSummary"]);

  for (const kind of ["functions", "events", "errors"] as const) {
    const declarations = value["definition"]["declarations"][kind];
    if (!Array.isArray(declarations)) {
      throw new Error(`Missing Solidity ${kind} declarations.`);
    }
    const declarationKeys = new Set<string>();
    for (const declaration of declarations) {
      assertDeclaration(declaration, kind, indexEntry.range.sourceSha256);
      if (declarationKeys.has(declaration.key)) {
        throw new Error(`Duplicate Solidity ${kind} declaration identity.`);
      }
      declarationKeys.add(declaration.key);
    }
  }
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
      assertIndex(value, identity);
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
      assertManifest(value, { identity, version, versionEntry });
      return { index, manifest: value, versionEntry };
    })();
    cache.set(version, pending);
    return pending;
  };
}

function createDefinitionLoader({
  loadManifest,
  publicRoot,
}: {
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
        assertShard(value, { indexEntry, manifest });
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
  loadManifest,
  publicRoot,
}: {
  readonly loadManifest: SolidityReferenceReader["loadManifest"];
  readonly publicRoot: string;
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
    const filePath = resolveContainedPublicPath(
      publicRoot,
      file.publicPath,
      ".sol"
    );
    // The manifest allowlists the path and containment is checked above.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const sourceBuffer = await readFile(filePath);
    if (
      toSha256Urn(sourceBuffer) !== file.sha256 ||
      sourceBuffer.byteLength !== file.byteLength
    ) {
      throw new Error("Solidity source file checksum drift.");
    }
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
    };
  };
}

export function createSolidityReferenceReader({
  identity,
  publicRoot = path.resolve(process.cwd(), "public"),
}: SolidityReferenceReaderOptions): SolidityReferenceReader {
  const loadIndex = createIndexLoader({ identity, publicRoot });
  const loadManifest = createManifestLoader({
    identity,
    loadIndex,
    publicRoot,
  });
  const loadDefinition = createDefinitionLoader({
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
    loadSource: createSourceLoader({ loadManifest, publicRoot }),
  };
}
