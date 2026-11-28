import { hexToBytes, sha256, type Hex } from "viem";

import { contentStoreAbi } from "./abis";
import { getStreamClient } from "./client";
import { getStreamInstance } from "./instances";

/** Stored as the bytes are (no gzip or base64). The pages only show such files. */
const ENCODING_IDENTITY = 0;

/**
 * Reads a file from the content store and checks it before anyone sees it:
 * its SHA-256 must equal the hash the store recorded for it and, when given,
 * the hash the work committed to. Anything that does not match, or is larger
 * than `maxBytes`, comes back as null (shown as "no image").
 */
export async function readVerifiedFile(args: {
  readonly fileId: Hex;
  readonly maxBytes: bigint;
  /** The hash the work's item or record names for this file. */
  readonly expectedSha256?: Hex | undefined;
}): Promise<{ bytes: Uint8Array; mimeType: string } | null> {
  const client = getStreamClient();
  const store = getStreamInstance().addresses.contentStore;
  const info = await client
    .readContract({ address: store, abi: contentStoreAbi, functionName: "fileInfo", args: [args.fileId] })
    .catch(() => null);
  if (!info || info.length > args.maxBytes || info.encoding !== ENCODING_IDENTITY) return null;
  const raw = await client
    .readContract({ address: store, abi: contentStoreAbi, functionName: "read", args: [args.fileId, 0n, info.length] })
    .catch(() => null);
  if (!raw) return null;
  const bytes = hexToBytes(raw);
  const digest = sha256(bytes);
  if (digest !== info.sha256Hash) return null;
  if (args.expectedSha256 && digest !== args.expectedSha256) return null;
  return { bytes, mimeType: info.mimeType };
}
