import "next/dist/compiled/server-only";

import { createHash } from "node:crypto";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function compareOrdinal(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function canonicalizeJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalizeJson);
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort(compareOrdinal)
        .map((key) => [key, canonicalizeJson(value[key])])
    );
  }
  return value;
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(canonicalizeJson(value), null, 2)}\n`;
}

export function toSha256Urn(source: Buffer | string): string {
  return `sha256:${createHash("sha256").update(source).digest("hex")}`;
}

export function getSolidityManifestOutputSha256(
  value: unknown
): string | undefined {
  if (!isRecord(value) || !isRecord(value["generator"])) {
    return undefined;
  }
  const clone = {
    ...value,
    generator: {
      ...value["generator"],
      outputSha256: null,
    },
  };
  return toSha256Urn(stableJson(clone));
}
