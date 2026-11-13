import { isFeedSignatureValid } from "./feedSignature";
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
  /**
   * The feed's severity is `urgent`, or a word the site doesn't know: as in
   * the validator, an unknown word reads as urgent. Absent: normal.
   */
  readonly urgent: boolean;
  /** Why it is urgent, in a sentence; null when the feed gives none. */
  readonly reason: string | null;
  /** Why it is unsafe to run (`unsafe_versions`); null when it isn't listed. */
  readonly unsafeReason: string | null;
};

/**
 * The feed's support line: releases below `minSupported` must move to a
 * newer one before `deadline`, for `deadlineReason`.
 */
export type ValidatorFeedSupport = {
  readonly minSupported: string | null;
  /** `YYYY-MM-DDTHH:MM:SSZ`; null without a valid `minSupported`. */
  readonly deadline: string | null;
  readonly deadlineReason: string | null;
};

type FeedObject = Extract<BucketObject, { state: "found" }>;

export type ReleaseFeedSnapshot = {
  /**
   * `missing` until the first signed feed is uploaded. `error` when S3
   * fails, or when the feed's signature is missing, does not verify with a
   * key in `feedSigningKeys.ts`, or the feed is older than one already
   * served: then the pages offer nothing.
   */
  readonly state: "ok" | "missing" | "error";
  readonly feed: FeedObject | null;
  readonly signature: FeedObject | null;
  /**
   * Highest version first, in the validator's order. Entries the site
   * cannot use are left out.
   */
  readonly releases: readonly ValidatorRelease[];
  readonly support: ValidatorFeedSupport;
};

const NO_SUPPORT: ValidatorFeedSupport = {
  minSupported: null,
  deadline: null,
  deadlineReason: null,
};

// A file name becomes one S3 key segment, so it may not hold a slash or
// start with a dot. A version is checked by parseVersion, whose form has
// neither.
const FILE_NAME_PATTERN = /^[0-9A-Za-z][0-9A-Za-z._+-]{0,127}$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const COMMIT_PATTERN = /^[0-9a-f]{7,64}$/;
// An ISO 8601 date or timestamp: it starts with the date and holds only
// the characters such a value uses.
const ISO_DATE_START = /^\d{4}-\d{2}-\d{2}/;
const ISO_DATE_CHARACTERS = /^[0-9TZ:.+-]{10,35}$/;
const MAX_NOTES_LENGTH = 2_000;
// A reason (urgent, unsafe, deadline) is one line of at most 300
// characters, as the validator checks it (crates/releases/src/feed.rs).
const MAX_REASON_LENGTH = 300;
const CONTROL_CHARACTER = /\p{Cc}/u;
// The validator's UTC time: 2026-11-08T00:00:00Z.
const UTC_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const SNAPSHOT_TTL_MS = 60 * 1000;
// After an S3 error the last good feed stays in use this long, and S3 is
// asked again after ERROR_RETRY_MS.
const STALE_IF_ERROR_MS = 60 * 60 * 1000;
const ERROR_RETRY_MS = 10 * 1000;

// Release numbers, read and ordered as the validator does
// (docs/releases-feed.md, "Versions", in the validator repository):
// MAJOR.MINOR.PATCH and an optional pre-release, in Semantic Versioning
// 2.0.0 order, 0.1.0-rc.4 < 0.1.0-rc.10 < 0.1.0 < 0.1.1-rc.1 < 0.1.1.
// Build metadata (+...) is not used.
const MAX_VERSION_LENGTH = 64;
const VERSION_NUMBER = /^(?:0|[1-9]\d*)$/;
const PRE_RELEASE_PART = /^[0-9A-Za-z-]+$/;
const DIGITS = /^\d+$/;
// The validator reads each number as a 64-bit unsigned integer.
const MAX_VERSION_NUMBER = "18446744073709551615";

type Version = {
  readonly core: readonly string[];
  readonly preRelease: readonly string[];
};

function isVersionNumber(part: string): boolean {
  return (
    VERSION_NUMBER.test(part) &&
    (part.length < MAX_VERSION_NUMBER.length ||
      (part.length === MAX_VERSION_NUMBER.length && part <= MAX_VERSION_NUMBER))
  );
}

function isPreReleasePart(part: string): boolean {
  return (
    PRE_RELEASE_PART.test(part) && (!DIGITS.test(part) || isVersionNumber(part))
  );
}

