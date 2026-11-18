import { createHash } from "node:crypto";

import {
  serveSignedFeedObject,
  type SignedFeedSnapshot,
  type SignedFeedText,
} from "@/lib/validator-page/feedResponse";
import { isFeedSignatureValid } from "@/lib/validator-page/feedSignature";
import type { FeedSigningKey } from "@/lib/validator-page/feedSigningKeys";
import {
  parseFeedSupport,
  parseReleaseFeed,
  type ValidatorFeedSupport,
  type ValidatorRelease,
} from "@/lib/validator-page/releaseFeed";
import type {
  BucketLocation,
  BucketObject,
} from "@/lib/validator-page/releasesBucket";

/**
 * A product's signed release list in the validator's format 1, as the site
 * reads and serves it (the release standard's R8-R13 and R20-R23).
 *
 * The publisher uploads the list and its signature as ONE object, the
 * bundle:
 *
 *     {"version":1,"list":"<base64>","signature":"<base64>"}
 *
 * `list` and `signature` are standard padded base64 of the exact bytes the
 * product's `releases.json` and `releases.json.sig` routes serve. One PUT
 * replaces both, so every read is a pair the publisher wrote together.
 *
 * Before the routes serve a list, and before the pages read anything from
 * it, the site checks, in this order: the two parts' sizes; the signature,
 * ECDSA over secp256k1 of SHA-256(domain || 0x00 || the list's bytes as
 * stored), by a key the product trusts, named by its address; then it
 * parses the list, which must be format 1 with a `sequence` no lower than
 * one this server has already served from the same bucket. The bytes it
 * serves are the bytes it checked; nothing is re-encoded.
 */

/** Where one product's list is kept and served. */
export type ReleaseListConfig = {
  /** Names the product in the server's log lines, such as `ai-page`. */
  readonly logName: string;
  /** The domain the list is signed under, such as `6529 AI releases v1`. */
  readonly domain: string;
  /** The keys trusted to sign the list. With none, no list verifies. */
  readonly signers: readonly FeedSigningKey[];
  /** The bundle's key in the bucket, `feed/releases.bundle.json`. */
  readonly bundleKey: string;
  /** The site's routes for the list, its signature and its releases. */
  readonly routes: {
    readonly list: string;
    readonly signature: string;
    readonly releases: string;
  };
  /** The bucket; read on every call, so a changed setting reads afresh. */
  readonly location: () => BucketLocation;
  readonly read: (
    location: BucketLocation,
    key: string
  ) => Promise<BucketObject>;
  /** What the two routes answer when there is no list to serve. */
  readonly text: SignedFeedText;
  /**
   * What a bundle that reads as missing after one was served means.
   * `withdrawn`: the servers' role may list the bucket, so S3's 404 is a
   * definite answer. `failed`: the role may not list it, so S3 answers a
   * read it refuses as it answers a key that isn't there, and the served
   * list stays for up to an hour.
   */
  readonly missingAfterServed: "withdrawn" | "failed";
  /** The largest list accepted; 56 KiB, as every product checks it. */
  readonly maxListBytes?: number | undefined;
  /** The largest signature file accepted; 1 KiB. */
  readonly maxSignatureBytes?: number | undefined;
};

/** A list whose signature, format and sequence this server has checked. */
export type VerifiedReleaseList = {
  readonly sequence: number;
  /** Highest version first. Entries the site cannot use are left out. */
  readonly releases: readonly ValidatorRelease[];
  readonly support: ValidatorFeedSupport;
};

export type ReleaseListSnapshot = SignedFeedSnapshot & {
  /** The checked list when `state` is `ok`; null otherwise. */
  readonly list: VerifiedReleaseList | null;
};

export type ReleaseListReader = {
  readonly config: ReleaseListConfig;
  /** The list, from one read of the bundle, reused for a minute. */
  snapshot(): Promise<ReleaseListSnapshot>;
  /** Serves the list or its signature byte for byte, with the pair's name. */
  serve(request: Request, which: "feed" | "signature"): Promise<Response>;
  /** The release's place on the product's page of releases. */
  releaseHref(version: string): string;
  /** Test hook: forget the cached list and the sequence floors. */
  resetForTests(): void;
};

