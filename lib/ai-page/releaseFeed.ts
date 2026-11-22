import type { ReleaseListSnapshot } from "@/lib/release-section/releaseList";
import {
  compareVersions,
  parseVersion,
  type ValidatorFeedSupport,
  type ValidatorRelease,
  type ValidatorReleaseFile,
  type Version,
} from "@/lib/validator-page/releaseFeed";

import { isAiFeedSignatureValid } from "./feedSignature";
import { aiReleaseList } from "./releaseList";
import {
  AI_FEED_OBJECT_KEY,
  AI_FEED_SIGNATURE_OBJECT_KEY,
  readAiReleaseObject,
  type AiBucketObject,
} from "./releasesBucket";

/** The systems a release file is built for, as the feed names them. */
const AI_SYSTEMS = [
  "macos-arm64",
  "windows-x64",
  "linux-x86_64-cpu",
  "linux-x86_64-cuda",
  "linux-arm64-cpu",
  "linux-arm64-cuda",
] as const;

export type AiSystem = (typeof AI_SYSTEMS)[number];

/**
 * How the release list vouches for a file, by its type, as the release
 * standard's R62 words it: `publisher`, a Windows program signed by 6529
 * Collection LLC; `apple`, a Mac disk image with an Apple Developer ID,
 * notarized; `list`, any other file, covered by its SHA-256 in the signed
 * list (the Linux packages carry no signature of their own).
 */
export type AiSignedBy = "publisher" | "apple" | "list";

/** The publisher Windows names for a signed 6529 AI program. */
export const AI_PUBLISHER = "6529 Collection LLC";

export type AiReleaseFile = {
  readonly name: string;
  /**
   * The system it is for; null for the release list's own files
   * (`SHA256SUMS`, `SHA256SUMS.sig`, `manifest.json`) and for a system this
   * site doesn't know yet.
   */
  readonly system: AiSystem | null;
  /** Lowercase hex SHA-256. */
  readonly sha256: string;
  /** Bytes, or null when the feed does not say. */
  readonly size: number | null;
  /**
   * The name the visitor's system shows for the file's code signature, as
   * the Ed25519 feed gives it, or the publisher of a Windows program in a
   * list of format 1; null for a file with no code signature. The site does
   * not check code signatures.
   */
  readonly signed: string | null;
  /**
   * In a list of format 1, which has no `system` or `signed` per file: how
   * the list vouches for the file, by its type. Absent in the Ed25519
   * feed, whose `signed` says it.
   */
  readonly signedBy?: AiSignedBy | undefined;
};

export type AiRelease = {
  readonly version: string;
  /** `YYYY-MM-DD`. */
  readonly date: string;
  readonly commit: string | null;
  readonly channel: string;
  readonly notes: string | null;
  readonly files: readonly AiReleaseFile[];
  /**
   * From a list of format 1 only: the list marks the release urgent (or
   * gives a severity the site doesn't know, which counts as urgent), and
   * why, in a line.
   */
  readonly urgent?: boolean | undefined;
  readonly reason?: string | null | undefined;
  /** From a list of format 1 only: why `unsafe_versions` lists it. */
  readonly unsafeReason?: string | null | undefined;
};

type FeedObject = Extract<AiBucketObject, { state: "found" }>;

export type AiReleaseFeedSnapshot = {
  /**
   * `missing` until the first list is uploaded. `error` when S3 fails, or
   * when the list's signature is missing or does not verify with a trusted
   * key, its format is not one this site reads, or it is older than one
   * already served: then the pages offer nothing.
   */
  readonly state: "ok" | "missing" | "error";
  readonly feed: FeedObject | null;
  readonly signature: FeedObject | null;
  /** Highest version first. Entries the site cannot use are left out. */
  readonly releases: readonly AiRelease[];
  /**
   * `list` for the bundle in the validator's format 1, `ed25519` for the
   * feed in 6529 AI's first format; absent without a list.
   */
  readonly source?: "list" | "ed25519" | undefined;
  /** The bundle's pair, sent as `X-Release-List-Pair`; list only. */
  readonly pairId?: string | undefined;
  /** `min_supported`, `deadline` and `deadline_reason`; list only. */
  readonly support?: ValidatorFeedSupport | undefined;
};

