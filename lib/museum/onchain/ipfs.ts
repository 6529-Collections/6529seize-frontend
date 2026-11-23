import type { Hex } from "viem";
import {
  DEFAULT_MEDIA_RESOLVER_ENDPOINT,
  getDecentralizedMediaFetchUrls,
} from "@/lib/media/decentralized-media";
import { cidToText } from "./cid";
import { ONCHAIN_MUSEUM_MAX_CONTENT_BYTES } from "./constants";

const RESOLVER_TIMEOUT_MS = 8_000;
const FALLBACK_TIMEOUT_MS = 5_000;

export interface FetchedCidBytes {
  readonly bytes: Uint8Array;
  /** The gateway origin that served the bytes. */
  readonly host: string;
  /** False when every gateway that answered served bytes `accept` refused. */
  readonly accepted: boolean;
}

/**
 * Fetches a CID. `accept` checks the bytes against the chain; a gateway whose
 * bytes fail it is skipped and the next one is asked.
 */
export type CidFetcher = (
  cid: Hex,
  accept?: (bytes: Uint8Array) => boolean
) => Promise<FetchedCidBytes | null>;

/**
 * The URLs a CID is requested from: 6529's media resolver first, then the
 * public gateways the site already lists. Nothing here is trusted; callers
 * hash what comes back against the chain.
 */
function cidFetchUrls(
  cid: Hex,
  resolverEndpoint: string = DEFAULT_MEDIA_RESOLVER_ENDPOINT
): string[] {
  return getDecentralizedMediaFetchUrls(`ipfs://${cidToText(cid)}`, {
    resolverEndpoint,
    includeExternalFallbacks: true,
  });
}

async function readLimited(response: Response): Promise<Uint8Array | null> {
  const declared = Number(response.headers.get("content-length") ?? "0");
  if (declared > ONCHAIN_MUSEUM_MAX_CONTENT_BYTES) return null;
  const buffer = new Uint8Array(await response.arrayBuffer());
  return buffer.length > ONCHAIN_MUSEUM_MAX_CONTENT_BYTES ? null : buffer;
}

export function createCidFetcher(
  resolverEndpoint: string = DEFAULT_MEDIA_RESOLVER_ENDPOINT,
  fetchImpl: typeof fetch = fetch
): CidFetcher {
  return async (cid, accept) => {
    const urls = cidFetchUrls(cid, resolverEndpoint);
    let rejected: FetchedCidBytes | null = null;
    for (const [index, url] of urls.entries()) {
      try {
        const response = await fetchImpl(url, {
          cache: "no-store",
          redirect: "follow",
          signal: AbortSignal.timeout(
            index === 0 ? RESOLVER_TIMEOUT_MS : FALLBACK_TIMEOUT_MS
          ),
        });
        if (!response.ok) continue;
        const bytes = await readLimited(response);
        if (bytes === null) continue;
        const host = new URL(url).host;
        if (accept === undefined || accept(bytes)) {
          return { bytes, host, accepted: true };
        }
        rejected ??= { bytes, host, accepted: false };
      } catch {
        // Try the next gateway.
      }
    }
    return rejected;
  };
}

/** Runs `task` over `items` with at most `limit` in flight. */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  task: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await task(items[index] as T, index);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  );
  return results;
}
