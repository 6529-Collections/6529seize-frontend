import "next/dist/compiled/server-only";

import type {
  SolidityDeclarationIndexEntry,
  SolidityDefinitionIndexEntry,
  SolidityParameter,
  SolidityReferenceIndex,
  SolidityReferenceManifest,
  SolidityReferenceReviewIdentity,
  SoliditySourceFileReference,
  SoliditySourceRange,
  SolidityTopLevelDeclaration,
} from "@/lib/public-review/solidityReferenceTypes";
import {
  SOLIDITY_REFERENCE_BUNDLE_SCHEMA,
  SOLIDITY_REFERENCE_GENERATOR_NAME,
  SOLIDITY_REFERENCE_GENERATOR_VERSION,
  SOLIDITY_REFERENCE_INDEX_SCHEMA,
} from "@/lib/public-review/solidityReferenceTypes";
import { encodeSoliditySemanticId } from "@/lib/public-review/solidityReferenceRoutes";
import { assertAuditorEvidence } from "@/lib/public-review/solidityReferenceAuditorEvidenceValidation.server";
import {
  assertNumberRecord,
  assertReferenceCounts,
  assertSafePublicPath,
  assertSafeSourcePath,
  assertSourceRange,
  assertStringRecord,
  assertWarningSummary,
  isNonNegativeInteger,
  isPositiveInteger,
  isRecord,
  isSafeSourceRoot,
  isSha256,
  sourceRangesEqual,
} from "@/lib/public-review/solidityReferenceValidationPrimitives.server";

const GIT_HASH_PATTERN = /^[0-9a-f]{40}$/;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const VALID_SCOPES = ["protocol", "script", "test"];

function getVersionRoot(reviewId: string, version: string): string {
  return `/review-data/${reviewId}/versions/${version}`;
}

function getExpectedGitHubUrl(
  repository: string,
  commit: string,
  sourcePath: string,
  range?: SoliditySourceRange
): string {
  const base = `https://github.com/${repository}/blob/${commit}/${sourcePath}`;
  if (!range) {
    return base;
  }
  const fragment =
    range.lineStart === range.lineEnd
      ? `#L${range.lineStart}`
      : `#L${range.lineStart}-L${range.lineEnd}`;
  return `${base}${fragment}`;
}

function assertShaRecord(value: unknown, label: string): void {
  assertStringRecord(value, label);
  if (Object.values(value).some((entry) => !isSha256(entry))) {
    throw new Error(`Invalid ${label} checksum in the Solidity reference.`);
  }
}

function assertParameter(
  value: unknown,
  label: string
): asserts value is SolidityParameter {
  if (
    !isRecord(value) ||
    !isNonNegativeInteger(value["index"]) ||
    typeof value["name"] !== "string" ||
    typeof value["type"] !== "string" ||
    (value["internalType"] !== undefined &&
      typeof value["internalType"] !== "string") ||
    (value["storageLocation"] !== undefined &&
      typeof value["storageLocation"] !== "string") ||
    (value["indexed"] !== undefined && typeof value["indexed"] !== "boolean")
  ) {
    throw new Error(`Invalid ${label} parameter in the Solidity reference.`);
  }
}

export function assertParameters(value: unknown, label: string): void {
  if (!Array.isArray(value)) {
    throw new Error(`Missing ${label} parameters in the Solidity reference.`);
  }
  value.forEach((parameter) => assertParameter(parameter, label));
}

