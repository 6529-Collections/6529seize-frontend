import "next/dist/compiled/server-only";

import type {
  SolidityDeclarationKind,
  SolidityDefinition,
  SolidityDefinitionIndexEntry,
  SolidityDefinitionShard,
  SolidityReferenceManifest,
  SolidityRoutedDeclaration,
} from "@/lib/public-review/solidityReferenceTypes";
import { SOLIDITY_REFERENCE_SHARD_SCHEMA } from "@/lib/public-review/solidityReferenceTypes";
import { encodeSoliditySemanticId } from "@/lib/public-review/solidityReferenceRoutes";
import {
  assertParameters,
  assertReleaseEvidence,
} from "@/lib/public-review/solidityReferenceValidation.server";
import {
  assertSourceRange,
  assertWarningSummary,
  isRecord,
  sourceRangesEqual,
} from "@/lib/public-review/solidityReferenceValidationPrimitives.server";

function assertRoutedDeclaration(
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
  assertParameters(value["inputs"], `Solidity ${singularKind} input`);
  assertSourceRange(value["range"], `Solidity ${singularKind}`);
  if (value["range"].sourceSha256 !== sourceSha256) {
    throw new Error("Solidity declaration source checksum drift.");
  }
  if (kind === "functions") {
    if (
      (value["canonicalSignature"] !== null &&
        typeof value["canonicalSignature"] !== "string") ||
      (value["selector"] !== null && typeof value["selector"] !== "string") ||
      !Array.isArray(value["outputs"]) ||
      typeof value["stateMutability"] !== "string" ||
      typeof value["visibility"] !== "string" ||
      typeof value["functionKind"] !== "string" ||
      !Array.isArray(value["modifiers"]) ||
      value["modifiers"].some((entry) => typeof entry !== "string") ||
      typeof value["syntheticGetter"] !== "boolean" ||
      typeof value["virtual"] !== "boolean"
    ) {
      throw new Error("Invalid Solidity function declaration.");
    }
    assertParameters(value["outputs"], "Solidity function output");
  }
  if (
    kind === "events" &&
    ((value["canonicalSignature"] !== null &&
      typeof value["canonicalSignature"] !== "string") ||
      (value["topic0"] !== null && typeof value["topic0"] !== "string") ||
      typeof value["anonymous"] !== "boolean")
  ) {
    throw new Error("Invalid Solidity event declaration.");
  }
  if (
    kind === "errors" &&
    ((value["canonicalSignature"] !== null &&
      typeof value["canonicalSignature"] !== "string") ||
      typeof value["selector"] !== "string")
  ) {
    throw new Error("Invalid Solidity error declaration.");
  }
}

function assertOtherMembers(
  value: Record<string, unknown>,
  label: string
): void {
  if (value["members"] !== undefined) {
    if (!Array.isArray(value["members"])) {
      throw new Error(`Invalid Solidity ${label} members.`);
    }
    for (const member of value["members"]) {
      if (
        typeof member !== "string" &&
        (!isRecord(member) ||
          typeof member["name"] !== "string" ||
          typeof member["type"] !== "string")
      ) {
        throw new Error(`Invalid Solidity ${label} member.`);
      }
    }
  }
}

function assertOtherProperties(
  value: Record<string, unknown>,
  label: string
): void {
  for (const field of ["constant", "immutable"]) {
    if (value[field] !== undefined && typeof value[field] !== "boolean") {
      throw new Error(`Invalid Solidity ${label} boolean property.`);
    }
  }
  for (const field of [
    "getterDeclarationId",
    "selector",
    "type",
    "underlyingType",
    "visibility",
  ]) {
    if (
      value[field] !== undefined &&
      value[field] !== null &&
      typeof value[field] !== "string"
    ) {
      throw new Error(`Invalid Solidity ${label} string property.`);
    }
  }
}

