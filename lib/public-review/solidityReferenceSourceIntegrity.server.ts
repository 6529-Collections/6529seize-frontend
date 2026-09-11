import "next/dist/compiled/server-only";

import { toSha256Urn } from "@/lib/public-review/solidityReferenceIntegrity.server";
import type {
  SolidityDefinitionShard,
  SoliditySourceFileReference,
  SoliditySourceRange,
  SolidityTopLevelDeclaration,
} from "@/lib/public-review/solidityReferenceTypes";

function assertRangeBytes(
  source: Buffer,
  file: SoliditySourceFileReference,
  range: SoliditySourceRange,
  label: string
): void {
  const byteEnd = range.byteStart + range.byteLength;
  if (
    range.sourceSha256 !== file.sha256 ||
    byteEnd > source.byteLength ||
    toSha256Urn(source.subarray(range.byteStart, byteEnd)) !==
      range.snippetSha256
  ) {
    throw new Error(`Solidity ${label} byte range or snippet checksum drift.`);
  }
}

function getDefinitionRanges(shard: SolidityDefinitionShard): readonly {
  readonly label: string;
  readonly range: SoliditySourceRange;
}[] {
  const { declarations } = shard.definition;
  const ranges = [
    {
      label: "definition",
      range: shard.definition.range,
    },
  ];
  for (const kind of ["functions", "events", "errors"] as const) {
    for (const declaration of declarations[kind]) {
      ranges.push({
        label: `${kind.slice(0, -1)} declaration`,
        range: declaration.range,
      });
    }
  }
  for (const kind of [
    "stateVariables",
    "modifiers",
    "structs",
    "enums",
    "userDefinedValueTypes",
  ] as const) {
    for (const declaration of declarations[kind]) {
      ranges.push({
        label: `${kind} declaration`,
        range: declaration.range,
      });
    }
  }
  return ranges;
}

function getTopLevelRanges(
  declaration: SolidityTopLevelDeclaration
): readonly SoliditySourceRange[] {
  if (declaration.kind === "variable" && declaration.valueRange !== null) {
    return [declaration.range, declaration.valueRange];
  }
  return [declaration.range];
}

export function assertSolidityDefinitionSourceIntegrity({
  file,
  shard,
  source,
}: {
  readonly file: SoliditySourceFileReference;
  readonly shard: SolidityDefinitionShard;
  readonly source: Buffer;
}): void {
  for (const { label, range } of getDefinitionRanges(shard)) {
    assertRangeBytes(source, file, range, label);
  }
}

export function assertSolidityFileScopeSourceIntegrity({
  file,
  source,
}: {
  readonly file: SoliditySourceFileReference;
  readonly source: Buffer;
}): void {
  for (const declaration of file.topLevelDeclarations) {
    for (const range of getTopLevelRanges(declaration)) {
      assertRangeBytes(source, file, range, "file-scope declaration");
    }
  }
}
