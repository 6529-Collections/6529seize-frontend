import { createHash } from "node:crypto";
import { assertSafeMuseumRepositoryPath } from "./security";
import type { MuseumSha256 } from "./types";

export interface MuseumPublicationManifestEntry {
  readonly path: string;
  readonly sha256: MuseumSha256 | null;
  readonly size: number;
}

interface MuseumPublicationManifest {
  readonly manifestType: string;
  readonly manifestVersion: string;
  readonly manifestSha256: MuseumSha256 | null;
  readonly manifestCommitment: string | null;
  readonly entries: readonly MuseumPublicationManifestEntry[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asSha256(value: unknown): MuseumSha256 | null {
  return typeof value === "string" && /^sha256:[a-f0-9]{64}$/u.test(value)
    ? (value as MuseumSha256)
    : null;
}

function compareCanonicalStrings(left: string, right: string): number {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return left.localeCompare(right);
}

function canonicalNumber(value: number): string {
  if (!Number.isSafeInteger(value)) {
    throw new TypeError("publication_manifest_canonicalization");
  }
  return Object.is(value, -0) ? "0" : String(value);
}

function canonicalRecord(value: Record<string, unknown>): string {
  const properties = Object.keys(value)
    .sort(compareCanonicalStrings)
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`);
  return `{${properties.join(",")}}`;
}

function canonicalJson(value: unknown): string {
  if (value === null) {
    return "null";
  }

  switch (typeof value) {
    case "boolean":
    case "string":
      return JSON.stringify(value);
    case "number":
      return canonicalNumber(value);
    case "object":
      return Array.isArray(value)
        ? `[${value.map(canonicalJson).join(",")}]`
        : canonicalRecord(value as Record<string, unknown>);
    case "bigint":
    case "function":
    case "symbol":
    case "undefined":
      throw new TypeError("publication_manifest_canonicalization");
  }
  throw new TypeError("publication_manifest_canonicalization");
}

function digestUtf8(text: string): MuseumSha256 {
  return `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;
}

export function parseMuseumPublicationManifest(
  value: unknown
): MuseumPublicationManifest {
  if (!isRecord(value)) {
    throw new Error("publication_manifest_shape");
  }

  const manifestType = value["manifest_type"];
  const manifestVersion = value["manifest_version"];
  const entriesValue = value["entries"];
  if (
    typeof manifestType !== "string" ||
    manifestType.length === 0 ||
    typeof manifestVersion !== "string" ||
    manifestVersion.length === 0 ||
    !Array.isArray(entriesValue)
  ) {
    throw new Error("publication_manifest_metadata");
  }

  const entries = entriesValue.map(
    (entryValue): MuseumPublicationManifestEntry => {
      if (!isRecord(entryValue)) {
        throw new Error("publication_manifest_entry_shape");
      }

      const path = entryValue["path"];
      const size = entryValue["size"];
      const shaValue = entryValue["sha256"];
      if (
        typeof path !== "string" ||
        typeof size !== "number" ||
        !Number.isSafeInteger(size) ||
        size < 0 ||
        (shaValue !== undefined && asSha256(shaValue) === null)
      ) {
        throw new Error("publication_manifest_entry_invalid");
      }

      assertSafeMuseumRepositoryPath(path);
      return {
        path,
        size,
        sha256: asSha256(shaValue),
      };
    }
  );

  if (new Set(entries.map((entry) => entry.path)).size !== entries.length) {
    throw new Error("publication_manifest_duplicate_path");
  }

  const manifestShaValue = value["manifest_sha256"];
  const manifestSha256 = asSha256(manifestShaValue);
  if (manifestShaValue !== undefined && manifestSha256 === null) {
    throw new Error("publication_manifest_hash_invalid");
  }

  if (manifestSha256 !== null) {
    const canonicalBody = canonicalJson(
      Object.fromEntries(
        Object.entries(value).filter(
          ([key]) => key !== "manifest_commitment" && key !== "manifest_sha256"
        )
      )
    );
    if (digestUtf8(canonicalBody) !== manifestSha256) {
      throw new Error("publication_manifest_hash_mismatch");
    }
  }

  const commitmentValue = value["manifest_commitment"];
  const commitment = isRecord(commitmentValue)
    ? commitmentValue["digest"]
    : null;

  return {
    manifestType,
    manifestVersion,
    manifestSha256,
    manifestCommitment: typeof commitment === "string" ? commitment : null,
    entries: [...entries].sort((left, right) =>
      compareCanonicalStrings(left.path, right.path)
    ),
  };
}

export function verifyMuseumSha256(
  bytes: Uint8Array,
  expected: MuseumSha256
): boolean {
  const digest = createHash("sha256").update(bytes).digest("hex");
  return expected === `sha256:${digest}`;
}