const BUNDLE_VERSION = 1;
const LIST_FORMAT = 1;
const MAX_LIST_BYTES = 56 * 1024;
const MAX_SIGNATURE_BYTES = 1024;
const BUNDLE_KEYS: ReadonlySet<string> = new Set([
  "version",
  "list",
  "signature",
]);
// The standard alphabet with padding; the length check and the round trip
// in decodePart make it strict and canonical.
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;
const SNAPSHOT_TTL_MS = 60 * 1000;
// After a failed read the last good list stays in use this long, and the
// bucket is asked again after ERROR_RETRY_MS.
const STALE_IF_ERROR_MS = 60 * 60 * 1000;
const ERROR_RETRY_MS = 10 * 1000;

const MISSING: ReleaseListSnapshot = {
  state: "missing",
  feed: null,
  signature: null,
  list: null,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

type Pair = { readonly list: Buffer; readonly signature: Buffer };

function decodeJson(bytes: Uint8Array): unknown {
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return undefined;
  }
}

/** The bundle's two parts within the limits, or why it is refused. */
function readBundle(
  body: Uint8Array,
  maxListBytes: number,
  maxSignatureBytes: number
): Pair | string {
  const json = decodeJson(body);
  if (
    !isRecord(json) ||
    Object.keys(json).length !== BUNDLE_KEYS.size ||
    !Object.keys(json).every((key) => BUNDLE_KEYS.has(key))
  ) {
    return "the bundle is not JSON holding exactly version, list and signature";
  }
  if (json["version"] !== BUNDLE_VERSION) {
    return "the bundle's version is not 1";
  }
  const list = decodePart(json["list"], maxListBytes);
  const signature = decodePart(json["signature"], maxSignatureBytes);
  if (!list || !signature) {
    return "the bundle's list or signature is not base64 of an accepted size";
  }
  return { list, signature };
}

type ListContent = {
  readonly json: Record<string, unknown>;
  readonly sequence: number;
};

/** The list's content, read only after its signature verified. */
function readList(bytes: Uint8Array): ListContent | string {
  const json = decodeJson(bytes);
  if (!isRecord(json) || json["format"] !== LIST_FORMAT) {
    return "the list is not JSON in format 1";
  }
  const sequence = json["sequence"];
  if (
    typeof sequence !== "number" ||
    !Number.isSafeInteger(sequence) ||
    sequence < 0 ||
    !Array.isArray(json["releases"])
  ) {
    return "the list has no sequence or no releases";
  }
  return { json, sequence };
}

/**
 * Names the pair by its content, so every server answers the same name for
 * the same list and signature. The list's length goes first, so moving
 * bytes between the two parts changes the name.
 */
function pairIdOf({ list, signature }: Pair): string {
  return createHash("sha256")
    .update(`${list.byteLength}\n`)
    .update(list)
    .update(signature)
    .digest("hex")
    .slice(0, 32);
}

type CheckedBundle = {
  readonly pair: Pair;
  readonly content: ListContent;
};

/**
 * The bundle's list, checked in order: the two parts' sizes, the
 * signature over the list's bytes as stored, then the list's format and
 * sequence. Or why it is refused.
 */
function checkBundle(
  config: ReleaseListConfig,
  body: Uint8Array
): CheckedBundle | string {
  const pair = readBundle(
    body,
    Math.min(config.maxListBytes ?? MAX_LIST_BYTES, MAX_LIST_BYTES),
    Math.min(
      config.maxSignatureBytes ?? MAX_SIGNATURE_BYTES,
      MAX_SIGNATURE_BYTES
    )
  );
  if (typeof pair === "string") {
    return pair;
  }
  // Nothing in the list is read before its signature checks out: the
  // signature is what vouches for the SHA-256 values the pages show.
  if (
    !isFeedSignatureValid(
      pair.list,
      pair.signature,
      config.signers,
      config.domain
    )
  ) {
    return "the list's signature does not verify";
  }
  const content = readList(pair.list);
  return typeof content === "string" ? content : { pair, content };
}

function part(
  bytes: Buffer,
  etag: string,
  lastModified: string | null
): Extract<BucketObject, { state: "found" }> {
  return { state: "found", body: new Uint8Array(bytes), etag, lastModified };
}

type Entry = { readonly snapshot: ReleaseListSnapshot; readonly at: number };

type PendingRead = {
  /** The bucket setting's generation when the read started. */
  readonly generation: number;
  /** Increases with every read started, whatever its bucket. */
  readonly seq: number;
  readonly promise: Promise<ReleaseListSnapshot>;
};