const FEED_FORMAT = "6529-ai-releases/1";
// A file name becomes one S3 key segment and a download path segment, so
// it may not hold a slash, a backslash, `..` or a control character, or
// start with a dot.
const FILE_NAME_PATTERN = /^[0-9A-Za-z][0-9A-Za-z._+~-]{0,127}$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const COMMIT_PATTERN = /^[0-9a-f]{7,64}$/;
// The format's `date` is `YYYY-MM-DD`; an ISO 8601 time after it is read
// too, and the page shows the day.
const DATE_START = /^\d{4}-\d{2}-\d{2}/;
const DATE_CHARACTERS = /^[0-9TZ:.+-]{10,35}$/;
const CHANNEL_PATTERN = /^[0-9A-Za-z][0-9A-Za-z._-]{0,31}$/;
const MAX_NOTES_LENGTH = 2_000;
const MAX_SIGNED_LENGTH = 200;
// Notes may run over several lines; nothing else in the feed may.
const CONTROL_CHARACTER = /\p{Cc}/u;
const CONTROL_EXCEPT_NEWLINE = /[^\P{Cc}\n]/u;
const SNAPSHOT_TTL_MS = 60 * 1000;
// After a failed read the last good feed stays in use this long, and S3 is
// asked again after ERROR_RETRY_MS.
const STALE_IF_ERROR_MS = 60 * 60 * 1000;
const ERROR_RETRY_MS = 10 * 1000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trimmedString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isAiSystem(value: string): value is AiSystem {
  return (AI_SYSTEMS as readonly string[]).includes(value);
}

function parseSize(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : null;
}

/** One line of plain text, at most 200 characters; null otherwise. */
function parseSigned(value: unknown): string | null {
  const text = trimmedString(value);
  return text &&
    text.length <= MAX_SIGNED_LENGTH &&
    !CONTROL_CHARACTER.test(text)
    ? text
    : null;
}

function parseFile(value: unknown): AiReleaseFile | null {
  if (!isRecord(value)) {
    return null;
  }
  const name = value["name"];
  const sha256 = trimmedString(value["sha256"])?.toLowerCase() ?? "";
  if (
    typeof name !== "string" ||
    !FILE_NAME_PATTERN.test(name) ||
    name.includes("..") ||
    !SHA256_PATTERN.test(sha256)
  ) {
    return null;
  }
  const system = trimmedString(value["system"]);
  return {
    name,
    system: system && isAiSystem(system) ? system : null,
    sha256,
    size: parseSize(value["size"]),
    signed: parseSigned(value["signed"]),
  };
}

function parseFiles(value: unknown): AiReleaseFile[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const files: AiReleaseFile[] = [];
  const seen = new Set<string>();
  for (const entry of value) {
    const file = parseFile(entry);
    if (file && !seen.has(file.name)) {
      seen.add(file.name);
      files.push(file);
    }
  }
  return files;
}

function parseNotes(value: unknown): string | null {
  const notes = trimmedString(value);
  if (!notes || CONTROL_EXCEPT_NEWLINE.test(notes.replaceAll("\r\n", "\n"))) {
    return null;
  }
  return notes.replaceAll("\r\n", "\n").slice(0, MAX_NOTES_LENGTH);
}

type ParsedRelease = {
  readonly release: AiRelease;
  readonly order: Version;
};

function parseRelease(value: unknown): ParsedRelease | null {
  if (!isRecord(value)) {
    return null;
  }
  const version = trimmedString(value["version"]);
  const order = version ? parseVersion(version) : null;
  const date = trimmedString(value["date"]);
  const channel = trimmedString(value["channel"]);
  if (
    !version ||
    !order ||
    !date ||
    !DATE_START.test(date) ||
    !DATE_CHARACTERS.test(date) ||
    Number.isNaN(Date.parse(date)) ||
    !channel ||
    !CHANNEL_PATTERN.test(channel)
  ) {
    return null;
  }
  const commit = trimmedString(value["commit"])?.toLowerCase() ?? null;
  return {
    release: {
      version,
      date: date.slice(0, 10),
      commit: commit && COMMIT_PATTERN.test(commit) ? commit : null,
      channel,
      notes: parseNotes(value["notes"]),
      files: parseFiles(value["files"]),
    },
    order,
  };
}

/**
 * Reads the release list out of the feed's JSON, once its signature has
 * been checked. A feed in another format reads as null; entries and files
 * that break the format's rules are left out rather than failing the page.
 * Releases come out highest version first (Semantic Versioning).
 */
export function parseAiReleaseFeed(json: unknown): AiRelease[] | null {
  if (!isRecord(json) || json["format"] !== FEED_FORMAT) {
    return null;
  }
  const list = json["releases"];
  if (!Array.isArray(list)) {
    return [];
  }
  const parsed: ParsedRelease[] = [];
  const seen = new Set<string>();
  for (const value of list) {
    const entry = parseRelease(value);
    if (entry && !seen.has(entry.release.version)) {
      seen.add(entry.release.version);
      parsed.push(entry);
    }
  }
  parsed.sort((a, b) => compareVersions(b.order, a.order));
  return parsed.map(({ release }) => release);
}

