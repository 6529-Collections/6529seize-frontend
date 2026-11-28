import { accountsAbi, editionAuctionAbi, englishAuctionAbi, independentEditionAuctionAbi, independentRegistryAbi, streamAbi, workFactsAbi } from "./abis";
import {
  BaseError,
  ContractFunctionRevertedError,
  encodeAbiParameters,
  getAbiItem,
  getAddress,
  parseEventLogs,
  sha256,
  keccak256,
  type AbiEvent,
  type Address,
  type Hex,
  type Log,
} from "viem";

import { getStreamClient, getStreamLogClient } from "./client";
import { mediaDataUrl } from "./content";
import { readVerifiedFile } from "./files";
import { getStreamInstance } from "./instances";
import {
  CURRENCY_ETH,
  itemFromStartCalldata,
  type StartedWork,
} from "./item";
import { isZeroAddress, sameAddress } from "./state";

const LOG_WINDOW = 45_000n;

/** Sale IDs are keccak256(abi.encode(token, tokenId)) on both auctions. */
export function saleIdOf(token: Address, tokenId: bigint): bigint {
  return BigInt(
    keccak256(
      encodeAbiParameters([{ type: "address" }, { type: "uint256" }], [token, tokenId])
    )
  );
}

interface LogCacheEntry {
  to: bigint;
  logs: Log[];
  pending: Promise<Log[]> | null;
  pendingSince: number;
}

/** A scan older than this is abandoned and started again (a hung request must not stall the page). */
const STUCK_SCAN_MS = 45_000;

const logCache = new Map<string, LogCacheEntry>();

/**
 * Every log a contract emitted since the instance's start block, fetched once
 * and then only the new blocks. Testnet volumes are small, so filtering by
 * event and arguments happens locally, which keeps public RPCs within limits.
 */
async function contractLogs(address: Address): Promise<Log[]> {
  const key = address.toLowerCase();
  let entry = logCache.get(key);
  if (!entry) {
    entry = { to: getStreamInstance().startBlock - 1n, logs: [], pending: null, pendingSince: 0 };
    logCache.set(key, entry);
  }
  const current = entry;
  if (current.pending && Date.now() - current.pendingSince > STUCK_SCAN_MS) current.pending = null;
  if (current.pending) return current.pending;
  current.pendingSince = Date.now();
  // Assigned before the first await inside, so the checks below see this scan.
  let scan: Promise<Log[]> | null = null;
  scan = (async () => {
    try {
      const client = getStreamLogClient();
      // A fresh read: viem caches the block number, which could hide the newest block.
      const latest = await client.getBlockNumber({ cacheTime: 0 });
      for (let start = current.to + 1n; start <= latest; start += LOG_WINDOW) {
        const windowEnd = start + LOG_WINDOW - 1n;
        const end = windowEnd > latest ? latest : windowEnd;
        const logs = await client.getLogs({ address, fromBlock: start, toBlock: end });
        // An abandoned scan that finishes late must not add its window twice.
        if (current.pending !== scan || start !== current.to + 1n) break;
        current.logs.push(...(logs as Log[]));
        current.to = end;
      }
      return current.logs;
    } finally {
      if (current.pending === scan) current.pending = null;
    }
  })();
  current.pending = scan;
  return scan;
}

/** One event's logs from a contract, optionally filtered by indexed arguments. */
export async function scanLogs<TEvent extends AbiEvent>(args: {
  readonly address: Address;
  readonly event: TEvent;
  readonly args?: Record<string, unknown> | undefined;
}): Promise<Log<bigint, number, false, TEvent, true>[]> {
  const logs = await contractLogs(args.address);
  return parseEventLogs({
    abi: [args.event] as readonly AbiEvent[],
    logs,
    args: args.args as never,
    strict: true,
  }) as unknown as Log<bigint, number, false, TEvent, true>[];
}

