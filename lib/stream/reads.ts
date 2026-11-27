import {
  BaseError,
  ContractFunctionRevertedError,
  encodeAbiParameters,
  getAbiItem,
  getAddress,
  parseEventLogs,
  hexToBytes,
  keccak256,
  type AbiEvent,
  type Address,
  type Hex,
  type Log,
} from "viem";

import { contentStoreAbi } from "./generated/ContentStore";
import { editionAuctionAbi } from "./generated/UniformEditionAuction";
import { englishAuctionAbi } from "./generated/EnglishAuction";
import { independentRegistryAbi } from "./generated/IndependentStreamRegistry";
import { independentDeployerAbi } from "./generated/IndependentStreamDeployer";
import { streamAbi } from "./generated/Stream6529";
import { streamEditionsAbi } from "./generated/StreamEditions6529";
import { splitLedgerAbi } from "./generated/SplitLedger";
import { getStreamClient, getStreamLogClient } from "./client";
import { mediaDataUrl } from "./content";
import { getStreamInstance } from "./instances";
import {
  CURRENCY_ETH,
  itemFromStartCalldata,
  ZERO_HASH,
  type MediaFile,
  type PackageItem,
} from "./item";
import { isZeroAddress, sameAddress, ZERO_ADDRESS } from "./state";

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
}

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
    entry = { to: getStreamInstance().startBlock - 1n, logs: [], pending: null };
    logCache.set(key, entry);
  }
  const current = entry;
  current.pending ??= (async () => {
    try {
      const client = getStreamLogClient();
      const latest = await client.getBlockNumber();
      for (let start = current.to + 1n; start <= latest; start += LOG_WINDOW) {
        const end = start + LOG_WINDOW - 1n > latest ? latest : start + LOG_WINDOW - 1n;
        const logs = await client.getLogs({ address, fromBlock: start, toBlock: end });
        current.logs.push(...(logs as Log[]));
        current.to = end;
      }
      return current.logs;
    } finally {
      current.pending = null;
    }
  })();
  return current.pending;
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
const ONE_BID_PLACED = getAbiItem({ abi: englishAuctionAbi, name: "BidPlaced" });
const SALE_SETTLED = getAbiItem({ abi: englishAuctionAbi, name: "SaleSettled" });
const EDITION_BID_PLACED = getAbiItem({ abi: editionAuctionAbi, name: "BidPlaced" });
const EDITION_BID_RAISED = getAbiItem({ abi: editionAuctionAbi, name: "BidRaised" });
const EDITION_BID_CLAIMED = getAbiItem({ abi: editionAuctionAbi, name: "BidClaimed" });
const AUCTION_OPENED = getAbiItem({ abi: editionAuctionAbi, name: "AuctionOpened" });
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

export interface WorkMeta {
  readonly name: string | null;
  readonly description: string | null;
  readonly image: string | null;
  readonly artistId: bigint;
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
    image: image && /^(data:image\/|https:\/\/)/.test(image) ? image : null,
    artistId: BigInt(work.artistId),
    kind: work.kind,
    owner,
  };
}

/** The address an artist ID names (artist IDs are the root wallet as a number). */
export function artistAddress(artistId: bigint): Address {
  return getAddress(`0x${artistId.toString(16).padStart(40, "0")}`);
}