/** The release the pages offer and hand out: the newest. */
export function getNewestAiRelease(
  releases: readonly AiRelease[]
): AiRelease | undefined {
  return releases[0];
}

type DecodedFeed = {
  readonly releases: readonly AiRelease[];
  /** The feed's `sequence`; null when it has none the site can read. */
  readonly sequence: number | null;
};

function decodeFeed(feed: FeedObject): DecodedFeed | null {
  let json: unknown;
  try {
    json = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(feed.body)
    );
  } catch {
    return null;
  }
  const releases = parseAiReleaseFeed(json);
  if (!releases) {
    return null;
  }
  const sequence = isRecord(json) ? json["sequence"] : null;
  return {
    releases,
    sequence:
      typeof sequence === "number" &&
      Number.isSafeInteger(sequence) &&
      sequence >= 0
        ? sequence
        : null,
  };
}

type CachedSnapshot = {
  readonly snapshot: AiReleaseFeedSnapshot;
  readonly loadedAt: number;
};

let cachedSnapshot: CachedSnapshot | null = null;
let lastGoodSnapshot: CachedSnapshot | null = null;
let inFlight: Promise<AiReleaseFeedSnapshot> | null = null;
// The highest `sequence` this server has accepted. A signed feed with a
// lower one is an older list and is refused; the floor starts again when
// the server does.
let highestSequence = -1;

const MISSING: AiReleaseFeedSnapshot = {
  state: "missing",
  feed: null,
  signature: null,
  releases: [],
};

function errorSnapshot(reason: string): AiReleaseFeedSnapshot {
  console.warn("[ai-page] release feed unavailable", reason);
  return { state: "error", feed: null, signature: null, releases: [] };
}

async function fetchSnapshot(): Promise<AiReleaseFeedSnapshot> {
  const [feed, signature] = await Promise.all([
    readAiReleaseObject(AI_FEED_OBJECT_KEY),
    readAiReleaseObject(AI_FEED_SIGNATURE_OBJECT_KEY),
  ]);
  if (feed.state === "error") {
    return errorSnapshot(feed.reason);
  }
  if (signature.state === "error") {
    return errorSnapshot(signature.reason);
  }
  if (feed.state === "missing") {
    return MISSING;
  }
  // Nothing of the feed is read before its signature checks out: the
  // bucket holds the files and their hashes too, so the signature is what
  // vouches for the hashes the pages show.
  if (signature.state !== "found") {
    return errorSnapshot("the feed has no signature");
  }
  if (!isAiFeedSignatureValid(feed.body, signature.body)) {
    return errorSnapshot("the feed's signature does not verify");
  }
  const decoded = decodeFeed(feed);
  if (!decoded) {
    return errorSnapshot("the feed is not in a format this site reads");
  }
  if (decoded.sequence !== null) {
    if (decoded.sequence < highestSequence) {
      return errorSnapshot("the feed is older than one already served");
    }
    highestSequence = decoded.sequence;
  }
  return {
    state: "ok",
    source: "ed25519",
    feed,
    signature,
    releases: decoded.releases,
  };
}

/**
 * The Ed25519 feed and its signature, read together so they always match,
 * and reused for a minute. A new release shows within that minute.
 */
