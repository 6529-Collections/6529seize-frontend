import { createHash } from "node:crypto";
import { getDesktopReleasesServerEnv } from "@/config/serverEnv";
import {
  serveSignedFeedObject,
  type SignedFeedSnapshot,
  type SignedFeedText,
} from "@/lib/validator-page/feedResponse";
import {
  readBucketObject,
  type BucketLocation,
  type BucketObject,
} from "@/lib/validator-page/releasesBucket";

/**
 * 6529 Desktop's signed release list, served at `/desktop/releases.json` and
 * `/desktop/releases.json.sig` the way the validator's feed is. The site does
 * not check the signature (the app does, with its built-in key), but it never
 * serves a list without one.
 *
 * The publisher uploads the list and its signature together as ONE object,
 * `feed/releases.bundle.json`:
 *
 *     {"version":1,"list":"<base64>","signature":"<base64>"}
 *
 * `list` and `signature` are standard padded base64 of the exact bytes the
 * two routes serve. One PUT replaces both at once, so every read is a pair
 * the publisher wrote together.
 */
export const DESKTOP_BUNDLE_OBJECT_KEY = "feed/releases.bundle.json";

const DEFAULT_REGION = "us-east-1";
const BUNDLE_VERSION = 1;
// What 6529 Desktop accepts; anything larger is refused rather than served.
const MAX_LIST_BYTES = 56 * 1024;
const MAX_SIGNATURE_BYTES = 1024;
const BUNDLE_KEYS: ReadonlySet<string> = new Set([
  "version",
  "list",
  "signature",
]);
// The standard alphabet with padding; the length and the round trip in
// decodePart make it strict and canonical.
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;
const SNAPSHOT_TTL_MS = 60 * 1000;
// After a bucket error or a malformed bundle the last good pair stays in use
// this long, and the bucket is asked again after ERROR_RETRY_MS.
const STALE_IF_ERROR_MS = 60 * 60 * 1000;
const ERROR_RETRY_MS = 10 * 1000;

const TEXT: SignedFeedText = {
  missing: "No release list yet.\n",
  unavailable: "The release list is unavailable.\n",
  signatureContentType: "application/octet-stream",
};

const MISSING: SignedFeedSnapshot = {
  state: "missing",
  feed: null,
  signature: null,
};

function failed(reason: string): SignedFeedSnapshot {
  console.warn("[desktop-releases] release list unavailable", reason);
  return { state: "error", feed: null, signature: null };
}

/** Strict, canonical base64 of 1 to `maxBytes` bytes; null otherwise. */
function decodePart(value: unknown, maxBytes: number): Buffer | null {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > Math.ceil(maxBytes / 3) * 4 ||
    value.length % 4 !== 0 ||
    !BASE64.test(value)
  ) {
    return null;
  }
  const bytes = Buffer.from(value, "base64");
  return bytes.byteLength <= maxBytes && bytes.toString("base64") === value
    ? bytes
    : null;
}

function hasExactlyBundleKeys(record: object): boolean {
  const keys = Object.keys(record);
  return (
    keys.length === BUNDLE_KEYS.size &&
    keys.every((key) => BUNDLE_KEYS.has(key))
  );
}

type Bundle = { readonly list: Buffer; readonly signature: Buffer };

/** The bundle's two parts, or why it is refused. */
function parseBundle(body: Uint8Array): Bundle | string {
  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
  } catch {
    return "the bundle is not JSON";
  }
  if (
    typeof json !== "object" ||
    json === null ||
    Array.isArray(json) ||
    !hasExactlyBundleKeys(json)
  ) {
    return "the bundle does not hold exactly version, list and signature";
  }
  const record = json as Record<string, unknown>;
  if (record["version"] !== BUNDLE_VERSION) {
    return "the bundle's version is not 1";
  }
  const list = decodePart(record["list"], MAX_LIST_BYTES);
  const signature = decodePart(record["signature"], MAX_SIGNATURE_BYTES);
  if (!list || !signature) {
    return "the bundle's list or signature is not valid base64 of an accepted size";
  }
  return { list, signature };
}