export function assertReleaseEvidence(value: unknown): void {
  if (!isRecord(value) || typeof value["tracked"] !== "boolean") {
    throw new Error("Invalid Solidity release evidence.");
  }
  for (const field of [
    "abiSha256",
    "bytecodeSha256",
    "deployedBytecodeSha256",
  ]) {
    if (value[field] !== undefined && !isSha256(value[field])) {
      throw new Error("Invalid Solidity release checksum.");
    }
  }
  if (
    value["deployedBytecodeSizeBytes"] !== undefined &&
    !isNonNegativeInteger(value["deployedBytecodeSizeBytes"])
  ) {
    throw new Error("Invalid Solidity deployed bytecode size.");
  }
  if (value["summary"] !== undefined) {
    const summary = value["summary"];
    const countFields = [
      "custom_error_count",
      "event_count",
      "function_count",
      "payable_function_count",
      "read_function_count",
      "write_function_count",
    ];
    if (
      !isRecord(summary) ||
      countFields.some((field) => !isNonNegativeInteger(summary[field]))
    ) {
      throw new Error("Invalid Solidity release summary.");
    }
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
    !["contract", "interface", "library"].includes(String(value["kind"])) ||
    typeof value["classification"] !== "string" ||
    typeof value["classificationReason"] !== "string" ||
    !VALID_SCOPES.includes(String(value["scope"])) ||
    typeof value["sourcePath"] !== "string" ||
    typeof value["shardPath"] !== "string" ||
    !isSha256(value["shardSha256"]) ||
    typeof value["abstract"] !== "boolean" ||
    !isRecord(value["interface"]) ||
    typeof value["interface"]["published"] !== "boolean" ||
    !isRecord(value["membership"]) ||
    !isRecord(value["membership"]["deployment"]) ||
    typeof value["membership"]["deployment"]["status"] !== "string" ||
    (value["membership"]["deployment"]["address"] !== null &&
      typeof value["membership"]["deployment"]["address"] !== "string") ||
    typeof value["membership"]["genesisTarget"] !== "boolean" ||
    (value["membership"]["releaseCatalog"] !== null &&
      typeof value["membership"]["releaseCatalog"] !== "string")
  ) {
    throw new Error("Invalid Solidity definition index entry.");
  }
  const interfaceRecord = value["interface"];
  if (
    (interfaceRecord["abiSha256"] !== undefined &&
      !isSha256(interfaceRecord["abiSha256"])) ||
    (interfaceRecord["interfaceId"] !== undefined &&
      typeof interfaceRecord["interfaceId"] !== "string") ||
    (interfaceRecord["interfaceIdSource"] !== undefined &&
      typeof interfaceRecord["interfaceIdSource"] !== "string")
  ) {
    throw new Error("Invalid Solidity published interface evidence.");
  }
  assertReleaseEvidence(value["release"]);
  assertSafeSourcePath(value["sourcePath"]);
  assertSafePublicPath(value["shardPath"], ".json");
  assertSourceRange(value["range"], "definition");
  assertReferenceCounts(value["abiSurfaceCounts"], "ABI surface");
  assertReferenceCounts(value["declarationCounts"], "declaration");
  const declarationCounts = value["declarationCounts"];
  for (const field of [
    "enums",
    "modifiers",
    "stateVariables",
    "structs",
    "userDefinedValueTypes",
  ]) {
    if (!isNonNegativeInteger(declarationCounts[field])) {
      throw new Error("Invalid local Solidity declaration counts.");
    }
  }
  assertWarningSummary(value["warningSummary"]);
}

function assertTopLevelCallable(value: Record<string, unknown>): void {
  if (
    typeof value["displaySignature"] !== "string" ||
    (value["canonicalSignature"] !== null &&
      typeof value["canonicalSignature"] !== "string")
  ) {
    throw new Error("Invalid file-scope Solidity signature.");
  }
  assertParameters(value["inputs"], "file-scope declaration input");
}

function assertTopLevelFunction(value: Record<string, unknown>): void {
  assertTopLevelCallable(value);
  assertParameters(value["outputs"], "file-scope function output");
  if (
    typeof value["functionKind"] !== "string" ||
    !Array.isArray(value["modifiers"]) ||
    value["modifiers"].some((entry) => typeof entry !== "string") ||
    typeof value["stateMutability"] !== "string" ||
    typeof value["virtual"] !== "boolean" ||
    typeof value["visibility"] !== "string" ||
    (value["selector"] !== null && typeof value["selector"] !== "string")
  ) {
    throw new Error("Invalid file-scope Solidity function.");
  }
}

function assertTopLevelVariable(value: Record<string, unknown>): void {
  if (
    typeof value["constant"] !== "boolean" ||
    typeof value["immutable"] !== "boolean" ||
    typeof value["type"] !== "string" ||
    (value["typeString"] !== null && typeof value["typeString"] !== "string") ||
    (value["storageLocation"] !== null &&
      typeof value["storageLocation"] !== "string") ||
    (value["visibility"] !== null && typeof value["visibility"] !== "string") ||
    (value["valueRange"] !== null && !isRecord(value["valueRange"])) ||
    (value["valueSource"] !== null && typeof value["valueSource"] !== "string")
  ) {
    throw new Error("Invalid file-scope Solidity variable.");
  }
  if (value["valueRange"] !== null) {
    assertSourceRange(value["valueRange"], "file-scope variable initializer");
  }
}