/** `0.1.0` or `0.1.0-rc.7`; null for anything the validator refuses. */
function parseVersion(text: string): Version | null {
  if (text.length > MAX_VERSION_LENGTH || text.includes("+")) {
    return null;
  }
  const dash = text.indexOf("-");
  const core = (dash === -1 ? text : text.slice(0, dash)).split(".");
  const preRelease = dash === -1 ? [] : text.slice(dash + 1).split(".");
  if (
    core.length !== 3 ||
    !core.every(isVersionNumber) ||
    !preRelease.every(isPreReleasePart)
  ) {
    return null;
  }
  return { core, preRelease };
}

function compareText(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
}

function comparePart(a: string, b: string): number {
  const aIsNumber = DIGITS.test(a);
  const bIsNumber = DIGITS.test(b);
  if (aIsNumber && bIsNumber) {
    // Neither has leading zeros, so the longer number is the larger.
    return a.length - b.length || compareText(a, b);
  }
  if (aIsNumber !== bIsNumber) {
    // A number is below a word.
    return aIsNumber ? -1 : 1;
  }
  return compareText(a, b);
}

function compareParts(a: readonly string[], b: readonly string[]): number {
  for (const [index, part] of a.entries()) {
    const other = b[index];
    if (other === undefined) {
      return 1;
    }
    const order = comparePart(part, other);
    if (order !== 0) {
      return order;
    }
  }
  return a.length - b.length;
}

/** Below zero when `a` is the lower version. */
function compareVersions(a: Version, b: Version): number {
  const core = compareParts(a.core, b.core);
  if (core !== 0) {
    return core;
  }
  if (a.preRelease.length === 0 || b.preRelease.length === 0) {
    // A release candidate is below the release it leads to.
    return (
      Number(a.preRelease.length === 0) - Number(b.preRelease.length === 0)
    );
  }
  return compareParts(a.preRelease, b.preRelease);
}

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

/** One line of plain text, at most 300 characters; null otherwise. */
function parseReason(value: unknown): string | null {
  if (typeof value !== "string" || CONTROL_CHARACTER.test(value)) {
    return null;
  }
  const reason = Array.from(value.trim()).slice(0, MAX_REASON_LENGTH).join("");
  return reason || null;
}