/**
 * Names the pair by its content, so every server answers the same name for
 * the same list and signature. The list's length goes first, so moving bytes
 * between the two parts changes the name.
 */
function pairIdOf({ list, signature }: Bundle): string {
  return createHash("sha256")
    .update(`${list.byteLength}\n`)
    .update(list)
    .update(signature)
    .digest("hex")
    .slice(0, 32);
}

function part(
  bytes: Buffer,
  etag: string,
  lastModified: string | null
): Extract<BucketObject, { state: "found" }> {
  return {
    state: "found",
    body: new Uint8Array(bytes),
    etag,
    lastModified,
  };
}

function getLocation(): BucketLocation | null {
  const env = getDesktopReleasesServerEnv();
  if (!env.releasesBucket) {
    return null;
  }
  return {
    bucket: env.releasesBucket,
    region: env.releasesRegion ?? DEFAULT_REGION,
  };
}

async function readPair(
  location: BucketLocation | null
): Promise<SignedFeedSnapshot> {
  if (!location) {
    return MISSING;
  }
  const stored = await readBucketObject(location, DESKTOP_BUNDLE_OBJECT_KEY);
  if (stored.state === "error") {
    return failed(stored.reason);
  }
  if (stored.state === "missing") {
    return MISSING;
  }
  const bundle = parseBundle(stored.body);
  if (typeof bundle === "string") {
    return failed(bundle);
  }
  const pairId = pairIdOf(bundle);
  return {
    state: "ok",
    feed: part(bundle.list, `"${pairId}-list"`, stored.lastModified),
    signature: part(bundle.signature, `"${pairId}-sig"`, stored.lastModified),
    pairId,
  };
}

type Entry = {
  readonly snapshot: SignedFeedSnapshot;
  readonly at: number;
  /** The bucket it was read from; another bucket starts afresh. */
  readonly source: string;
};

type PendingRead = {
  readonly source: string;
  readonly promise: Promise<SignedFeedSnapshot>;
};

let current: Entry | null = null;
let lastGood: Entry | null = null;
let pending: PendingRead | null = null;
// The bucket the latest request asked for. A read that finishes after the
// setting changed answers its own request but is not cached.
let activeSource: string | null = null;

function startRead(
  location: BucketLocation | null,
  source: string
): PendingRead {
  const read: PendingRead = {
    source,
    promise: readPair(location).finally(() => {
      if (pending === read) {
        pending = null;
      }
    }),
  };
  pending = read;
  return read;
}

/** The pair, from one read of the bundle, reused for a minute. */
async function getSnapshot(): Promise<SignedFeedSnapshot> {
  const location = getLocation();
  const source = location ? `${location.region}/${location.bucket}` : "";
  activeSource = source;
  if (current?.source !== source) {
    current = null;
    lastGood = null;
  }
  if (current && Date.now() - current.at < SNAPSHOT_TTL_MS) {
    return current.snapshot;
  }
  const read =
    pending?.source === source ? pending : startRead(location, source);
  const snapshot = await read.promise;
  if (activeSource !== source) {
    return snapshot;
  }
  const at = Date.now();
  if (snapshot.state !== "error") {
    current = { snapshot, at, source };
    // Only a served pair is worth keeping through a failure. A missing
    // bundle is S3's definite answer (reads are strongly consistent), so a
    // deleted bundle withdraws the list rather than leaving it up an hour.
    lastGood = snapshot.state === "ok" ? current : null;
    return snapshot;
  }
  const served =
    lastGood && at - lastGood.at < STALE_IF_ERROR_MS
      ? lastGood.snapshot
      : snapshot;
  current = {
    snapshot: served,
    at: at - SNAPSHOT_TTL_MS + ERROR_RETRY_MS,
    source,
  };
  return served;
}

/** Serves the list or its signature byte for byte. */
export async function serveDesktopReleaseObject(
  request: Request,
  which: "feed" | "signature"
): Promise<Response> {
  return serveSignedFeedObject(request, await getSnapshot(), which, TEXT);
}

/** Test hook: forget the cached list. */
export function resetDesktopReleaseListCacheForTests(): void {
  current = null;
  lastGood = null;
  pending = null;
  activeSource = null;
}