function assertTopLevelKind(value: Record<string, unknown>): void {
  switch (value["kind"]) {
    case "function":
      assertTopLevelFunction(value);
      return;
    case "event":
      assertTopLevelCallable(value);
      if (
        typeof value["anonymous"] !== "boolean" ||
        (value["topic0"] !== null && typeof value["topic0"] !== "string")
      ) {
        throw new Error("Invalid file-scope Solidity event.");
      }
      return;
    case "error":
      assertTopLevelCallable(value);
      if (typeof value["selector"] !== "string") {
        throw new Error("Invalid file-scope Solidity error.");
      }
      return;
    case "struct":
      if (
        typeof value["canonicalName"] !== "string" ||
        !Array.isArray(value["members"])
      ) {
        throw new Error("Invalid file-scope Solidity struct.");
      }
      assertParameters(value["members"], "file-scope struct member");
      return;
    case "enum":
      if (
        typeof value["canonicalName"] !== "string" ||
        !Array.isArray(value["members"]) ||
        value["members"].some((entry) => typeof entry !== "string")
      ) {
        throw new Error("Invalid file-scope Solidity enum.");
      }
      return;
    case "userDefinedValueType":
      if (
        typeof value["canonicalName"] !== "string" ||
        typeof value["underlyingType"] !== "string"
      ) {
        throw new Error("Invalid file-scope Solidity value type.");
      }
      return;
    case "variable":
      assertTopLevelVariable(value);
      return;
    default:
      throw new Error("Invalid file-scope Solidity kind.");
  }
}

function assertTopLevelDeclaration(
  value: unknown
): asserts value is SolidityTopLevelDeclaration {
  if (
    !isRecord(value) ||
    typeof value["id"] !== "string" ||
    typeof value["key"] !== "string" ||
    encodeSoliditySemanticId(value["id"]) !== value["key"] ||
    typeof value["name"] !== "string" ||
    typeof value["natspec"] !== "string" ||
    typeof value["nodeType"] !== "string"
  ) {
    throw new Error("Invalid file-scope Solidity declaration.");
  }
  assertSourceRange(value["range"], "file-scope declaration");
  assertTopLevelKind(value);
}