function assertOtherDeclaration(
  value: unknown,
  label: string,
  sourceSha256: string
): void {
  if (
    !isRecord(value) ||
    typeof value["name"] !== "string" ||
    typeof value["natspec"] !== "string"
  ) {
    throw new Error(`Invalid Solidity ${label} declaration.`);
  }
  assertSourceRange(value["range"], `Solidity ${label}`);
  if (value["range"].sourceSha256 !== sourceSha256) {
    throw new Error(`Solidity ${label} source checksum drift.`);
  }
  assertOtherMembers(value, label);
  assertOtherProperties(value, label);
}

function assertAbiEntry(value: unknown, label: string): void {
  if (
    !isRecord(value) ||
    typeof value["declarationId"] !== "string" ||
    typeof value["declaringDefinitionId"] !== "string" ||
    typeof value["inherited"] !== "boolean" ||
    typeof value["name"] !== "string" ||
    typeof value["signature"] !== "string"
  ) {
    throw new Error(`Invalid Solidity ${label} ABI surface entry.`);
  }
  assertParameters(value["inputs"], `${label} ABI input`);
  if (value["outputs"] !== undefined) {
    assertParameters(value["outputs"], `${label} ABI output`);
  }
  for (const field of ["selector", "stateMutability", "topic0"]) {
    if (value[field] !== undefined && typeof value[field] !== "string") {
      throw new Error(`Invalid Solidity ${label} ABI metadata.`);
    }
  }
}

function assertWarnings(
  value: unknown,
  indexEntry: SolidityDefinitionIndexEntry
): void {
  if (!Array.isArray(value)) {
    throw new Error("Missing Solidity generator warnings.");
  }
  for (const warning of value) {
    if (
      !isRecord(warning) ||
      typeof warning["category"] !== "string" ||
      typeof warning["code"] !== "string" ||
      warning["definitionId"] !== indexEntry.id ||
      typeof warning["severity"] !== "string" ||
      (warning["declarationId"] !== undefined &&
        typeof warning["declarationId"] !== "string")
    ) {
      throw new Error("Invalid Solidity generator warning.");
    }
  }
}

function assertDeclarationProjection({
  declaration,
  indexEntry,
  manifest,
}: {
  readonly declaration: SolidityRoutedDeclaration;
  readonly indexEntry: SolidityDefinitionIndexEntry;
  readonly manifest: SolidityReferenceManifest;
}): void {
  const projection = manifest.declarationIndex.find(
    (entry) => entry.id === declaration.id
  );
  const selector = "selector" in declaration ? declaration.selector : null;
  const topic0 = "topic0" in declaration ? declaration.topic0 : null;
  const syntheticGetter =
    "syntheticGetter" in declaration ? declaration.syntheticGetter : false;
  if (
    projection?.definitionId !== indexEntry.id ||
    projection.definitionKey !== indexEntry.key ||
    projection.definitionShardPath !== indexEntry.shardPath ||
    projection.kind !== declaration.kind ||
    projection.key !== declaration.key ||
    projection.name !== declaration.name ||
    projection.displaySignature !== declaration.displaySignature ||
    projection.canonicalSignature !== declaration.canonicalSignature ||
    projection.selector !== selector ||
    projection.topic0 !== topic0 ||
    projection.syntheticGetter !== syntheticGetter ||
    projection.topLevel ||
    projection.sourcePath !== indexEntry.sourcePath ||
    projection.scope !== indexEntry.scope ||
    !sourceRangesEqual(projection.range, declaration.range)
  ) {
    throw new Error("Global Solidity declaration projection drift.");
  }
}

function assertRoutedDeclarations(
  definition: SolidityDefinition,
  indexEntry: SolidityDefinitionIndexEntry,
  manifest: SolidityReferenceManifest
): void {
  const projectedIds = new Set<string>();
  for (const kind of ["functions", "events", "errors"] as const) {
    const declarations = definition.declarations[kind];
    const declarationKeys = new Set<string>();
    for (const declaration of declarations) {
      assertRoutedDeclaration(
        declaration,
        kind,
        indexEntry.range.sourceSha256
      );
      if (declarationKeys.has(declaration.key)) {
        throw new Error(`Duplicate Solidity ${kind} declaration identity.`);
      }
      declarationKeys.add(declaration.key);
      projectedIds.add(declaration.id);
      assertDeclarationProjection({ declaration, indexEntry, manifest });
    }
  }
  const indexedIds = manifest.declarationIndex
    .filter((entry) => entry.definitionId === indexEntry.id)
    .map((entry) => entry.id);
  if (
    indexedIds.length !== projectedIds.size ||
    indexedIds.some((id) => !projectedIds.has(id))
  ) {
    throw new Error("Global Solidity declaration projection count drift.");
  }
}

