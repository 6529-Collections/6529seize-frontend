import { getDesktopReleasesServerEnv } from "@/config/serverEnv";
import {
  serveSignedListObject,
  type SignedListMessages,
  type SignedListSnapshot,
} from "@/lib/validator-page/feedResponse";
import {
  FEED_OBJECT_KEY,
  FEED_SIGNATURE_OBJECT_KEY,
  readBucketObject,
  type BucketLocation,
} from "@/lib/validator-page/releasesBucket";

/**
 * 6529 Desktop's signed release list, served at `/desktop/releases.json` and
 * `/desktop/releases.json.sig` the way the validator's feed is. The site does
 * not check the signature (the app does, with its built-in key), but it never
 * serves a list without one.
 */
const DEFAULT_REGION = "us-east-1";
const SNAPSHOT_TTL_MS = 60 * 1000;
// After a bucket error the last good pair stays in use this long, and the
// bucket is asked again after ERROR_RETRY_MS.
const STALE_IF_ERROR_MS = 60 * 60 * 1000;
const ERROR_RETRY_MS = 10 * 1000;

const MESSAGES: SignedListMessages = {
  missing: "No release list yet.\n",
  unavailable: "The release list is unavailable.\n",
};

const MISSING: SignedListSnapshot = {
  state: "missing",
  feed: null,
  signature: null,
};

function failed(reason: string): SignedListSnapshot {
  console.warn("[desktop-releases] release list unavailable", reason);
  return { state: "error", feed: null, signature: null };
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

async function readPair(): Promise<SignedListSnapshot> {
  const location = getLocation();
  if (!location) {
    return MISSING;
  }
  const [list, signature] = await Promise.all([
    readBucketObject(location, FEED_OBJECT_KEY),
    readBucketObject(location, FEED_SIGNATURE_OBJECT_KEY),
  ]);
  if (list.state === "error") {
    return failed(list.reason);
  }
  if (signature.state === "error") {
    return failed(signature.reason);
  }
  if (list.state === "missing") {
    return MISSING;
  }
  if (signature.state === "missing") {
    return failed("the list has no signature");
  }
  return { state: "ok", feed: list, signature };
}

type Entry = { readonly snapshot: SignedListSnapshot; readonly at: number };

let current: Entry | null = null;
let lastGood: Entry | null = null;
let pending: Promise<SignedListSnapshot> | null = null;

/**
 * The list and its signature, read together so they always match, and
 * reused for a minute.
 */
async function getSnapshot(): Promise<SignedListSnapshot> {
  if (current && Date.now() - current.at < SNAPSHOT_TTL_MS) {
    return current.snapshot;
  }
  pending ??= readPair().finally(() => {
    pending = null;
  });
  const snapshot = await pending;
  const at = Date.now();
  if (snapshot.state !== "error") {
    current = { snapshot, at };
    lastGood = current;
    return snapshot;
  }
  const served =
    lastGood && at - lastGood.at < STALE_IF_ERROR_MS
      ? lastGood.snapshot
      : snapshot;
  current = { snapshot: served, at: at - SNAPSHOT_TTL_MS + ERROR_RETRY_MS };
  return served;
}

/** Serves the list or its signature byte for byte. */
export async function serveDesktopReleaseObject(
  request: Request,
  which: "feed" | "signature"
): Promise<Response> {
  return serveSignedListObject(request, await getSnapshot(), which, MESSAGES);
}

/** Test hook: forget the cached list. */
export function resetDesktopReleaseListCacheForTests(): void {
  current = null;
  lastGood = null;
  pending = null;
}