const SALE_STARTED = getAbiItem({ abi: englishAuctionAbi, name: "SaleStarted" });
export const ONE_BID_PLACED = getAbiItem({ abi: englishAuctionAbi, name: "BidPlaced" });
const SALE_SETTLED = getAbiItem({ abi: englishAuctionAbi, name: "SaleSettled" });
const SETTLEMENT_REFUSED = getAbiItem({ abi: englishAuctionAbi, name: "SettlementRefused" });
const RESCUED_SALE_CLOSED = getAbiItem({ abi: englishAuctionAbi, name: "RescuedSaleClosed" });
export const EDITION_BID_PLACED = getAbiItem({ abi: editionAuctionAbi, name: "BidPlaced" });
export const EDITION_BID_RAISED = getAbiItem({ abi: editionAuctionAbi, name: "BidRaised" });
export const EDITION_BID_CLAIMED = getAbiItem({ abi: editionAuctionAbi, name: "BidClaimed" });
export const AUCTION_OPENED = getAbiItem({ abi: editionAuctionAbi, name: "AuctionOpened" });
const AUCTION_CLEARED = getAbiItem({ abi: editionAuctionAbi, name: "AuctionCleared" });

export interface SaleSummary {
  readonly saleId: bigint;
  readonly token: Address;
  readonly tokenId: bigint;
  /** A curated 6529 Stream work (else an artist's own Independent Stream contract). */
  readonly curated: boolean;
  readonly state: number;
  readonly endTime: bigint;
  readonly bid: bigint;
  readonly bidder: Address;
  readonly firstStartTx: Hex;
  readonly startedAt: bigint;
  /** The edition sale's result once it cleared: copies sold and the price each. */
  readonly edition: { readonly count: bigint; readonly price: bigint } | null;
}

/** Cleared edition results, keyed by master token and ID. */
async function editionResults(): Promise<Map<string, { count: bigint; price: bigint }>> {
  const instance = getStreamInstance();
  const results = new Map<string, { count: bigint; price: bigint }>();
  for (const address of [instance.addresses.editionAuction, instance.addresses.independentEditionAuction]) {
    const [opened, cleared] = await Promise.all([
      scanLogs({ address, event: AUCTION_OPENED }),
      scanLogs({ address, event: AUCTION_CLEARED }),
    ]);
    const bySale = new Map(opened.map((log) => [log.args.saleId, log.args]));
    for (const log of cleared) {
      const open = bySale.get(log.args.saleId);
      if (!open || log.args.count === 0n) continue;
      results.set(`${open.master.toLowerCase()}:${open.id}`, { count: log.args.count, price: log.args.price });
    }
  }
  return results;
}

export async function listSales(): Promise<SaleSummary[]> {
  const instance = getStreamInstance();
  const client = getStreamClient();
  const logs = await scanLogs({ address: instance.addresses.englishAuction, event: SALE_STARTED });
  const first = new Map<bigint, (typeof logs)[number]>();
  const last = new Map<bigint, (typeof logs)[number]>();
  for (const log of logs) {
    const saleId = log.args.saleId;
    if (!first.has(saleId)) first.set(saleId, log);
    last.set(saleId, log);
  }
  const saleIds = [...first.keys()];
  const editions = await editionResults();
  const auctions = await Promise.all(
    saleIds.map((saleId) =>
      client.readContract({
        address: instance.addresses.englishAuction,
        abi: englishAuctionAbi,
        functionName: "auction",
        args: [saleId],
      })
    )
  );
  return saleIds.map((saleId, index) => {
    const start = first.get(saleId)!;
    const auction = auctions[index]!;
    return {
      saleId,
      token: start.args.token,
      tokenId: start.args.tokenId,
      curated: sameAddress(start.args.token, instance.addresses.stream),
      state: auction.state,
      endTime: auction.endTime,
      bid: auction.bid,
      bidder: auction.bidder,
      firstStartTx: start.transactionHash,
      startedAt: last.get(saleId)?.args.startTime ?? start.args.startTime,
      edition: editions.get(`${start.args.token.toLowerCase()}:${start.args.tokenId}`) ?? null,
    };
  });
}

interface WorkMeta {
  readonly name: string | null;
  readonly description: string | null;
  readonly image: string | null;
  readonly artistId: bigint;
  /** The artist account's root wallet (see readArtistWallet). */
  readonly artistWallet: Address;
  readonly kind: number;
  readonly owner: Address | null;
}

