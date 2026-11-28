import { sha256, type Address, type Hex } from "viem";

import { contentStoreAbi, splitLedgerAbi, streamAbi, workFactsAbi } from "./abis";
import { getStreamClient } from "./client";
import { getStreamInstance } from "./instances";
import { itemHashOf, ZERO_HASH, type PackageItem } from "./item";
import { readArtistWallet, readStartItem } from "./reads";

/**
 * A work's permanent facts for its page, in the shape of the 6529 Stream SDK's
 * `readWorkPage` (6529-stream-sdk `src/reads/workPage.ts`). It is a thin
 * adapter: when the site switches to the SDK, this file is the one replaced.
 * Every part carries the contract and function it was read from.
 */

/** `Outcome` (CoreTypes.sol): how a 1/1's first sale ended, as the token records it. */
const OUTCOME_NAMES = ["none", "sold", "unsold", "rescued"] as const;
type FirstSaleOutcome = (typeof OUTCOME_NAMES)[number] | "unknown";

/** `FileRole` (ContentTypes.sol). An unknown role is treated as auxiliary. */
const FILE_ROLE_NAMES = ["primary", "preview", "auxiliary"] as const;

interface FactSource {
  readonly contract: string;
  readonly address: Address;
  readonly reads: string;
  /** The Solidity file at the instance's deployed commit. */
  readonly url: string;
}

interface WorkPageFile {
  readonly fileId: Hex;
  readonly role: (typeof FILE_ROLE_NAMES)[number];
  readonly mimeType: string;
  readonly length: bigint;
  /** The SHA-256 the content store recorded. */
  readonly sha256: Hex;
  /**
   * "verified": the stored bytes hash to it; "notStored": registered only (served off chain);
   * "incomplete": registered, but not every chunk is stored yet; "mismatch": they do not;
   * "unread": large, encoded or unreadable, not checked here.
   */
  readonly check: "verified" | "notStored" | "incomplete" | "mismatch" | "unread";
}

export interface WorkPageFacts {
  readonly itemHash: Hex;
  readonly artistId: bigint;
  readonly collection: { readonly id: bigint; readonly name: string };
  readonly serial: number;
  readonly editionMaster: boolean;
  readonly firstSale: FirstSaleOutcome;
  readonly royalty: { readonly receiver: Address; readonly percent: number; readonly locked: boolean };
  readonly record: { readonly opened: boolean; readonly finalized: boolean; readonly onChainComplete: boolean; readonly fileId: Hex };
  readonly license: { readonly spdxId: string; readonly textFileId: Hex; readonly locked: boolean } | null;
  readonly files: readonly WorkPageFile[];
  /** The seller vault and the item's payees; null unless the item is proven to be this work's. */
  readonly split: {
    readonly vault: Address;
    readonly payees: readonly {
      readonly artistId: bigint;
      /** The payee's `account` field as the item records it (not a person). */
      readonly account: Address;
      /** The root wallet of the payee's artist account (Accounts), the person paid. */
      readonly wallet: Address;
      readonly percent: number;
    }[];
  } | null;
  readonly checks: {
    /** The item found in the start transaction hashes to the item hash the token stores. */
    readonly itemMatchesToken: boolean | null;
  };
  readonly sources: Readonly<Record<"work" | "record" | "files" | "split", FactSource>>;
}

const SHARE_DENOMINATOR = 100_000;
/** Files above this are listed with their recorded hash but not fetched to check. */
const MAX_CHECKED_BYTES = 262_144n;

function sourceUrl(path: string): string {
  return `https://github.com/6529-Collections/6529-stream/blob/${getStreamInstance().sourceCommit}/${path}`;
}