/**
 * The reader of one product's list: one read of the bundle a minute, the
 * last good list for an hour through a failure, and a sequence floor per
 * bucket. Overlapping requests share a read; a read started under an
 * earlier bucket setting answers only its own request.
 */
export function createReleaseListReader(
  config: ReleaseListConfig
): ReleaseListReader {
  let current: Entry | null = null;
  let lastGood: Entry | null = null;
  let pending: PendingRead | null = null;
  // Bumped whenever the bucket setting changes, so reads started under an
  // earlier setting never write the cache, even after the setting comes
  // back (A, then B, then A again).
  let generation = 0;
  let latestSource: string | null = null;
  let readSeq = 0;
  // The newest read that has written the cache; an older one never
  // overwrites it.
  let writtenSeq = 0;
  // The highest sequence served from each bucket. A list with a lower one
  // is an older list and is refused; the floors start again when the
  // server does.
  const floors = new Map<string, number>();

  const failed = (reason: string): ReleaseListSnapshot => {
    console.warn(
      `[${config.logName}] ${config.routes.list} unavailable:`,
      reason
    );
    return { state: "error", feed: null, signature: null, list: null };
  };

  async function readPair(
    location: BucketLocation,
    source: string
  ): Promise<ReleaseListSnapshot> {
    const stored = await config.read(location, config.bundleKey);
    if (stored.state === "error") {
      return failed(stored.reason);
    }
    if (stored.state === "missing") {
      return MISSING;
    }
    const checked = checkBundle(config, stored.body);
    if (typeof checked === "string") {
      return failed(checked);
    }
    const { pair, content: read } = checked;
    const floor = floors.get(source) ?? -1;
    if (read.sequence < floor) {
      return failed(
        `the list's sequence ${read.sequence} is below ${floor}, already served`
      );
    }
    floors.set(source, read.sequence);
    const pairId = pairIdOf(pair);
    return {
      state: "ok",
      feed: part(pair.list, `"${pairId}-list"`, stored.lastModified),
      signature: part(pair.signature, `"${pairId}-sig"`, stored.lastModified),
      pairId,
      list: {
        sequence: read.sequence,
        releases: parseReleaseFeed(read.json),
        support: parseFeedSupport(read.json),
      },
    };
  }

  function startRead(location: BucketLocation, source: string): PendingRead {
    readSeq += 1;
    const read: PendingRead = {
      generation,
      seq: readSeq,
      promise: readPair(location, source).finally(() => {
        if (pending === read) {
          pending = null;
        }
      }),
    };
    pending = read;
    return read;
  }

  async function snapshot(): Promise<ReleaseListSnapshot> {
    const location = config.location();
    const source = `${location.region}/${location.bucket}`;
    if (source !== latestSource) {
      latestSource = source;
      generation += 1;
      current = null;
      lastGood = null;
    }
    if (current && Date.now() - current.at < SNAPSHOT_TTL_MS) {
      return current.snapshot;
    }
    const read =
      pending?.generation === generation
        ? pending
        : startRead(location, source);
    const result = await read.promise;
    if (read.generation !== generation || read.seq < writtenSeq) {
      // Started under an earlier setting, or a newer read already
      // answered: this read answers only its own request.
      return result;
    }
    writtenSeq = read.seq;
    const at = Date.now();
    const fresh = lastGood !== null && at - lastGood.at < STALE_IF_ERROR_MS;
    const lost =
      result.state === "missing" &&
      config.missingAfterServed === "failed" &&
      fresh;
    if (result.state !== "error" && !lost) {
      current = { snapshot: result, at };
      // Only a served list is worth keeping through a failure.
      lastGood = result.state === "ok" ? current : null;
      return result;
    }
    if (lost) {
      console.warn(
        `[${config.logName}] ${config.routes.list} reads as missing after a served list`
      );
    }
    const served = fresh && lastGood ? lastGood.snapshot : result;
    current = { snapshot: served, at: at - SNAPSHOT_TTL_MS + ERROR_RETRY_MS };
    return served;
  }

  return {
    config,
    snapshot,
    async serve(request, which) {
      return serveSignedFeedObject(
        request,
        await snapshot(),
        which,
        config.text
      );
    },
    releaseHref(version) {
      return `${config.routes.releases}#${encodeURIComponent(version)}`;
    },
    resetForTests() {
      current = null;
      lastGood = null;
      pending = null;
      generation = 0;
      latestSource = null;
      readSeq = 0;
      writtenSeq = 0;
      floors.clear();
    },
  };
}
