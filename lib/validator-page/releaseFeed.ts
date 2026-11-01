import {
  FEED_OBJECT_KEY,
  FEED_SIGNATURE_OBJECT_KEY,
  readReleaseObject,
  type BucketObject,
} from "./releasesBucket";

export type ValidatorReleaseFile = {
  readonly name: string;
  /** Bytes, or null when the feed does not say. */
  readonly size: number | null;
  /** Lowercase hex SHA-256. */
  readonly sha256: string;
};

export type ValidatorRelease = {
  readonly version: string;
  readonly channel: string;
  /** ISO 8601 date or timestamp, as the feed gives it. */
  readonly publishedAt: string;
  readonly commit: string | null;
  readonly softwareId: string | null;
  readonly notes: string | null;
  readonly files: readonly ValidatorReleaseFile[];
};

type FeedObject = Extract<BucketObject, { state: "found" }>;

export type ReleaseFeedSnapshot = {
  /** `missing` until the first signed feed is uploaded. */
  readonly state: "ok" | "missing" | "error";
  readonly feed: FeedObject | null;
  readonly signature: FeedObject | null;
  /** Newest first. Entries the site cannot use are left out. */
  readonly releases: readonly ValidatorRelease[];
};

// A version and a file name each become one S3 key segment, so neither may
// hold a slash or start with a dot.
const VERSION_PATTERN = /^[0-9A-Za-z][0-9A-Za-z.+-]{0,63}$/;
const FILE_NAME_PATTERN = /^[0-9A-Za-z][0-9A-Za-z._+-]{0,127}$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const COMMIT_PATTERN = /^[0-9a-f]{7,64}$/;
// An ISO 8601 date or timestamp: it starts with the date and holds only
// the characters such a value uses.
const ISO_DATE_START = /^\d{4}-\d{2}-\d{2}/;
const ISO_DATE_CHARACTERS = /^[0-9TZ:.+-]{10,35}$/;
const MAX_NOTES_LENGTH = 2_000;
const SNAPSHOT_TTL_MS = 60 * 1000;
// After an S3 error the last good feed stays in use this long, and S3 is
// asked again after ERROR_RETRY_MS.
const STALE_IF_ERROR_MS = 60 * 60 * 1000;
const ERROR_RETRY_MS = 10 * 1000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstString(
  record: Record<string, unknown>,
  names: readonly string[]
): string | null {
  for (const name of names) {
    const value = record[name];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function parseSize(record: Record<string, unknown>): number | null {
  const value = record["size"] ?? record["bytes"];
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : null;
}

function parseFile(
  name: unknown,
  record: unknown
): ValidatorReleaseFile | null {
  if (typeof name !== "string" || !isRecord(record)) {
    return null;
  }
  const sha256 = firstString(record, ["sha256"])?.toLowerCase() ?? "";
  if (!FILE_NAME_PATTERN.test(name) || !SHA256_PATTERN.test(sha256)) {
    return null;
  }
  return { name, size: parseSize(record), sha256 };
}

function fileEntries(value: unknown): [unknown, unknown][] {
  if (Array.isArray(value)) {
    return value.map((record: unknown) => [
      isRecord(record) ? record["name"] : null,
      record,
    ]);
  }
  return isRecord(value) ? Object.entries(value) : [];
}

function parseFiles(value: unknown): ValidatorReleaseFile[] {
  const entries = fileEntries(value);
  const files: ValidatorReleaseFile[] = [];
  const seen = new Set<string>();
  for (const [name, record] of entries) {
    const file = parseFile(name, record);
    if (file && !seen.has(file.name)) {
      seen.add(file.name);
      files.push(file);
    }
  }
  return files;
}

function parseRelease(value: unknown): ValidatorRelease | null {
  if (!isRecord(value)) {
    return null;
  }
  const version = firstString(value, ["version"]);
  const channel = firstString(value, ["channel"]);
  const publishedAt = firstString(value, [
    "published_at",
    "date",
    "released_at",
  ]);
  if (
    !version ||
    !VERSION_PATTERN.test(version) ||
    !channel ||
    !publishedAt ||
    !ISO_DATE_START.test(publishedAt) ||
    !ISO_DATE_CHARACTERS.test(publishedAt) ||
    Number.isNaN(Date.parse(publishedAt))
  ) {
    return null;
  }
  const commit = firstString(value, ["commit"])?.toLowerCase() ?? null;
  const notes = firstString(value, ["notes", "summary"]);
  return {
    version,
    channel,
    publishedAt,
    commit: commit && COMMIT_PATTERN.test(commit) ? commit : null,
    softwareId: firstString(value, ["software_id", "softwareId"]),
    notes: notes ? notes.slice(0, MAX_NOTES_LENGTH) : null,
    files: parseFiles(value["files"]),
  };
}

/**
 * Reads the release list out of the feed's JSON. The site only renders it;
 * validators check the feed's signature themselves. Invalid entries are
 * dropped rather than failing the whole page.
 */
export function parseReleaseFeed(json: unknown): ValidatorRelease[] {
  const list = isRecord(json) ? json["releases"] : json;
  if (!Array.isArray(list)) {
    return [];
  }
  const releases: ValidatorRelease[] = [];
  const seen = new Set<string>();
  for (const entry of list) {
    const release = parseRelease(entry);
    if (release && !seen.has(release.version)) {
      seen.add(release.version);
      releases.push(release);
    }
  }
  return releases.sort(
    (a, b) =>
      Date.parse(b.publishedAt) - Date.parse(a.publishedAt) ||
      b.version.localeCompare(a.version, "en", { numeric: true })
  );
}

function decodeFeed(feed: FeedObject): ValidatorRelease[] {
  try {
    return parseReleaseFeed(
      JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(feed.body))
    );
  } catch {
    return [];
  }
}

type CachedSnapshot = {
  readonly snapshot: ReleaseFeedSnapshot;
  readonly loadedAt: number;
};

let cachedSnapshot: CachedSnapshot | null = null;
let lastGoodSnapshot: CachedSnapshot | null = null;
let inFlight: Promise<ReleaseFeedSnapshot> | null = null;

async function fetchSnapshot(): Promise<ReleaseFeedSnapshot> {
  const [feed, signature] = await Promise.all([
    readReleaseObject(FEED_OBJECT_KEY),
    readReleaseObject(FEED_SIGNATURE_OBJECT_KEY),
  ]);
  if (feed.state === "error" || signature.state === "error") {
    let reason = "";
    if (feed.state === "error") {
      reason = feed.reason;
    } else if (signature.state === "error") {
      reason = signature.reason;
    }
    console.warn("[validator-page] release feed unavailable", reason);
    return { state: "error", feed: null, signature: null, releases: [] };
  }
  if (feed.state === "missing") {
    return { state: "missing", feed: null, signature: null, releases: [] };
  }
  return {
    state: "ok",
    feed,
    signature: signature.state === "found" ? signature : null,
    releases: decodeFeed(feed),
  };
}

/**
 * The feed and its signature, read together so they always match, and
 * reused for a minute. A new release shows within that minute.
 */
export async function getReleaseFeedSnapshot(): Promise<ReleaseFeedSnapshot> {
  const now = Date.now();
  if (cachedSnapshot && now - cachedSnapshot.loadedAt < SNAPSHOT_TTL_MS) {
    return cachedSnapshot.snapshot;
  }
  inFlight ??= fetchSnapshot().finally(() => {
    inFlight = null;
  });
  const snapshot = await inFlight;
  const loaded = { snapshot, loadedAt: Date.now() };
  if (snapshot.state !== "error") {
    cachedSnapshot = loaded;
    lastGoodSnapshot = loaded;
    return snapshot;
  }
  const served =
    lastGoodSnapshot &&
    loaded.loadedAt - lastGoodSnapshot.loadedAt < STALE_IF_ERROR_MS
      ? lastGoodSnapshot.snapshot
      : snapshot;
  cachedSnapshot = {
    snapshot: served,
    loadedAt: loaded.loadedAt - SNAPSHOT_TTL_MS + ERROR_RETRY_MS,
  };
  return served;
}

/** Test hook: forget the cached feed. */
export function resetReleaseFeedCacheForTests(): void {
  cachedSnapshot = null;
  lastGoodSnapshot = null;
  inFlight = null;
}
