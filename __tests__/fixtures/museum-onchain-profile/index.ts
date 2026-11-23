import fs from "node:fs";
import path from "node:path";
import { sha256, type Hex } from "viem";
import { rawCidFromSha256 } from "@/lib/museum/onchain/cid";
import type { ProfileFixture } from "@/lib/museum/onchain/fixture";
import type { CidFetcher } from "@/lib/museum/onchain/ipfs";

/**
 * Fifteen records of the profile-v1 Museum release, as exact payload bytes,
 * and the text one of them names. The registry is the release's placeholder
 * address, which is also what the declaration states.
 */
const ROOT = path.join(__dirname);

export const profileFixture = JSON.parse(
  fs.readFileSync(path.join(ROOT, "records.json"), "utf8")
) as ProfileFixture;

export function fixtureRecord(localId: string) {
  const record = profileFixture.records.find(
    (item) => item.local_id === localId
  );
  if (record === undefined) throw new Error(`no fixture record ${localId}`);
  return record;
}

export function payloadBytes(localId: string): Uint8Array {
  return new Uint8Array(
    fs.readFileSync(path.join(ROOT, "payloads", `${localId}.json`))
  );
}

/** The policies README that 6529NM-DOC-0001 names, as served. */
export const policiesText = new Uint8Array(
  fs.readFileSync(path.join(ROOT, "texts", "policies-README.md"))
);
export const policiesTextCid: Hex = rawCidFromSha256(sha256(policiesText));

/** Every fixture payload by its raw CID, and the policies text. */
export function fixtureStore(): Map<string, Uint8Array> {
  const store = new Map<string, Uint8Array>();
  for (const record of profileFixture.records) {
    store.set(record.rawCid.toLowerCase(), payloadBytes(record.local_id));
  }
  store.set(policiesTextCid.toLowerCase(), policiesText);
  return store;
}

/** A gateway that serves a store and reports whether `accept` took the bytes. */
export function storeFetcher(
  store: ReadonlyMap<string, Uint8Array>
): CidFetcher {
  return async (cid, accept) => {
    const bytes = store.get(cid.toLowerCase());
    if (bytes === undefined) return null;
    return { bytes, host: "media.6529.io", accepted: accept?.(bytes) ?? true };
  };
}
