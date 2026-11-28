// Copied from 6529-Collections/6529-provenance-app src/locations.ts at commit 906377e17438133e8a61f154edf9c6a5792b9f3f.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
// SPDX-License-Identifier: Apache-2.0
import type { Hex } from "viem";
import { cidToString } from "./cid";

/**
 * A locations file tells the batch verifier where to fetch content that is not on IPFS or
 * Arweave, or not pinned there. It is JSON in one of two forms:
 *
 *   { "template": "https://host/records/{subjectId}.json", "pointer": "/payload" }
 *   { "base": "https://host/", "entries": { "<subject ID or digest>": "path" | { "url": "path", "pointer": "/payload" } } }
 *
 * A template may use {subjectId}, {digest}, {cid} and {version}. Relative entry URLs resolve
 * against "base". The file only says where to look: every fetched byte is still checked against
 * the registry's digest, so a wrong or hostile locations file can cause mismatches, never a false
 * match.
 */
export interface Location {
  url: string;
  pointer?: string | undefined;
}

export interface LocationTarget {
  subjectId: Hex;
  digest: Hex;
  cid: Hex;
  version: number;
}

export type Resolver = (t: LocationTarget) => Location | undefined;

interface Entry {
  url: string;
  pointer?: string | undefined;
}

export function parseLocations(text: string): {
  resolve: Resolver;
  count: number;
  description?: string | undefined;
} {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (e) {
    throw new Error(`The locations file is not JSON: ${(e as Error).message}`, { cause: e });
  }
  if (!json || typeof json !== "object" || Array.isArray(json))
    throw new Error("The locations file is a JSON object.");
  const o = json as {
    description?: unknown;
    pointer?: unknown;
    template?: unknown;
    entries?: unknown;
    base?: unknown;
  };
  const description = typeof o.description === "string" ? o.description : undefined;
  const defaultPointer = typeof o.pointer === "string" ? o.pointer : undefined;

  if (typeof o.template === "string") {
    const template = o.template;
    if (!/^https?:\/\//.test(template)) throw new Error("A template is an http or https URL.");
    return {
      count: Infinity,
      description,
      resolve: (t) => ({
        url: template
          .replaceAll("{subjectId}", t.subjectId)
          .replaceAll("{digest}", t.digest)
          .replaceAll("{version}", String(t.version))
          .replaceAll("{cid}", t.cid && t.cid !== "0x" ? cidToString(t.cid) : ""),
        pointer: defaultPointer,
      }),
    };
  }

  if (!o.entries || typeof o.entries !== "object")
    throw new Error('The locations file needs "template" or "entries".');
  const base = typeof o.base === "string" ? o.base : undefined;
  const map = new Map<string, Entry>();
  for (const [k, v] of Object.entries(o.entries as Record<string, unknown>)) {
    if (!/^0x[0-9a-fA-F]{64}$/.test(k))
      throw new Error(`Entry key ${k} is not a 32-byte hex subject ID or digest.`);
    let entry: Entry;
    if (typeof v === "string") entry = { url: v, pointer: defaultPointer };
    else if (v && typeof v === "object" && typeof (v as Entry).url === "string") {
      entry = { url: (v as Entry).url, pointer: (v as Entry).pointer ?? defaultPointer };
    } else throw new Error(`Entry ${k} is a URL or an object with "url".`);
    const url = base ? new URL(entry.url, base).toString() : entry.url;
    if (!/^https?:\/\//.test(url)) throw new Error(`Entry ${k} does not resolve to an http or https URL.`);
    map.set(k.toLowerCase(), { ...entry, url });
  }
  return {
    count: map.size,
    description,
    resolve: (t) => map.get(t.digest.toLowerCase()) ?? map.get(t.subjectId.toLowerCase()),
  };
}

/** Picks n items spread evenly across a list, keeping the first and last, for a sample check. */
export function spreadSample<T>(items: readonly T[], n: number): T[] {
  if (n >= items.length) return [...items];
  if (n <= 0) return [];
  if (n === 1) return [items[0]!];
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(items[Math.round((i * (items.length - 1)) / (n - 1))]!);
  return out;
}