function assertOtherDeclarations(
  definition: SolidityDefinition,
  sourceSha256: string
): void {
  for (const kind of [
    "stateVariables",
    "modifiers",
    "structs",
    "enums",
    "userDefinedValueTypes",
  ] as const) {
    definition.declarations[kind].forEach((declaration) =>
      assertOtherDeclaration(declaration, kind, sourceSha256)
    );
  }
}

function assertAbiSurface(definition: SolidityDefinition): void {
  for (const kind of ["functions", "events", "errors"] as const) {
    definition.abiSurface[kind].forEach((entry) =>
      assertAbiEntry(entry, kind)
    );
  }
}

export function assertSolidityDefinitionShard(
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
    value["definition"]["name"] !== indexEntry.name ||
    value["definition"]["kind"] !== indexEntry.kind ||
    value["definition"]["scope"] !== indexEntry.scope ||
    value["definition"]["classification"] !== indexEntry.classification ||
    value["definition"]["classificationReason"] !==
      indexEntry.classificationReason ||
    value["definition"]["sourcePath"] !== indexEntry.sourcePath ||
    value["definition"]["abstract"] !== indexEntry.abstract ||
    !isRecord(value["definition"]["declarations"]) ||
    !isRecord(value["definition"]["abiSurface"]) ||
    !Array.isArray(value["warnings"])
  ) {
    throw new Error("Invalid Solidity definition shard identity.");
  }
  const definition = value["definition"] as unknown as SolidityDefinition;
  assertSourceRange(definition.range, "shard definition");
  if (!sourceRangesEqual(definition.range, indexEntry.range)) {
    throw new Error("Solidity definition source range drift.");
  }
  if (
    typeof definition.natspec !== "string" ||
    !Array.isArray(definition.inheritance) ||
    !Array.isArray(definition.linearizedDefinitionIds) ||
    definition.linearizedDefinitionIds.some(
      (entry) => typeof entry !== "string"
    ) ||
    definition.inheritance.some(
      (entry) =>
        !isRecord(entry) ||
        typeof entry["definitionId"] !== "string" ||
        typeof entry["name"] !== "string"
    ) ||
    !isRecord(definition.release)
  ) {
    throw new Error("Invalid Solidity definition inheritance or NatSpec.");
  }
  assertReleaseEvidence(definition.release);
  for (const kind of [
    "functions",
    "events",
    "errors",
    "stateVariables",
    "modifiers",
    "structs",
    "enums",
    "userDefinedValueTypes",
  ] as const) {
    if (!Array.isArray(definition.declarations[kind])) {
      throw new Error(`Missing Solidity ${kind} declarations.`);
    }
  }
  for (const kind of ["functions", "events", "errors"] as const) {
    if (!Array.isArray(definition.abiSurface[kind])) {
      throw new Error(`Missing Solidity ${kind} ABI surface.`);
    }
  }
  assertRoutedDeclarations(definition, indexEntry, manifest);
  assertOtherDeclarations(definition, indexEntry.range.sourceSha256);
  assertAbiSurface(definition);
  assertWarningSummary(value["warningSummary"]);
  assertWarnings(value["warnings"], indexEntry);
  if (
    value["warningSummary"].totalCount !==
      (value["warnings"] as unknown[]).length ||
    value["warningSummary"].totalCount !== indexEntry.warningSummary.totalCount
  ) {
    throw new Error("Solidity warning summary drift.");
  }
}