/** The item and media a work was minted from, read from its first start transaction. */
export async function readStartItem(
  startTx: Hex,
  curated: boolean
): Promise<{ item: PackageItem; media: readonly MediaFile[] } | null> {
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
  const [bidLogs, settleLogs, startLogs] = await Promise.all([
    scanLogs({ address, event: ONE_BID_PLACED, args: { saleId } }),
    scanLogs({ address, event: SALE_SETTLED, args: { saleId } }),
    scanLogs({ address, event: SALE_STARTED, args: { saleId } }),
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
  };
}

/** The editions contract that partners a 1/1 contract, or null. */
export async function editionsTokenFor(token: Address): Promise<Address | null> {
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
export async function quoteEditionBid(
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
      abi: editionAuctionAbi,
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
  readonly meta: WorkMeta;
  readonly firstStartTx: Hex | null;
  readonly curated: boolean;
}): Promise<string | null> {
  if (args.meta.image) return args.meta.image;
  if (!args.firstStartTx) return null;
  const started = await readStartItem(args.firstStartTx, args.curated).catch(() => null);
  const primary = started?.media[0];
  if (!primary) return null;
  const instance = getStreamInstance();
  const client = getStreamClient();
  const info = await client
    .readContract({
      address: instance.addresses.contentStore,
      abi: contentStoreAbi,
      functionName: "fileInfo",
      args: [primary.fileId],
    })
    .catch(() => null);
  if (!info || !/^image\//.test(info.mimeType) || info.length > 262_144n) return null;
  const bytes = await client
    .readContract({
      address: instance.addresses.contentStore,
      abi: contentStoreAbi,
      functionName: "read",
      args: [primary.fileId, 0n, info.length],
    })
    .catch(() => null);
  if (!bytes) return null;
  return mediaDataUrl(hexToBytes(bytes), info.mimeType);
}

const DEPLOYED = getAbiItem({ abi: independentDeployerAbi, name: "Deployed" });

export interface IndependentContract {
  readonly token: Address;
  readonly editions: boolean;
  readonly name: string;
  /** IndependentStreamRegistry listing status: 0 not listed, 1 listed. */
  readonly status: number;
  /** For a 1/1 contract, its listed editions partner; for editions, its 1/1 contract. */
  readonly partner: Address | null;
}

/** The Independent Stream contracts a wallet deployed, with their listing. */
export async function readMyCollections(viewer: Address): Promise<IndependentContract[]> {
  const instance = getStreamInstance();
  const client = getStreamClient();
  const [one, editions] = await Promise.all([
    scanLogs({ address: instance.addresses.independent721Deployer, event: DEPLOYED, args: { caller: viewer } }),
    scanLogs({ address: instance.addresses.independentEditionsDeployer, event: DEPLOYED, args: { caller: viewer } }),
  ]);
  const all = [
    ...one.map((log) => ({ token: log.args.token, editions: false })),
    ...editions.map((log) => ({ token: log.args.token, editions: true })),
  ];
  return Promise.all(
    all.map(async (entry) => {
      const [listing, name] = await Promise.all([
        client.readContract({
          address: instance.addresses.independentRegistry,
          abi: independentRegistryAbi,
          functionName: "listingOf",
          args: [entry.token],
        }),
        client
          .readContract({ address: entry.token, abi: streamAbi, functionName: "name" })
          .catch(() => ""),
      ]);
      let partner: Address | null = isZeroAddress(listing.partner) ? null : listing.partner;
      if (entry.editions && !partner) {
        partner = await client
          .readContract({ address: entry.token, abi: streamEditionsAbi, functionName: "stream" })
          .catch(() => null);
      }
      return { ...entry, name, status: listing.status, partner };
    })
  );
}


export interface MyOneOfOneBid {
  readonly saleId: bigint;
  readonly token: Address;
  readonly tokenId: bigint;
  readonly highest: bigint;
  readonly state: number;
  readonly leading: boolean;
  readonly endTime: bigint;
}

export interface MyEditionBid {
  readonly master: Address;
  readonly tokenId: bigint;
  readonly bidId: bigint;
  readonly quantity: number;
  readonly claimed: boolean;
}

export interface MyPayout {
  readonly token: Address;
  readonly tokenId: bigint;
  readonly vault: Address;
  readonly releasable: bigint;
}

export interface MyActivity {
  readonly oneOfOneBids: readonly MyOneOfOneBid[];
  readonly editionBids: readonly MyEditionBid[];
  readonly works: readonly SaleSummary[];
  readonly payouts: readonly MyPayout[];
}

/** The artist's single-payee seller vault, as the create page sets it up. */
export function soloPayees(artist: Address) {
  return [{ artistId: BigInt(artist), account: ZERO_ADDRESS, share: 100_000 }] as const;
}

export async function readMyActivity(viewer: Address): Promise<MyActivity> {
  const instance = getStreamInstance();
  const client = getStreamClient();
  const sales = await listSales();
  const bySale = new Map(sales.map((sale) => [sale.saleId, sale]));

  const myBids = await scanLogs({
    address: instance.addresses.englishAuction,
    event: ONE_BID_PLACED,
    args: { bidder: viewer },
  });
  const highest = new Map<bigint, bigint>();
  for (const log of myBids) {
    const previous = highest.get(log.args.saleId) ?? 0n;
    if (log.args.amount > previous) highest.set(log.args.saleId, log.args.amount);
  }
  const oneOfOneBids = [...highest.entries()].flatMap(([saleId, amount]) => {
    const sale = bySale.get(saleId);
    if (!sale) return [];
    return [
      {
        saleId,
        token: sale.token,
        tokenId: sale.tokenId,
        highest: amount,
        state: sale.state,
        leading: sameAddress(sale.bidder, viewer),
        endTime: sale.endTime,
      },
    ];
  });

  const editionBids: MyEditionBid[] = [];
  for (const auction of [instance.addresses.editionAuction, instance.addresses.independentEditionAuction]) {
    const [placed, opened, claimed] = await Promise.all([
      scanLogs({ address: auction, event: EDITION_BID_PLACED, args: { bidder: viewer } }),
      scanLogs({ address: auction, event: AUCTION_OPENED }),
      scanLogs({ address: auction, event: EDITION_BID_CLAIMED, args: { bidder: viewer } }),
    ]);
    const openedBySale = new Map(opened.map((log) => [log.args.saleId, log.args]));
    const claimedKeys = new Set(claimed.map((log) => `${log.args.saleId}:${log.args.bidId}`));
    for (const log of placed) {
      const open = openedBySale.get(log.args.saleId);
      if (!open) continue;
      editionBids.push({
        master: open.master,
        tokenId: open.id,
        bidId: log.args.bidId,
        quantity: Number(log.args.quantity),
        claimed: claimedKeys.has(`${log.args.saleId}:${log.args.bidId}`),
      });
    }
  }

  const collections = await readMyCollections(viewer);
  const myTokens = collections.filter((c) => !c.editions).map((c) => c.token);
  const works = sales.filter((sale) => myTokens.some((token) => sameAddress(token, sale.token)));
  const payees = soloPayees(viewer);
  const vault = await client.readContract({
    address: instance.addresses.splitLedger,
    abi: splitLedgerAbi,
    functionName: "walletFor",
    args: [payees, ZERO_HASH],
  });
  const releasable = await client
    .readContract({
      address: instance.addresses.splitLedger,
      abi: splitLedgerAbi,
      functionName: "releasable",
      args: [payees, ZERO_HASH, CURRENCY_ETH, 0n],
    })
    .catch(() => 0n);
  const payouts: MyPayout[] =
    works.length > 0 ? [{ token: works[0]!.token, tokenId: works[0]!.tokenId, vault, releasable }] : [];
  return { oneOfOneBids, editionBids, works, payouts };
}