function assertSourceFile(
  value: unknown
): asserts value is SoliditySourceFileReference {
  if (
    !isRecord(value) ||
    typeof value["path"] !== "string" ||
    typeof value["publicPath"] !== "string" ||
    typeof value["githubUrl"] !== "string" ||
    !VALID_SCOPES.includes(String(value["scope"])) ||
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
  value["topLevelDeclarations"].forEach(assertTopLevelDeclaration);
}

function assertDeclarationIndexEntry(
  value: unknown
): asserts value is SolidityDeclarationIndexEntry {
  if (
    !isRecord(value) ||
    typeof value["id"] !== "string" ||
    typeof value["key"] !== "string" ||
    encodeSoliditySemanticId(value["id"]) !== value["key"] ||
    !["function", "event", "error"].includes(String(value["kind"])) ||
    typeof value["name"] !== "string" ||
    typeof value["displaySignature"] !== "string" ||
    (value["canonicalSignature"] !== null &&
      typeof value["canonicalSignature"] !== "string") ||
    (value["selector"] !== null && typeof value["selector"] !== "string") ||
    (value["topic0"] !== null && typeof value["topic0"] !== "string") ||
    typeof value["syntheticGetter"] !== "boolean" ||
    typeof value["topLevel"] !== "boolean" ||
    typeof value["sourcePath"] !== "string" ||
    typeof value["sourcePublicPath"] !== "string" ||
    !VALID_SCOPES.includes(String(value["scope"]))
  ) {
    throw new Error("Invalid global Solidity declaration index entry.");
  }
  const definitionFields = [
    value["definitionId"],
    value["definitionKey"],
    value["definitionShardPath"],
  ];
  if (
    (value["topLevel"] && definitionFields.some((entry) => entry !== null)) ||
    (!value["topLevel"] &&
      definitionFields.some((entry) => typeof entry !== "string"))
  ) {
    throw new Error("Invalid global Solidity declaration parent identity.");
  }
  assertSafeSourcePath(value["sourcePath"]);
  assertSafePublicPath(value["sourcePublicPath"], ".sol");
  assertSourceRange(value["range"], "global declaration");
}

function assertRangeForFile({
  commit,
  file,
  range,
  repository,
  sourcePath,
}: {
  readonly commit: string;
  readonly file: SoliditySourceFileReference;
  readonly range: SoliditySourceRange;
  readonly repository: string;
  readonly sourcePath: string;
}): void {
  if (
    range.byteStart + range.byteLength > file.byteLength ||
    range.lineEnd > file.lineCount ||
    range.sourceSha256 !== file.sha256 ||
    range.githubUrl !==
      getExpectedGitHubUrl(repository, commit, sourcePath, range)
  ) {
    throw new Error("Solidity source range provenance drift.");
  }
}

export function assertSolidityReferenceIndex(
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
  let activeVersionCommit: string | undefined;
  for (const entry of value["versions"]) {
    if (
      !isRecord(entry) ||
      typeof entry["version"] !== "string" ||
      !identity.availableVersions.includes(entry["version"]) ||
      entry["commit"] !== identity.sourceCommits[entry["version"]] ||
      typeof entry["bundlePath"] !== "string" ||
      !isSha256(entry["bundleSha256"]) ||
      typeof entry["tree"] !== "string" ||
      !GIT_HASH_PATTERN.test(entry["tree"]) ||
      typeof entry["commit"] !== "string" ||
      !GIT_HASH_PATTERN.test(entry["commit"])
    ) {
      throw new Error("Invalid Solidity reference version entry.");
    }
    const expectedBundlePath = `${getVersionRoot(
      identity.reviewId,
      entry["version"]
    )}/reference-manifest.json`;
    if (entry["bundlePath"] !== expectedBundlePath) {
      throw new Error("Non-canonical Solidity reference bundle path.");
    }
    if (seenVersions.has(entry["version"])) {
      throw new Error("Duplicate Solidity reference version.");
    }
    seenVersions.add(entry["version"]);
    if (entry["version"] === identity.activeVersion) {
      activeVersionCommit = entry["commit"];
    }
  }
  if (activeVersionCommit !== identity.activeSourceCommit) {
    throw new Error("Invalid active Solidity reference source commit.");
  }
}

function assertCompilerAndSource(
  source: Record<string, unknown>,
  identity: SolidityReferenceReviewIdentity,
  versionEntry: SolidityReferenceIndex["versions"][number]
): void {
  if (
    source["repository"] !== identity.sourceRepository ||
    source["commit"] !== versionEntry.commit ||
    source["tree"] !== versionEntry.tree ||
    typeof source["commitTimestamp"] !== "string" ||
    Number.isNaN(Date.parse(source["commitTimestamp"])) ||
    !isRecord(source["compiler"]) ||
    typeof source["compiler"]["version"] !== "string" ||
    typeof source["compiler"]["evmVersion"] !== "string" ||
    typeof source["compiler"]["viaIR"] !== "boolean" ||
    !isRecord(source["compiler"]["optimizer"]) ||
    typeof source["compiler"]["optimizer"]["enabled"] !== "boolean" ||
    !isNonNegativeInteger(source["compiler"]["optimizer"]["runs"]) ||
    !Array.isArray(source["roots"])
  ) {
    throw new Error("Invalid Solidity compiler or source provenance.");
  }
  for (const root of source["roots"]) {
    if (
      !isRecord(root) ||
      typeof root["path"] !== "string" ||
      !isSafeSourceRoot(root["path"]) ||
      !VALID_SCOPES.includes(String(root["scope"]))
    ) {
      throw new Error("Invalid Solidity source root.");
    }
  }
  assertShaRecord(source["sourceChecksums"], "source checksums");
  assertShaRecord(source["artifactChecksums"], "artifact checksums");
}

function assertManifestSummary(summary: Record<string, unknown>): void {
  for (const field of [
    "contractCount",
    "declarationCount",
    "definitionCount",
    "fileCount",
    "interfaceCount",
    "libraryCount",
    "topLevelDeclarationCount",
    "warningCount",
  ]) {
    if (!isNonNegativeInteger(summary[field])) {
      throw new Error("Invalid Solidity reference summary.");
    }
  }
  assertNumberRecord(summary["classifications"], "classifications");
  assertNumberRecord(summary["releaseSurface"], "release surface");
}

function assertManifestDefinitionsAndFiles(
  manifest: SolidityReferenceManifest
): {
  readonly definitionsById: ReadonlyMap<string, SolidityDefinitionIndexEntry>;
  readonly filesByPath: ReadonlyMap<string, SoliditySourceFileReference>;
} {
  const versionRoot = getVersionRoot(manifest.reviewId, manifest.reviewVersion);
  const definitionsById = new Map<string, SolidityDefinitionIndexEntry>();
  let previousDefinitionId: string | undefined;
  for (const definition of manifest.definitionIndex) {
    assertDefinitionIndexEntry(definition);
    if (
      definitionsById.has(definition.id) ||
      (previousDefinitionId !== undefined &&
        previousDefinitionId >= definition.id)
    ) {
      throw new Error("Duplicate or unsorted Solidity definition identity.");
    }
    if (
      definition.shardPath !==
      `${versionRoot}/definitions/${definition.key}.json`
    ) {
      throw new Error("Non-canonical Solidity definition shard path.");
    }
    previousDefinitionId = definition.id;
    definitionsById.set(definition.id, definition);
  }

  const filesByPath = new Map<string, SoliditySourceFileReference>();
  for (const file of manifest.files) {
    assertSourceFile(file);
    if (filesByPath.has(file.path)) {
      throw new Error("Duplicate Solidity source path.");
    }
    const expectedPublicPath = `${versionRoot}/sources/${file.path
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;
    if (
      file.publicPath !== expectedPublicPath ||
      file.githubUrl !==
        getExpectedGitHubUrl(
          manifest.source.repository,
          manifest.source.commit,
          file.path
        ) ||
      manifest.source.sourceChecksums[file.path] !== file.sha256
    ) {
      throw new Error("Solidity source route or checksum index drift.");
    }
    filesByPath.set(file.path, file);
  }
  if (
    Object.keys(manifest.source.sourceChecksums).length !== filesByPath.size
  ) {
    throw new Error("Solidity source checksum file-set drift.");
  }
  return { definitionsById, filesByPath };
}

function crossCheckDefinitions(
  manifest: SolidityReferenceManifest,
  definitionsById: ReadonlyMap<string, SolidityDefinitionIndexEntry>,
  filesByPath: ReadonlyMap<string, SoliditySourceFileReference>
): void {
  for (const definition of manifest.definitionIndex) {
    const file = filesByPath.get(definition.sourcePath);
    if (!file?.definitionIds.includes(definition.id)) {
      throw new Error("Solidity definition source membership drift.");
    }
    assertRangeForFile({
      commit: manifest.source.commit,
      file,
      range: definition.range,
      repository: manifest.source.repository,
      sourcePath: definition.sourcePath,
    });
  }
  for (const file of manifest.files) {
    for (const definitionId of file.definitionIds) {
      const definition = definitionsById.get(definitionId);
      if (definition?.sourcePath !== file.path) {
        throw new Error("Solidity source definition index drift.");
      }
    }
    for (const declaration of file.topLevelDeclarations) {
      assertRangeForFile({
        commit: manifest.source.commit,
        file,
        range: declaration.range,
        repository: manifest.source.repository,
        sourcePath: file.path,
      });
      if (declaration.kind === "variable" && declaration.valueRange !== null) {
        assertRangeForFile({
          commit: manifest.source.commit,
          file,
          range: declaration.valueRange,
          repository: manifest.source.repository,
          sourcePath: file.path,
        });
      }
    }
  }
}

function crossCheckDeclarationIndex(
  manifest: SolidityReferenceManifest,
  definitionsById: ReadonlyMap<string, SolidityDefinitionIndexEntry>,
  filesByPath: ReadonlyMap<string, SoliditySourceFileReference>
): void {
  const seenIds = new Set<string>();
  let previousId: string | undefined;
  for (const declaration of manifest.declarationIndex) {
    assertDeclarationIndexEntry(declaration);
    if (
      seenIds.has(declaration.id) ||
      (previousId !== undefined && previousId >= declaration.id)
    ) {
      throw new Error("Duplicate or unsorted global declaration identity.");
    }
    seenIds.add(declaration.id);
    previousId = declaration.id;
    const file = filesByPath.get(declaration.sourcePath);
    if (
      file?.publicPath !== declaration.sourcePublicPath ||
      file.scope !== declaration.scope
    ) {
      throw new Error("Global Solidity declaration source drift.");
    }
    assertRangeForFile({
      commit: manifest.source.commit,
      file,
      range: declaration.range,
      repository: manifest.source.repository,
      sourcePath: declaration.sourcePath,
    });
    if (declaration.topLevel) {
      const topLevel = file.topLevelDeclarations.find(
        (candidate) => candidate.id === declaration.id
      );
      if (
        !["function", "event", "error"].includes(topLevel?.kind ?? "") ||
        !topLevel ||
        !sourceRangesEqual(topLevel.range, declaration.range)
      ) {
        throw new Error("Global file-scope declaration projection drift.");
      }
    } else {
      const definition = definitionsById.get(declaration.definitionId ?? "");
      if (
        definition?.key !== declaration.definitionKey ||
        declaration.definitionShardPath !== definition.shardPath ||
        declaration.sourcePath !== definition.sourcePath ||
        declaration.scope !== definition.scope
      ) {
        throw new Error("Global declaration definition projection drift.");
      }
    }
  }
}

export function assertSolidityReferenceManifest(
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
    !isRecord(value["generator"]) ||
    value["generator"]["name"] !== SOLIDITY_REFERENCE_GENERATOR_NAME ||
    value["generator"]["version"] !== SOLIDITY_REFERENCE_GENERATOR_VERSION ||
    value["generator"]["outputSha256"] !== versionEntry.bundleSha256 ||
    !isSha256(value["generator"]["configSha256"]) ||
    !isSha256(value["generator"]["sourceSha256"]) ||
    !isRecord(value["summary"]) ||
    !Array.isArray(value["definitionIndex"]) ||
    !Array.isArray(value["declarationIndex"]) ||
    !Array.isArray(value["files"])
  ) {
    throw new Error("Invalid Solidity reference manifest identity.");
  }
  assertCompilerAndSource(value["source"], identity, versionEntry);
  assertManifestSummary(value["summary"]);
  assertWarningSummary(value["warningSummary"]);
  const manifest = value as unknown as SolidityReferenceManifest;
  const { definitionsById, filesByPath } =
    assertManifestDefinitionsAndFiles(manifest);
  assertAuditorEvidence(manifest.auditorEvidence, new Set(filesByPath.keys()));
  if (
    manifest.source.artifactChecksums[
      "release-artifacts/latest/release-manifest.json"
    ] !== manifest.auditorEvidence.sha256 ||
    Object.entries(manifest.auditorEvidence.boundArtifactDigests).some(
      ([artifactPath, digest]) =>
        manifest.source.artifactChecksums[artifactPath] !== digest.sha256
    )
  ) {
    throw new Error("Solidity auditor artifact checksum binding drift.");
  }
  crossCheckDefinitions(manifest, definitionsById, filesByPath);
  crossCheckDeclarationIndex(manifest, definitionsById, filesByPath);
  const topLevelCount = manifest.files.reduce(
    (count, file) => count + file.topLevelDeclarations.length,
    0
  );
  const expectedKindCounts = {
    contractCount: manifest.definitionIndex.filter(
      (definition) => definition.kind === "contract"
    ).length,
    interfaceCount: manifest.definitionIndex.filter(
      (definition) => definition.kind === "interface"
    ).length,
    libraryCount: manifest.definitionIndex.filter(
      (definition) => definition.kind === "library"
    ).length,
  };
  if (
    manifest.summary.definitionCount !== manifest.definitionIndex.length ||
    manifest.summary.declarationCount !== manifest.declarationIndex.length ||
    manifest.summary.fileCount !== manifest.files.length ||
    manifest.summary.topLevelDeclarationCount !== topLevelCount ||
    manifest.summary.warningCount !== manifest.warningSummary.totalCount ||
    Object.entries(expectedKindCounts).some(
      ([field, count]) =>
        manifest.summary[field as keyof typeof expectedKindCounts] !== count
    )
  ) {
    throw new Error("Solidity reference summary drift.");
  }
}