/** Urgent unless the feed says `normal`, or says nothing it can read. */
function isUrgent(value: unknown): boolean {
  return typeof value === "string" && value.trim() !== "" && value !== "normal";
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

type ParsedRelease = {
  readonly release: ValidatorRelease;
  readonly order: Version;
};

function parseRelease(value: unknown): ParsedRelease | null {
  if (!isRecord(value)) {
    return null;
  }
  const version = firstString(value, ["version"]);
  const order = version ? parseVersion(version) : null;
  const channel = firstString(value, ["channel"]);
  const publishedAt = firstString(value, [
    "published_at",
    "date",
    "released_at",
  ]);
  if (
    !version ||
    !order ||
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
    release: {
      version,
      channel,
      publishedAt,
      commit: commit && COMMIT_PATTERN.test(commit) ? commit : null,
      softwareId: firstString(value, ["software_id", "softwareId"]),
      notes: notes ? notes.slice(0, MAX_NOTES_LENGTH) : null,
      files: parseFiles(value["files"]),
      urgent: isUrgent(value["severity"]),
      reason: parseReason(value["reason"]),
      unsafeReason: null,
    },
    order,
  };
}

/**
 * The feed's `unsafe_versions`, by version as a release names it. An entry
 * without a valid version and a reason is left out.
 */
function parseUnsafeVersions(json: unknown): Map<string, string> {
  const unsafe = new Map<string, string>();
  const list = isRecord(json) ? json["unsafe_versions"] : null;
  if (!Array.isArray(list)) {
    return unsafe;
  }
  for (const value of list) {
    if (!isRecord(value)) {
      continue;
    }
    const version = value["version"];
    const reason = parseReason(value["reason"]);
    if (
      typeof version === "string" &&
      parseVersion(version) &&
      reason &&
      !unsafe.has(version)
    ) {
      unsafe.set(version, reason);
    }
  }
  return unsafe;
}

/**
 * Reads the release list out of the feed's JSON, once its signature has
 * been checked (`fetchSnapshot`). Invalid entries are dropped rather than
 * failing the whole page.
 *
 * Releases come out highest version first, as validators order them. Dates
 * play no part: a release and its last candidate can share a day, and the
 * page offers only the first entry.
 */
export function parseReleaseFeed(json: unknown): ValidatorRelease[] {
  const list = isRecord(json) ? json["releases"] : json;
  if (!Array.isArray(list)) {
    return [];
  }
  const unsafe = parseUnsafeVersions(json);
  const parsed: ParsedRelease[] = [];
  const seen = new Set<string>();
  for (const value of list) {
    const entry = parseRelease(value);
    if (entry && !seen.has(entry.release.version)) {
      seen.add(entry.release.version);
      parsed.push(entry);
    }
  }
  return parsed
    .sort((a, b) => compareVersions(b.order, a.order))
    .map(({ release }) => ({
      ...release,
      unsafeReason: unsafe.get(release.version) ?? null,
    }));
}

/**
 * Reads `min_supported`, `deadline` and `deadline_reason`. As in the
 * validator, a deadline counts only with a valid `min_supported`; anything
 * malformed is left out.
 */
export function parseFeedSupport(json: unknown): ValidatorFeedSupport {
  if (!isRecord(json)) {
    return NO_SUPPORT;
  }
  const minimum = json["min_supported"];
  const minSupported =
    typeof minimum === "string" && parseVersion(minimum) ? minimum : null;
  const time = json["deadline"];
  const deadline =
    minSupported &&
    typeof time === "string" &&
    UTC_TIME_PATTERN.test(time) &&
    !Number.isNaN(Date.parse(time))
      ? time
      : null;
  return {
    minSupported,
    deadline,
    deadlineReason: parseReason(json["deadline_reason"]),
  };
}

/**
 * The release the pages offer: the newest, unless the feed lists it as
 * unsafe. Then none is offered.
 */
export function getOfferedRelease(
  releases: readonly ValidatorRelease[]
): ValidatorRelease | undefined {
  const newest = releases[0];
  return newest?.unsafeReason === null ? newest : undefined;
}

type DecodedFeed = Pick<ReleaseFeedSnapshot, "releases" | "support"> & {
  /** The feed's `sequence`; null when it has none the site can read. */
  readonly sequence: number | null;
};

function readSequence(json: unknown): number | null {
  const value = isRecord(json) ? json["sequence"] : null;
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : null;
}

function decodeFeed(feed: FeedObject): DecodedFeed {
  try {
    const json: unknown = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(feed.body)
    );
    return {
      releases: parseReleaseFeed(json),
      support: parseFeedSupport(json),
      sequence: readSequence(json),
    };
  } catch {
    return { releases: [], support: NO_SUPPORT, sequence: null };
  }
}

type CachedSnapshot = {
  readonly snapshot: ReleaseFeedSnapshot;
  readonly loadedAt: number;
};

let cachedSnapshot: CachedSnapshot | null = null;
let lastGoodSnapshot: CachedSnapshot | null = null;
let inFlight: Promise<ReleaseFeedSnapshot> | null = null;
// The highest `sequence` this server has accepted. As in a validator, a
// signed feed with a lower one is an older list and is refused; the floor
// starts again when the server does.
let highestSequence = -1;

function errorSnapshot(reason: string): ReleaseFeedSnapshot {
  console.warn("[validator-page] release feed unavailable", reason);
  return {
    state: "error",
    feed: null,
    signature: null,
    releases: [],
    support: NO_SUPPORT,
  };
}

async function fetchSnapshot(): Promise<ReleaseFeedSnapshot> {
  const [feed, signature] = await Promise.all([
    readReleaseObject(FEED_OBJECT_KEY),
    readReleaseObject(FEED_SIGNATURE_OBJECT_KEY),
  ]);
  if (feed.state === "error") {
    return errorSnapshot(feed.reason);
  }
  if (signature.state === "error") {
    return errorSnapshot(signature.reason);
  }
  if (feed.state === "missing") {
    return {
      state: "missing",
      feed: null,
      signature: null,
      releases: [],
      support: NO_SUPPORT,
    };
  }
  // Nothing of the feed is read before its signature checks out: the
  // bucket holds the binaries and their hashes too, so the signature is
  // what vouches for the hashes the pages show.
  if (signature.state !== "found") {
    return errorSnapshot("the feed has no signature");
  }
  if (!isFeedSignatureValid(feed.body, signature.body)) {
    return errorSnapshot("the feed's signature does not verify");
  }
  const { sequence, ...decoded } = decodeFeed(feed);
  if (sequence !== null) {
    if (sequence < highestSequence) {
      return errorSnapshot("the feed is older than one already served");
    }
    highestSequence = sequence;
  }
  return { state: "ok", feed, signature, ...decoded };
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
  highestSequence = -1;
}
