// Copied from 6529-Collections/6529-provenance-app src/fetchContent.ts at commit a01790eb709958ed2367e1fd4345a4c559b08330.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
import { arweaveIdToString, cidToString } from "./cid";
import type { Hex } from "viem";

/**
 * Tried in order. 6529's gateways come first: 6529 pins the content of its registries, each as a
 * single raw block, so the CID in the registry resolves there. Public gateways follow for content
 * pinned elsewhere. Every gateway is untrusted: the bytes are checked against the chain.
 */
export const DEFAULT_IPFS_GATEWAYS = [
  "https://media.6529.io",
  "https://ipfs.6529.io",
  "https://ipfs.io",
  "https://dweb.link",
];
export const DEFAULT_ARWEAVE_GATEWAYS = ["https://arweave.net"];

/** The app refuses content larger than this, so a hostile host cannot exhaust the tab's memory. */
export const MAX_CONTENT_BYTES = 32 * 1024 * 1024;

export interface FetchAttempt {
  url: string;
  ok: boolean;
  status?: number | undefined;
  error?: string | undefined;
}

export interface Fetched {
  bytes: Uint8Array;
  url: string;
  attempts: FetchAttempt[];
}

export async function fetchBytes(
  url: string,
  timeoutMs = 20000,
  maxBytes = MAX_CONTENT_BYTES,
): Promise<Uint8Array> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: "follow", credentials: "omit" });
    if (!res.ok) throw new HttpError(res.status, `HTTP ${res.status}`);
    const declared = Number(res.headers.get("content-length") ?? "0");
    if (declared > maxBytes) throw new Error(`${declared} bytes is over the ${maxBytes}-byte limit`);
    if (!res.body) return new Uint8Array(await res.arrayBuffer());
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error(`over the ${maxBytes}-byte limit`);
      }
      chunks.push(value);
    }
    const out = new Uint8Array(total);
    let off = 0;
    for (const c of chunks) {
      out.set(c, off);
      off += c.length;
    }
    return out;
  } catch (e) {
    if ((e as Error).name === "AbortError") throw new Error(`no answer in ${timeoutMs / 1000} s`);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function ipfsUrls(cid: Hex, gateways: readonly string[]): string[] {
  const text = cidToString(cid);
  return gateways.map((g) => `${g.replace(/\/+$/, "")}/ipfs/${text}`);
}

export function arweaveUrls(id: Hex, gateways: readonly string[]): string[] {
  const text = arweaveIdToString(id);
  return gateways.map((g) => `${g.replace(/\/+$/, "")}/${text}`);
}

/** Tries each URL in order and returns the first body. Every failure is kept for display. */
export async function fetchFirst(urls: readonly string[], timeoutMs?: number): Promise<Fetched> {
  const attempts: FetchAttempt[] = [];
  for (const url of urls) {
    try {
      const bytes = await fetchBytes(url, timeoutMs);
      attempts.push({ url, ok: true, status: 200 });
      return { bytes, url, attempts };
    } catch (e) {
      attempts.push({
        url,
        ok: false,
        status: e instanceof HttpError ? e.status : undefined,
        error: (e as Error).message,
      });
    }
  }
  throw Object.assign(new Error("No location returned the content."), { attempts });
}

export interface ContentSource {
  cid?: Hex | undefined;
  arweaveId?: Hex | undefined;
}

export interface FetchContentOptions {
  ipfsGateways?: readonly string[];
  arweaveGateways?: readonly string[];
  /** Last resort, for content that is not pinned: a URL from a locations file. */
  fallbackUrl?: string;
  timeoutMs?: number;
}

/**
 * Fetches a version's content by its own locations: the CID through the IPFS gateways first, then
 * the Arweave ID, then a fallback URL. A deleted version has neither location in state, so only a
 * fallback URL can fetch it.
 */
export async function fetchContent(source: ContentSource, o: FetchContentOptions = {}): Promise<Fetched> {
  const urls: string[] = [];
  if (source.cid && source.cid !== "0x")
    urls.push(...ipfsUrls(source.cid, o.ipfsGateways ?? DEFAULT_IPFS_GATEWAYS));
  if (source.arweaveId && !/^0x0*$/.test(source.arweaveId)) {
    urls.push(...arweaveUrls(source.arweaveId, o.arweaveGateways ?? DEFAULT_ARWEAVE_GATEWAYS));
  }
  if (o.fallbackUrl) urls.push(o.fallbackUrl);
  if (!urls.length)
    throw Object.assign(new Error("The version has no CID or Arweave ID, and no fallback URL was given."), {
      attempts: [],
    });
  return fetchFirst(urls, o.timeoutMs);
}
