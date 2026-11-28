import { contentStoreAbi, englishAuctionAbi, independentRegistryAbi } from "./abis";
import {
  decodeAbiParameters,
  encodeAbiParameters,
  getAbiItem,
  hexToBytes,
  type Address,
  type Hex,
} from "viem";

import { getStreamClient } from "./client";
import { getStreamInstance } from "./instances";
import { decodeIndependentMint, encodeIndependentMint, itemHashOf, type MediaFile, type PackageItem } from "./item";
import { mediaDataUrl } from "./content";
import { scanLogs } from "./reads";

/**
 * An Independent Stream work approved by its artist is only a hash on chain,
 * so nobody else could start its sale. The create page therefore also stores
 * the start request itself as a small public file in the content store, under
 * this type. Any page can find it, check that the item is still approved and
 * unused, and offer "Start the sale" to everyone.
 *
 * TEST-PAGE CONVENTION, NOT PROTOCOL. In production the start request will
 * come from the site's backend / Main Stage; only findStartableItems below
 * should need to change. Every stored file is untrusted input: it is decoded
 * defensively, its item hash is recomputed, the item must be approved and
 * unused for that token, and the start call must simulate cleanly. Anything
 * that fails is skipped silently.
 */
export const START_FILE_MIME = "application/vnd.6529.stream-start";

const START_FILE_PARAMS = [{ type: "address" }, { type: "bytes" }] as const;

export function encodeStartFile(token: Address, item: PackageItem, media: readonly MediaFile[]): Uint8Array {
  return hexToBytes(encodeAbiParameters(START_FILE_PARAMS, [token, encodeIndependentMint(item, media)]));
}

export interface PendingStart {
  readonly token: Address;
  readonly item: PackageItem;
  readonly media: readonly MediaFile[];
  /** The encoded IndependentMint, as EnglishAuction.start takes it. */
  readonly request: Hex;
  readonly itemHash: Hex;
}

function decodeStartFile(data: Hex): PendingStart | null {
  try {
    const [token, request] = decodeAbiParameters(START_FILE_PARAMS, data);
    const mint = decodeIndependentMint(request);
    if (!mint) return null;
    return { token, item: mint.item, media: mint.media, request, itemHash: itemHashOf(mint.item) };
  } catch {
    return null;
  }
}

const MANIFEST_REGISTERED = getAbiItem({ abi: contentStoreAbi, name: "ManifestRegistered" });

/** Works their artists approved whose sale nobody has started yet. */
export async function findStartableItems(): Promise<PendingStart[]> {
  const instance = getStreamInstance();
  const client = getStreamClient();
  const manifests = await scanLogs({ address: instance.addresses.contentStore, event: MANIFEST_REGISTERED });
  const startFiles = manifests.filter((log) => log.args.mimeType === START_FILE_MIME && log.args.length <= 8_192n);
  const decoded = await Promise.all(
    startFiles.map(async (log) => {
      const data = await client
        .readContract({
          address: instance.addresses.contentStore,
          abi: contentStoreAbi,
          functionName: "read",
          args: [log.args.fileId, 0n, log.args.length],
        })
        .catch(() => null);
      return data ? decodeStartFile(data) : null;
    })
  );
  const candidates = decoded.filter((entry): entry is PendingStart => entry !== null);
  const approvals = await Promise.all(
    candidates.map((entry) =>
      client
        .readContract({
          address: instance.addresses.independentRegistry,
          abi: independentRegistryAbi,
          functionName: "itemOf",
          args: [entry.token, entry.itemHash],
        })
        .catch(() => null)
    )
  );
  const approved = candidates.filter((_entry, index) => {
    const approval = approvals[index];
    return !!approval && approval.approved && !approval.used;
  });
  // Offer only starts the contract would accept right now.
  const simulated = await Promise.all(
    approved.map((entry) =>
      client
        .simulateContract({
          address: instance.addresses.englishAuction,
          abi: englishAuctionAbi,
          functionName: "start",
          args: [entry.token, entry.request],
        })
        .then(() => true)
        .catch(() => false)
    )
  );
  return approved.filter((_entry, index) => simulated[index]);
}

async function readFileBytes(fileId: Hex, maxBytes: bigint): Promise<{ bytes: Hex; mimeType: string } | null> {
  const instance = getStreamInstance();
  const client = getStreamClient();
  const info = await client
    .readContract({ address: instance.addresses.contentStore, abi: contentStoreAbi, functionName: "fileInfo", args: [fileId] })
    .catch(() => null);
  if (!info || info.length > maxBytes) return null;
  const bytes = await client
    .readContract({
      address: instance.addresses.contentStore,
      abi: contentStoreAbi,
      functionName: "read",
      args: [fileId, 0n, info.length],
    })
    .catch(() => null);
  return bytes ? { bytes, mimeType: info.mimeType } : null;
}

/** The title and picture of a work waiting to start, from its stored record and media. */
export async function readStartPreview(start: PendingStart): Promise<{ title: string | null; image: string | null }> {
  const [record, primary] = await Promise.all([
    readFileBytes(start.item.recordFileId, 16_384n),
    start.media[0] ? readFileBytes(start.media[0].fileId, 262_144n) : Promise.resolve(null),
  ]);
  let title: string | null = null;
  if (record) {
    try {
      const json = JSON.parse(new TextDecoder().decode(hexToBytes(record.bytes))) as { name?: unknown };
      title = typeof json.name === "string" ? json.name : null;
    } catch {
      title = null;
    }
  }
  const image =
    primary?.mimeType.startsWith("image/") ? mediaDataUrl(hexToBytes(primary.bytes), primary.mimeType) : null;
  return { title, image };
}