function parseWorkUri(uri: string): Record<string, unknown> | null {
  const prefix = "data:application/json;utf8,";
  if (!uri.startsWith(prefix)) return null;
  const body = uri
    .slice(prefix.length)
    .replace(/%2[35]/g, (match) => (match === "%23" ? "#" : "%"));
  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function stringField(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** A work's facts, metadata and owner. Missing metadata comes back as nulls. */
export async function readWorkMeta(token: Address, tokenId: bigint): Promise<WorkMeta> {
  const client = getStreamClient();
  const [work, uri, owner] = await Promise.all([
    client.readContract({ address: token, abi: streamAbi, functionName: "workOf", args: [tokenId] }),
    client
      .readContract({ address: token, abi: streamAbi, functionName: "tokenURI", args: [tokenId] })
      .catch(() => null),
    client
      .readContract({ address: token, abi: streamAbi, functionName: "ownerOf", args: [tokenId] })
      .catch(() => null),
  ]);
  const json = uri ? parseWorkUri(uri) : null;
  const image = stringField(json?.["image"]);
  // Without a record the renderer answers placeholder text, flagged by record_status.
  const hasRecord = json !== null && json["record_status"] === undefined;
  return {
    name: stringField(json?.["name"]),
    description: hasRecord ? stringField(json["description"]) : null,
    // On-chain art only: an outside image URL would let a work track its viewers.
    image: image?.startsWith("data:image/") ? image : null,
    artistId: BigInt(work.artistId),
    artistWallet: await readArtistWallet(BigInt(work.artistId)),
    kind: work.kind,
    owner,
  };
}

/** The address an artist ID names (artist IDs are the root wallet as a number). */
/**
 * The wallet to show for an artist ID: the root wallet of that account in
 * Accounts. An ID is a new account's address as a number, but an account keeps
 * its ID when its root wallet changes, so the root is read, not derived. Falls
 * back to the ID as an address only if the account cannot be read.
 */
async function readArtistWallet(artistId: bigint): Promise<Address> {
  const fallback = getAddress(`0x${artistId.toString(16).padStart(40, "0")}`);
  const account = await getStreamClient()
    .readContract({ address: getStreamInstance().addresses.accounts, abi: accountsAbi, functionName: "artist", args: [artistId] })
    .catch(() => null);
  const root = account?.[0].root;
  return root && !isZeroAddress(root) ? root : fallback;
}

/** The item and media a work was minted from, read from its first start transaction. */
export async function readStartItem(
  startTx: Hex,
  curated: boolean
): Promise<StartedWork | null> {
  const tx = await getStreamClient().getTransaction({ hash: startTx });
  return itemFromStartCalldata(tx.input, curated);
}

export interface OneOfOneBid {
  readonly bidder: Address;
  readonly amount: bigint;
  readonly endTime: bigint;
  readonly blockNumber: bigint;
  readonly transactionHash: Hex;
}

export interface OneOfOneSettlement {
  readonly buyer: Address;
  readonly price: bigint;
  readonly transactionHash: Hex;
}

export interface OneOfOneDetail {
  readonly saleId: bigint;
  readonly auction: {
    readonly token: Address;
    readonly tokenId: bigint;
    readonly seller: Address;
    readonly feeShare: bigint;
    readonly bidder: Address;
    readonly recipient: Address;
    readonly bid: bigint;
    readonly endTime: bigint;
    readonly pausedAt: bigint;
    readonly state: number;
  };
  readonly restartedAt: bigint;
  readonly minimumBid: bigint | null;
  readonly pendingDelivery: Address;
  readonly refusableAt: bigint;
  readonly duration: number;
  readonly extensionWindow: number;
  readonly restartDelay: number;
  readonly contractPaused: boolean;
  readonly bids: readonly OneOfOneBid[];
  readonly settlement: OneOfOneSettlement | null;
  readonly firstStartTx: Hex | null;
  /** How the latest run ended without a buyer, when it was not simply unbid. */
  readonly closedHow: "refused" | "rescued" | null;
}

export async function readOneOfOne(token: Address, tokenId: bigint): Promise<OneOfOneDetail> {
  const instance = getStreamInstance();
  const client = getStreamClient();
  const address = instance.addresses.englishAuction;
  const saleId = saleIdOf(token, tokenId);
  const read = <T>(functionName: string, args: readonly unknown[] = []): Promise<T> =>
    client.readContract({
      address,
      abi: englishAuctionAbi,
      functionName: functionName as never,
      args: args as never,
    }) as Promise<T>;
  const [auction, clock, minimumBid, pendingDelivery, refusableAt, config, paused, restartDelay] =
    await Promise.all([
      read<OneOfOneDetail["auction"]>("auction", [saleId]),
      read<readonly [number, bigint, bigint, bigint]>("auctionClock", [saleId]),
      read<bigint>("minimumBid", [saleId]).catch(() => null),
      read<Address>("pendingDelivery", [saleId]),
      read<bigint>("refusableAt", [saleId]).catch(() => 0n),
      read<{ duration: number; extensionWindow: number }>("config"),
      read<boolean>("paused"),
      read<bigint>("RESTART_DELAY"),
    ]);
  const [bidLogs, settleLogs, startLogs, refusedLogs, rescuedLogs] = await Promise.all([
    scanLogs({ address, event: ONE_BID_PLACED, args: { saleId } }),
    scanLogs({ address, event: SALE_SETTLED, args: { saleId } }),
    scanLogs({ address, event: SALE_STARTED, args: { saleId } }),
    scanLogs({ address, event: SETTLEMENT_REFUSED, args: { saleId } }),
    scanLogs({ address, event: RESCUED_SALE_CLOSED, args: { saleId } }),
  ]);
  const lastSettle = settleLogs.at(-1);
  // Bids of the latest run only: a restart starts a fresh sale under the same ID.
  const lastStartBlock = startLogs.at(-1)?.blockNumber ?? 0n;
  return {
    saleId,
    auction,
    restartedAt: clock[3],
    minimumBid,
    pendingDelivery,
    refusableAt,
    duration: config.duration,
    extensionWindow: config.extensionWindow,
    restartDelay: Number(restartDelay),
    contractPaused: paused,
    bids: bidLogs
      .filter((log) => log.blockNumber >= lastStartBlock)
      .map((log) => ({
        bidder: log.args.bidder,
        amount: log.args.amount,
        endTime: log.args.endTime,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
      }))
      .reverse(),
    settlement:
      lastSettle && lastSettle.blockNumber >= lastStartBlock
        ? {
            buyer: lastSettle.args.buyer,
            price: lastSettle.args.price,
            transactionHash: lastSettle.transactionHash,
          }
        : null,
    firstStartTx: startLogs[0]?.transactionHash ?? null,
    closedHow: closedHow(refusedLogs, rescuedLogs, lastStartBlock),
  };
}

/** How a sale that ended without a buyer closed, counting only events since its latest start. */
export function closedHow(
  refused: readonly { blockNumber: bigint }[],
  rescued: readonly { blockNumber: bigint }[],
  sinceBlock: bigint
): "refused" | "rescued" | null {
  if (rescued.some((log) => log.blockNumber >= sinceBlock)) return "rescued";
  if (refused.some((log) => log.blockNumber >= sinceBlock)) return "refused";
  return null;
}

/** The editions contract that partners a 1/1 contract, or null. */
async function editionsTokenFor(token: Address): Promise<Address | null> {
  const instance = getStreamInstance();
  if (sameAddress(token, instance.addresses.stream)) return instance.addresses.streamEditions;
  const listing = await getStreamClient().readContract({
    address: instance.addresses.independentRegistry,
    abi: independentRegistryAbi,
    functionName: "listingOf",
    args: [token],
  });
  return isZeroAddress(listing.partner) ? null : listing.partner;
}

export interface EditionBidRow {
  readonly bidId: bigint;
  readonly bidder: Address;
  readonly step: number;
  readonly quantity: number;
  /** Deleted once claimed. */
  readonly claimed: boolean;
  readonly unitsWon: bigint | null;
  readonly refund: bigint | null;
}

const NOT_OPENED: EditionDetail["sale"] = {
  status: 0,
  maxCount: 0,
  terms: { basePrice: 0n, marginShare: 0, softWindow: 0 },
  feeShare: 0,
  bidCount: 0,
  liveUnits: 0,
};

export interface EditionDetail {
  readonly auctionAddress: Address;
  readonly editionsToken: Address;
  readonly saleId: bigint;
  readonly sale: {
    readonly status: number;
    readonly maxCount: number;
    readonly terms: {
      readonly basePrice: bigint;
      readonly marginShare: number;
      readonly softWindow: number;
    };
    readonly feeShare: number;
    readonly bidCount: number;
    readonly liveUnits: number;
  };
  readonly endTimes: {
    readonly oneOfOneEnd: bigint;
    readonly closeAt: bigint;
    readonly softEnd: bigint;
    readonly endTime: bigint;
    readonly oneOfOneState: number;
    readonly biddingOpen: boolean;
  };
  readonly clearing: {
    readonly count: bigint;
    readonly step: bigint;
    readonly price: bigint;
    readonly revenue: bigint;
    readonly networkFee: bigint;
    readonly rationed: boolean;
  } | null;
  readonly prices: readonly bigint[];
  readonly unitsByStep: readonly bigint[];
  readonly lowStep: number;
  readonly abandonable: boolean;
  readonly contractPaused: boolean;
  readonly bids: readonly EditionBidRow[];
}

/**
 * Whether an edition sale was opened. The lens reverts with UnknownAuction for
 * a sale that does not exist instead of answering status NONE.
 */
export async function editionSaleExists(address: Address, saleId: bigint): Promise<boolean> {
  const sale = await getStreamClient()
    .readContract({ address, abi: editionAuctionAbi, functionName: "auction", args: [saleId] })
    .catch((error: unknown) => {
      if (error instanceof BaseError && error.walk((cause) => cause instanceof ContractFunctionRevertedError)) {
        return null;
      }
      throw error;
    });
  return sale !== null && sale.status !== 0;
}

export async function readEdition(
  oneOfOneToken: Address,
  tokenId: bigint
): Promise<EditionDetail | null> {
  const instance = getStreamInstance();
  const client = getStreamClient();
  const editionsToken = await editionsTokenFor(oneOfOneToken);
  if (!editionsToken) return null;
  const curated = sameAddress(oneOfOneToken, instance.addresses.stream);
  const address = curated
    ? instance.addresses.editionAuction
    : instance.addresses.independentEditionAuction;
  const saleId = saleIdOf(editionsToken, tokenId);
  const read = <T>(functionName: string, args: readonly unknown[] = [saleId]): Promise<T> =>
    client.readContract({
      address,
      abi: editionAuctionAbi,
      functionName: functionName as never,
      args: args as never,
    }) as Promise<T>;
  const sale = await read<EditionDetail["sale"]>("auction").catch((error: unknown) => {
    // Not opened yet: the lens reverts with UnknownAuction.
    if (error instanceof BaseError && error.walk((cause) => cause instanceof ContractFunctionRevertedError)) {
      return NOT_OPENED;
    }
    throw error;
  });
  const base = {
    auctionAddress: address,
    editionsToken,
    saleId,
  };
  if (sale.status === 0) {
    return {
      ...base,
      sale,
      endTimes: {
        oneOfOneEnd: 0n,
        closeAt: 0n,
        softEnd: 0n,
        endTime: 0n,
        oneOfOneState: 0,
        biddingOpen: false,
      },
      clearing: null,
      prices: [],
      unitsByStep: [],
      lowStep: 0,
      abandonable: false,
      contractPaused: await read<boolean>("paused", []),
      bids: [],
    };
  }
  const [endTimes, clearing, prices, totals, abandonable, paused, placed, raised, claimed] =
    await Promise.all([
      read<EditionDetail["endTimes"]>("endTimes"),
      read<NonNullable<EditionDetail["clearing"]>>("clearing").catch(() => null),
      read<readonly bigint[]>("ladder"),
      read<readonly [bigint, readonly bigint[]]>("stepTotals"),
      read<readonly [boolean, bigint]>("abandonable"),
      read<boolean>("paused", []),
      scanLogs({ address, event: EDITION_BID_PLACED, args: { saleId } }),
      scanLogs({ address, event: EDITION_BID_RAISED, args: { saleId } }),
      scanLogs({ address, event: EDITION_BID_CLAIMED, args: { saleId } }),
    ]);
  const stepOf = new Map<bigint, number>();
  const rows = new Map<bigint, { bidder: Address; step: number; quantity: number }>();
  for (const log of placed) {
    rows.set(log.args.bidId, {
      bidder: log.args.bidder,
      step: Number(log.args.step),
      quantity: Number(log.args.quantity),
    });
  }
  for (const log of raised) stepOf.set(log.args.bidId, Number(log.args.toStep));
  const claims = new Map(claimed.map((log) => [log.args.bidId, log.args]));
  const bids: EditionBidRow[] = [...rows.entries()].map(([bidId, row]) => {
    const claim = claims.get(bidId);
    return {
      bidId,
      bidder: row.bidder,
      step: stepOf.get(bidId) ?? row.step,
      quantity: row.quantity,
      claimed: !!claim,
      unitsWon: claim ? claim.unitsWon : null,
      refund: claim ? claim.refund : null,
    };
  });
  return {
    ...base,
    sale,
    endTimes,
    clearing,
    prices,
    lowStep: Number(totals[0]),
    unitsByStep: totals[1],
    abandonable: abandonable[0],
    contractPaused: paused,
    bids,
  };
}

/** What a bid would win if placed now, from `quote(saleId, step, quantity)`. */
export function quoteEditionBid(
  address: Address,
  saleId: bigint,
  step: number,
  quantity: number
) {
  return getStreamClient().readContract({
    address,
    abi: editionAuctionAbi,
    functionName: "quote",
    args: [saleId, BigInt(step), BigInt(quantity)],
  });
}

/** ETH the viewer can withdraw now from each auction. */
export async function readClaimable(viewer: Address) {
  const instance = getStreamInstance();
  const client = getStreamClient();
  const [english, edition, independentEdition] = await Promise.all([
    client.readContract({
      address: instance.addresses.englishAuction,
      abi: englishAuctionAbi,
      functionName: "claimable",
      args: [viewer],
    }),
    client.readContract({
      address: instance.addresses.editionAuction,
      abi: editionAuctionAbi,
      functionName: "claimable",
      args: [viewer, CURRENCY_ETH],
    }),
    client.readContract({
      address: instance.addresses.independentEditionAuction,
      abi: independentEditionAuctionAbi,
      functionName: "claimable",
      args: [viewer, CURRENCY_ETH],
    }),
  ]);
  return { english, edition, independentEdition };
}

/**
 * A work's picture as a data URL: the metadata's image when the renderer
 * inlines it, else the primary file read straight from the content store.
 */
export async function readWorkArt(args: {
  readonly token: Address;
  readonly tokenId: bigint;
  readonly meta: WorkMeta;
  readonly firstStartTx: Hex | null;
  readonly curated: boolean;
}): Promise<string | null> {
  if (args.meta.image) return args.meta.image;
  const instance = getStreamInstance();
  const client = getStreamClient();
  // The work record holds the media list once it is open; before that, the start transaction does.
  const facts = await client
    .readContract({
      address: instance.addresses.workFacts,
      abi: workFactsAbi,
      functionName: "factsOf",
      args: [args.token, args.tokenId],
    })
    .catch(() => null);
  let primary = facts?.opened ? facts.media[0] : undefined;
  if (!primary && args.firstStartTx) {
    const started = await readStartItem(args.firstStartTx, args.curated).catch(() => null);
    primary = started?.media[0];
  }
  if (!primary) return null;
  // Shown only if the bytes hash to what the store recorded, and that hash is this token's
  // content on its own contract (a content hash mints once), so no other file can stand in.
  const file = await readVerifiedFile({ fileId: primary.fileId, maxBytes: 262_144n });
  if (!file?.mimeType.startsWith("image/")) return null;
  const ownToken = await client
    .readContract({ address: args.token, abi: streamAbi, functionName: "tokenOfContent", args: [sha256(file.bytes)] })
    .catch(() => null);
  if (ownToken !== args.tokenId) return null;
  return mediaDataUrl(file.bytes, file.mimeType);
}