async function readFile(fileId: Hex, role: number): Promise<WorkPageFile> {
  const client = getStreamClient();
  const store = getStreamInstance().addresses.contentStore;
  const info = await client.readContract({ address: store, abi: contentStoreAbi, functionName: "fileInfo", args: [fileId] });
  const base = {
    fileId,
    role: FILE_ROLE_NAMES[role] ?? "auxiliary",
    mimeType: info.mimeType,
    length: info.length,
    sha256: info.sha256Hash,
  } as const;
  if (info.chunkCount === 0n) return { ...base, check: "notStored" };
  const complete = await client
    .readContract({ address: store, abi: contentStoreAbi, functionName: "isComplete", args: [fileId] })
    .catch(() => null);
  if (complete === false) return { ...base, check: "incomplete" };
  if (info.length > MAX_CHECKED_BYTES || info.encoding !== 0) return { ...base, check: "unread" };
  const bytes = await client
    .readContract({ address: store, abi: contentStoreAbi, functionName: "read", args: [fileId, 0n, info.length] })
    .catch(() => null);
  if (!bytes) return { ...base, check: "unread" };
  return { ...base, check: sha256(bytes) === info.sha256Hash ? "verified" : "mismatch" };
}

async function readSplit(item: PackageItem) {
  const vault = await getStreamClient().readContract({
    address: getStreamInstance().addresses.splitLedger,
    abi: splitLedgerAbi,
    functionName: "walletFor",
    args: [item.payees, ZERO_HASH],
  });
  const wallets = await Promise.all(item.payees.map((payee) => readArtistWallet(payee.artistId)));
  return {
    vault,
    payees: item.payees.map((payee, index) => ({
      artistId: payee.artistId,
      account: payee.account,
      wallet: wallets[index]!,
      percent: (payee.share / SHARE_DENOMINATOR) * 100,
    })),
  };
}

export async function readWorkPageFacts(args: {
  readonly token: Address;
  readonly tokenId: bigint;
  readonly firstStartTx: Hex | null;
  readonly curated: boolean;
}): Promise<WorkPageFacts> {
  const instance = getStreamInstance();
  const client = getStreamClient();
  const [work, facts] = await Promise.all([
    client.readContract({ address: args.token, abi: streamAbi, functionName: "workOf", args: [args.tokenId] }),
    client.readContract({ address: instance.addresses.workFacts, abi: workFactsAbi, functionName: "factsOf", args: [args.token, args.tokenId] }),
  ]);
  const [collection, files, started] = await Promise.all([
    client.readContract({ address: args.token, abi: streamAbi, functionName: "collectionOf", args: [BigInt(work.collectionId)] }),
    Promise.all(facts.media.map((file) => readFile(file.fileId, file.role).catch(() => null))),
    args.firstStartTx ? readStartItem(args.firstStartTx, args.curated).catch(() => null) : Promise.resolve(null),
  ]);
  const itemMatchesToken = started ? itemHashOf(started.item) === work.itemHash : null;
  // The split is shown only from an item that is proven to be this work's.
  const split = started && itemMatchesToken ? await readSplit(started.item).catch(() => null) : null;
  return {
    itemHash: work.itemHash,
    artistId: BigInt(work.artistId),
    collection: { id: BigInt(work.collectionId), name: collection.name },
    serial: Number(work.serial),
    editionMaster: work.kind === 1,
    firstSale: OUTCOME_NAMES[work.outcome] ?? "unknown",
    royalty: {
      receiver: work.royaltyReceiver,
      percent: (Number(work.royaltyRate) / SHARE_DENOMINATOR) * 100,
      locked: work.royaltyRateLocked,
    },
    record: { opened: facts.opened, finalized: facts.finalized, onChainComplete: facts.onChainComplete, fileId: facts.recordFileId },
    license: facts.opened ? { spdxId: facts.licenseId, textFileId: facts.licenseTextFileId, locked: facts.licenseLocked } : null,
    files: files.filter((file): file is WorkPageFile => file !== null),
    split,
    checks: { itemMatchesToken },
    sources: {
      work: {
        contract: args.curated ? "Stream6529" : "Independent Stream contract",
        address: args.token,
        reads: "workOf, collectionOf",
        url: sourceUrl("src/core/StreamBase.sol"),
      },
      record: { contract: "StreamWorkFacts6529", address: instance.addresses.workFacts, reads: "factsOf", url: sourceUrl("src/core/StreamWorkFacts6529.sol") },
      files: { contract: "ContentStore", address: instance.addresses.contentStore, reads: "fileInfo, isComplete, read", url: sourceUrl("src/content/ContentStore.sol") },
      split: { contract: "SplitLedger", address: instance.addresses.splitLedger, reads: "walletFor (payees named from Accounts.artist)", url: sourceUrl("src/economics/SplitLedger.sol") },
    },
  };
}
