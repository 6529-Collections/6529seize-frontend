import { independentDeployerAbi, independentRegistryAbi, splitLedgerAbi, streamAbi, streamEditionsAbi } from "./abis";
import { getAbiItem, type Address } from "viem";

import { getStreamClient } from "./client";
import { getStreamInstance } from "./instances";
import { CURRENCY_ETH, ZERO_HASH } from "./item";
import {
  AUCTION_OPENED,
  EDITION_BID_CLAIMED,
  EDITION_BID_PLACED,
  listSales,
  ONE_BID_PLACED,
  scanLogs,
  type SaleSummary,
} from "./reads";
import { isZeroAddress, sameAddress, ZERO_ADDRESS } from "./state";

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

interface MyEditionBid {
  readonly master: Address;
  readonly tokenId: bigint;
  readonly bidId: bigint;
  readonly quantity: number;
  readonly claimed: boolean;
}

interface MyPayout {
  readonly token: Address;
  readonly tokenId: bigint;
  readonly vault: Address;
  readonly releasable: bigint;
}

interface MyActivity {
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
