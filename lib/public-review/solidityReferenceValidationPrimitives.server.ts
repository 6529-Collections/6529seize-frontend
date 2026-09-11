import "next/dist/compiled/server-only";

import type {
  SoliditySourceRange,
  SolidityWarningSummary,
} from "@/lib/public-review/solidityReferenceTypes";

const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/;
const SAFE_PUBLIC_PATH_PATTERN = /^\/review-data\/[A-Za-z0-9._/-]+$/;
const SAFE_SOURCE_PATH_PATTERN = /^[A-Za-z0-9._/-]+$/;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isNonNegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

export function isPositiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0;
}

export function isSha256(value: unknown): value is string {
  return typeof value === "string" && SHA256_PATTERN.test(value);
}

export function assertStringRecord(
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

export function assertNumberRecord(
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

export function assertSourceRange(
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

export function sourceRangesEqual(
  left: SoliditySourceRange,
  right: SoliditySourceRange
): boolean {
  return (
    left.byteStart === right.byteStart &&
    left.byteLength === right.byteLength &&
    left.lineStart === right.lineStart &&
    left.lineEnd === right.lineEnd &&
    left.sourceSha256 === right.sourceSha256 &&
    left.snippetSha256 === right.snippetSha256 &&
    left.githubUrl === right.githubUrl
  );
}

export function assertReferenceCounts(
  value: unknown,
  label: string
): asserts value is Readonly<Record<string, number>> {
  if (
    !isRecord(value) ||
    !isNonNegativeInteger(value["functions"]) ||
    !isNonNegativeInteger(value["events"]) ||
    !isNonNegativeInteger(value["errors"])
  ) {
    throw new Error(`Invalid ${label} counts in the Solidity reference.`);
  }
}

export function assertWarningSummary(
  value: unknown
): asserts value is SolidityWarningSummary {
  if (!isRecord(value) || !isNonNegativeInteger(value["totalCount"])) {
    throw new Error("Invalid warning summary in the Solidity reference.");
  }
  assertNumberRecord(value["byCategory"], "warning categories");
  assertNumberRecord(value["byCode"], "warning codes");
}

export function assertSafePublicPath(publicPath: string, suffix: string): void {
  if (
    !SAFE_PUBLIC_PATH_PATTERN.test(publicPath) ||
    publicPath.includes("//") ||
    publicPath
      .split("/")
      .some((segment) => segment === "." || segment === "..") ||
    !publicPath.endsWith(suffix)
  ) {
    throw new Error("The Solidity reference contains an unsafe public path.");
  }
}

export function assertSafeSourcePath(sourcePath: string): void {
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

export function isSafeSourceRoot(root: string): boolean {
  return (
    SAFE_SOURCE_PATH_PATTERN.test(root) &&
    !root.startsWith("/") &&
    !root.includes("//") &&
    !root.includes("\\") &&
    !root
      .split("/")
      .some((segment) => segment === "" || segment === "." || segment === "..")
  );
}