async function getEd25519FeedSnapshot(): Promise<AiReleaseFeedSnapshot> {
  const now = Date.now();
  if (cachedSnapshot && now - cachedSnapshot.loadedAt < SNAPSHOT_TTL_MS) {
    return cachedSnapshot.snapshot;
  }
  inFlight ??= fetchSnapshot().finally(() => {
    inFlight = null;
  });
  const snapshot = await inFlight;
  const loaded = { snapshot, loadedAt: Date.now() };
  // S3 answers a key the role may not read as it answers one that isn't
  // there, so a feed that reads as missing after a verified one was served
  // counts as a failed read: the verified feed stays for up to an hour.
  const lostVerifiedFeed =
    snapshot.state === "missing" && lastGoodSnapshot?.snapshot.state === "ok";
  if (lostVerifiedFeed) {
    console.warn("[ai-page] release feed reads as missing after a good one");
  }
  if (snapshot.state !== "error" && !lostVerifiedFeed) {
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

// The file names 6529 AI's release tool gives each system's downloads
// (its deploy/release/release.py, feed_files): `<name>-<version>-<system>`
// for the Mac, Windows and the archives, Debian's own form for the .deb.
const SYSTEM_BY_NAME: readonly (readonly [RegExp, AiSystem])[] = [
  [/-macos-arm64\.dmg$/, "macos-arm64"],
  [/-windows-x64-setup\.exe$/, "windows-x64"],
  [/^6529-ai-cuda_[^_]+_amd64\.deb$/, "linux-x86_64-cuda"],
  [/^6529-ai_[^_]+_amd64\.deb$/, "linux-x86_64-cpu"],
  [/^6529-ai_[^_]+_arm64\.deb$/, "linux-arm64-cpu"],
  [/^6529-ai-cuda_[^_]+_arm64\.deb$/, "linux-arm64-cuda"],
  [/-linux-x86_64-cpu\.tar\.gz$/, "linux-x86_64-cpu"],
  [/-linux-x86_64-cuda\.tar\.gz$/, "linux-x86_64-cuda"],
  [/-linux-arm64-cpu\.tar\.gz$/, "linux-arm64-cpu"],
  [/-linux-arm64-cuda\.tar\.gz$/, "linux-arm64-cuda"],
];

/**
 * The system a file is for, from its name; null for a file that is no
 * system's download, such as `SHA256SUMS` or `NOTES.md`.
 */
function systemOfFileName(name: string): AiSystem | null {
  return SYSTEM_BY_NAME.find(([pattern]) => pattern.test(name))?.[1] ?? null;
}

/** How the release list vouches for a file, by its type (R62). */
export function signedByOf(
  file: Pick<AiReleaseFile, "name" | "system">
): AiSignedBy {
  if (file.system === "windows-x64" && file.name.endsWith(".exe")) {
    return "publisher";
  }
  if (file.system === "macos-arm64" && file.name.endsWith(".dmg")) {
    return "apple";
  }
  return "list";
}

function fromListFile(file: ValidatorReleaseFile): AiReleaseFile {
  const system = systemOfFileName(file.name);
  const signedBy = signedByOf({ name: file.name, system });
  return {
    name: file.name,
    system,
    sha256: file.sha256,
    size: file.size,
    signed: signedBy === "publisher" ? AI_PUBLISHER : null,
    signedBy,
  };
}

function fromListRelease(release: ValidatorRelease): AiRelease {
  return {
    version: release.version,
    date: release.publishedAt.slice(0, 10),
    commit: release.commit,
    channel: release.channel,
    notes: parseNotes(release.notes),
    files: release.files.map(fromListFile),
    urgent: release.urgent,
    reason: release.reason,
    unsafeReason: release.unsafeReason,
  };
}

// One conversion per list read: the snapshot object stays the same while
// the list does.
const converted = new WeakMap<ReleaseListSnapshot, AiReleaseFeedSnapshot>();

function fromReleaseList(snapshot: ReleaseListSnapshot): AiReleaseFeedSnapshot {
  const known = converted.get(snapshot);
  if (known) {
    return known;
  }
  const { list, feed, signature } = snapshot;
  const result: AiReleaseFeedSnapshot =
    snapshot.state === "ok" && list && feed && signature
      ? {
          state: "ok",
          source: "list",
          feed: { state: "found", ...feed },
          signature: { state: "found", ...signature },
          pairId: snapshot.pairId,
          releases: list.releases.map(fromListRelease),
          support: list.support,
        }
      : {
          state: snapshot.state === "missing" ? "missing" : "error",
          feed: null,
          signature: null,
          releases: [],
        };
  converted.set(snapshot, result);
  return result;
}

// Set once this server has served the bundle. From then on the Ed25519
// feed, which stops at the last release before the bundle, is never served
// again: a bundle that fails keeps its last good list for an hour, then the
// pages offer nothing, rather than go back to an older list. It starts
// again when the server does, as the sequence floors do.
let servedList = false;

/**
 * 6529 AI's releases, as /ai, its downloads and /ai/releases.json read
 * them: the bundle in the validator's format 1 when it is present and
 * verifies with a key in `releaseListKeys.ts`, and otherwise the Ed25519
 * feed. Each is reused for a minute, so a new release shows within it.
 */
export async function getAiReleaseFeedSnapshot(): Promise<AiReleaseFeedSnapshot> {
  const list = await aiReleaseList.snapshot();
  if (list.state === "ok") {
    servedList = true;
  }
  return servedList ? fromReleaseList(list) : getEd25519FeedSnapshot();
}

/**
 * The release the pages offer and hand out: the newest, unless the list
 * says it is unsafe to run. Then none is offered.
 */
export function getOfferedAiRelease(
  releases: readonly AiRelease[]
): AiRelease | undefined {
  const newest = releases[0];
  return newest?.unsafeReason ? undefined : newest;
}

/** Test hook: forget the cached lists, the floors and which was served. */
export function resetAiReleaseFeedCacheForTests(): void {
  cachedSnapshot = null;
  lastGoodSnapshot = null;
  inFlight = null;
  highestSequence = -1;
  servedList = false;
  aiReleaseList.resetForTests();
}
