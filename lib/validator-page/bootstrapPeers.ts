import { readReleaseObject } from "./releasesBucket";

/**
 * The addresses of 6529's two sentries live in the private bucket, not in
 * this public repository: testers see them only behind the password.
 */
const BOOTSTRAP_PEERS_OBJECT_KEY = "content/bootstrap-peers.json";

const ADDRESS_KINDS = ["peer_id", "tcp", "quic", "onion"] as const;
type AddressKind = (typeof ADDRESS_KINDS)[number];
type SentryAddresses = Partial<Record<AddressKind, string>>;

const PEER_ID_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{40,64}$/;
const MULTIADDR_PATTERN = /^\/(?:ip4|ip6|dns4|dns6|onion3)\/[\w.:/-]{3,200}$/;
const CACHE_TTL_MS = 60 * 1000;

let cached: {
  readonly sentries: readonly SentryAddresses[];
  readonly loadedAt: number;
} | null = null;

function parseSentry(value: unknown): SentryAddresses {
  if (typeof value !== "object" || value === null) {
    return {};
  }
  const record = value as Record<string, unknown>;
  const sentry: SentryAddresses = {};
  for (const kind of ADDRESS_KINDS) {
    const field = record[kind];
    const pattern = kind === "peer_id" ? PEER_ID_PATTERN : MULTIADDR_PATTERN;
    if (typeof field === "string" && pattern.test(field)) {
      sentry[kind] = field;
    }
  }
  return sentry;
}

async function loadSentries(): Promise<readonly SentryAddresses[]> {
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
    return cached.sentries;
  }
  const object = await readReleaseObject(BOOTSTRAP_PEERS_OBJECT_KEY);
  if (object.state !== "found") {
    // Keep what was read before, and ask S3 again in ten seconds.
    const sentries = cached?.sentries ?? [];
    cached = { sentries, loadedAt: Date.now() - CACHE_TTL_MS + 10_000 };
    return sentries;
  }
  let sentries: SentryAddresses[] = [];
  try {
    const json = JSON.parse(new TextDecoder().decode(object.body)) as {
      sentries?: unknown;
    };
    sentries = Array.isArray(json.sentries)
      ? json.sentries.map(parseSentry)
      : [];
  } catch {
    sentries = [];
  }
  cached = { sentries, loadedAt: Date.now() };
  return sentries;
}

/**
 * Puts the sentry addresses into the guide's `{{SENTRY_1_TCP}}`-style
 * tokens. A token without an address becomes a visible placeholder, and
 * `complete` is false so the page can say so.
 */
export async function fillBootstrapPeers(
  markdown: string
): Promise<{ markdown: string; complete: boolean }> {
  const sentries = await loadSentries();
  let complete = true;
  const filled = markdown.replaceAll(
    /\{\{SENTRY_([12])_(PEER_ID|TCP|QUIC|ONION)\}\}/g,
    (_token, index: string, kind: string) => {
      const value =
        sentries[Number(index) - 1]?.[kind.toLowerCase() as AddressKind];
      if (value) {
        return value;
      }
      complete = false;
      const addressLabel = `${kind.toLowerCase()} address`;
      const what = kind === "PEER_ID" ? "peer ID" : addressLabel;
      return `<sentry-${index} ${what}>`;
    }
  );
  return { markdown: filled, complete };
}

/** Test hook: forget the cached addresses. */
export function resetBootstrapPeersCacheForTests(): void {
  cached = null;
}
