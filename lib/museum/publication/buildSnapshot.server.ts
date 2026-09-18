import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { isExactGitCommit, MUSEUM_REPOSITORY_NAME } from "./security";
import type { MuseumLastValidPublication, MuseumPublication } from "./types";

const MUSEUM_PUBLICATION_BUILD_SNAPSHOT_CONTRACT =
  "museum-publication-build-snapshot-v1";
export const MUSEUM_PUBLICATION_BUILD_SNAPSHOT_MAX_CLOCK_SKEW_MS =
  5 * 60 * 1000;
export const MUSEUM_PUBLICATION_BUILD_SNAPSHOT_PATH =
  ".museum-publication/current.json";

interface MuseumPublicationBuildSnapshot {
  readonly contract: typeof MUSEUM_PUBLICATION_BUILD_SNAPSHOT_CONTRACT;
  readonly generatedAt: string;
  readonly publicationSha256: `sha256:${string}`;
  readonly publication: MuseumPublication;
}

function publicationDigest(publication: MuseumPublication): `sha256:${string}` {
  return `sha256:${createHash("sha256")
    .update(JSON.stringify(publication), "utf8")
    .digest("hex")}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasMinimumPublicationShape(
  value: unknown
): value is MuseumPublication {
  if (!isRecord(value) || !isRecord(value["identity"])) return false;

  const identity = value["identity"];
  return (
    identity["repository"] === MUSEUM_REPOSITORY_NAME &&
    typeof identity["requestedRef"] === "string" &&
    typeof identity["commit"] === "string" &&
    isExactGitCommit(identity["commit"]) &&
    typeof identity["manifestPath"] === "string" &&
    Number.isSafeInteger(identity["inventoryCount"]) &&
    typeof identity["assembledAt"] === "string" &&
    Number.isFinite(Date.parse(identity["assembledAt"])) &&
    Array.isArray(value["declaredSourcePaths"]) &&
    Array.isArray(value["artists"]) &&
    Array.isArray(value["projects"]) &&
    Array.isArray(value["gifts"]) &&
    Array.isArray(value["artworks"]) &&
    Array.isArray(value["documents"]) &&
    isRecord(value["institutionalPractice"]) &&
    isRecord(value["dataArchitecture"]) &&
    isRecord(value["rightsHandbook"])
  );
}

export function createMuseumPublicationBuildSnapshot(
  publication: MuseumPublication,
  generatedAt = new Date().toISOString()
): MuseumPublicationBuildSnapshot {
  if (!Number.isFinite(Date.parse(generatedAt))) {
    throw new TypeError("publication_build_snapshot_timestamp_invalid");
  }
  return {
    contract: MUSEUM_PUBLICATION_BUILD_SNAPSHOT_CONTRACT,
    generatedAt,
    publicationSha256: publicationDigest(publication),
    publication,
  };
}

export function parseMuseumPublicationBuildSnapshot(
  value: unknown,
  now: () => number = Date.now
): MuseumLastValidPublication | undefined {
  if (!isRecord(value)) return undefined;
  const generatedAt = value["generatedAt"];
  const generatedAtMs =
    typeof generatedAt === "string" ? Date.parse(generatedAt) : Number.NaN;
  const publicationSha256 = value["publicationSha256"];
  const publication = value["publication"];
  if (
    value["contract"] !== MUSEUM_PUBLICATION_BUILD_SNAPSHOT_CONTRACT ||
    typeof generatedAt !== "string" ||
    !Number.isFinite(generatedAtMs) ||
    generatedAtMs >
      now() + MUSEUM_PUBLICATION_BUILD_SNAPSHOT_MAX_CLOCK_SKEW_MS ||
    typeof publicationSha256 !== "string" ||
    !/^sha256:[a-f0-9]{64}$/u.test(publicationSha256) ||
    !hasMinimumPublicationShape(publication) ||
    publicationDigest(publication) !== publicationSha256
  ) {
    return undefined;
  }
  return { publication, acceptedAt: generatedAt };
}

export function readMuseumPublicationBuildSnapshot():
  | MuseumLastValidPublication
  | undefined {
  try {
    const snapshotPath = path.resolve(
      process.cwd(),
      MUSEUM_PUBLICATION_BUILD_SNAPSHOT_PATH
    );
    const parsed = JSON.parse(readFileSync(snapshotPath, "utf8")) as unknown;
    return parseMuseumPublicationBuildSnapshot(parsed);
  } catch {
    return undefined;
  }
}
