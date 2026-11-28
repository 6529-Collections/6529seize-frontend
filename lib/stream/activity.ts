import {
  editionAuctionAbi,
  englishAuctionAbi,
  independentDeployerAbi,
  independentRegistryAbi,
  splitLedgerAbi,
  streamAbi,
  streamEditionsAbi,
} from "./abis";
import { getAbiItem, type Address } from "viem";

import { getStreamClient } from "./client";
import { getStreamInstance } from "./instances";
import { CURRENCY_ETH, ZERO_HASH } from "./item";
import {
  AUCTION_OPENED,
  EDITION_BID_CLAIMED,
  EDITION_BID_PLACED,
  EDITION_BID_RAISED,
  listSales,
  ONE_BID_PLACED,
  scanLogs,
  type SaleSummary,
} from "./reads";
import { isZeroAddress, sameAddress, ZERO_ADDRESS } from "./state";

const WORK_MINTED = getAbiItem({ abi: streamAbi, name: "WorkMinted" });

/** Curated 6529 Stream works whose lead artist is this wallet (its artist ID is its address). */
async function readMyCuratedTokenIds(viewer: Address): Promise<Set<bigint>> {
  const logs = await scanLogs({ address: getStreamInstance().addresses.stream, event: WORK_MINTED });
  const artistId = BigInt(viewer);
  return new Set(logs.filter((log) => log.args.artistId === artistId).map((log) => log.args.tokenId));
}

/** A wallet's own Stream activity: its collections, bids, works and proceeds. */

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
  readonly auction: Address;
  readonly saleId: bigint;
  readonly bidId: bigint;
  readonly quantity: number;
  /** The price each the bid stands at now (after any raise). */
  readonly priceEach: bigint;
  /** What the bid gets: from the claim when claimed, else the contract's live or final answer. */
  readonly unitsWon: bigint | null;
  readonly refund: bigint | null;
  /** The sale is settled (or void), so the bid can be claimed. */
  readonly final: boolean;
  readonly claimed: boolean;
}

interface MyProceeds {
  readonly available: bigint;
  readonly takenOut: bigint;
}

interface MyActivity {
  readonly oneOfOneBids: readonly MyOneOfOneBid[];
  /** ETH from outbid 1/1 bids waiting to be withdrawn. */
  readonly oneOfOneCredit: bigint;
  readonly editionBids: readonly MyEditionBid[];
  readonly works: readonly SaleSummary[];
  readonly proceeds: MyProceeds | null;
}

/** The artist's single-payee seller vault, as the create page sets it up. */
export function soloPayees(artist: Address) {
  return [{ artistId: BigInt(artist), account: ZERO_ADDRESS, share: 100_000 }] as const;
}

async function readEditionBids(viewer: Address): Promise<MyEditionBid[]> {
  const instance = getStreamInstance();
  const client = getStreamClient();
  const bids: MyEditionBid[] = [];
  for (const auction of [instance.addresses.editionAuction, instance.addresses.independentEditionAuction]) {
    const [placed, raised, opened, claimed] = await Promise.all([
      scanLogs({ address: auction, event: EDITION_BID_PLACED, args: { bidder: viewer } }),
      scanLogs({ address: auction, event: EDITION_BID_RAISED, args: { bidder: viewer } }),
      scanLogs({ address: auction, event: AUCTION_OPENED }),
      scanLogs({ address: auction, event: EDITION_BID_CLAIMED, args: { bidder: viewer } }),
    ]);
    const openedBySale = new Map(opened.map((log) => [log.args.saleId, log.args]));
    const claims = new Map(claimed.map((log) => [`${log.args.saleId}:${log.args.bidId}`, log.args]));
    const steps = new Map(placed.map((log) => [`${log.args.saleId}:${log.args.bidId}`, log.args.step]));
    for (const log of raised) steps.set(`${log.args.saleId}:${log.args.bidId}`, log.args.toStep);
    const rows = await Promise.all(
      placed.map(async (log) => {
        const open = openedBySale.get(log.args.saleId);
        if (!open) return null;
        const key = `${log.args.saleId}:${log.args.bidId}`;
        const claim = claims.get(key);
        const [priceEach, sale, outcome] = await Promise.all([
          client.readContract({
            address: auction,
            abi: editionAuctionAbi,
            functionName: "stepPrice",
            args: [log.args.saleId, steps.get(key) ?? log.args.step],
          }),
          client.readContract({ address: auction, abi: editionAuctionAbi, functionName: "auction", args: [log.args.saleId] }),
          claim
            ? Promise.resolve(null)
            : client
                .readContract({
                  address: auction,
                  abi: editionAuctionAbi,
                  functionName: "bidOutcome",
                  args: [log.args.saleId, log.args.bidId],
                })
                .catch(() => null),
        ]);
        return {
          master: open.master,
          tokenId: open.id,
          auction,
          saleId: log.args.saleId,
          bidId: log.args.bidId,
          quantity: Number(log.args.quantity),
          priceEach,
          unitsWon: claim ? claim.unitsWon : (outcome?.unitsWon ?? null),
          refund: claim ? claim.refund : (outcome?.refund ?? null),
          final: sale.status >= 4,
          claimed: !!claim,
        };
      })
    );
    bids.push(...rows.filter((row): row is MyEditionBid => row !== null));
  }
  return bids;
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
  const [oneOfOneCredit, editionBids, collections, curatedTokenIds] = await Promise.all([
    client.readContract({
      address: instance.addresses.englishAuction,
      abi: englishAuctionAbi,
      functionName: "claimable",
      args: [viewer],
    }),
    readEditionBids(viewer),
    readMyCollections(viewer),
    readMyCuratedTokenIds(viewer),
  ]);

  const myTokens = collections.filter((c) => !c.editions).map((c) => c.token);
  const works = sales.filter(
    (sale) =>
      myTokens.some((token) => sameAddress(token, sale.token)) ||
      (sale.curated && curatedTokenIds.has(sale.tokenId))
  );
  let proceeds: MyProceeds | null = null;
  if (works.length > 0) {
    const payees = soloPayees(viewer);
    const vault = await client.readContract({
      address: instance.addresses.splitLedger,
      abi: splitLedgerAbi,
      functionName: "walletFor",
      args: [payees, ZERO_HASH],
    });
    const [available, takenOut] = await Promise.all([
      client
        .readContract({
          address: instance.addresses.splitLedger,
          abi: splitLedgerAbi,
          functionName: "releasable",
          args: [payees, ZERO_HASH, CURRENCY_ETH, 0n],
        })
        .catch(() => 0n),
      client
        .readContract({
          address: instance.addresses.splitLedger,
          abi: splitLedgerAbi,
          functionName: "released",
          args: [vault, CURRENCY_ETH, 0n],
        })
        .catch(() => 0n),
    ]);
    proceeds = { available, takenOut };
  }
  return { oneOfOneBids, oneOfOneCredit, editionBids, works, proceeds };
}
