import type { StreamDataSource } from "@/lib/stream/dataSource";
import type {
  AccountOneOfOneBid,
  AccountOverview,
  Address,
  ClaimableItem,
  EditionAuction,
  EditionBidView,
  OneOfOneAuction,
  SplitWalletView,
  StreamWork,
  Wei,
  WorkKey,
} from "@/lib/stream/types";

/**
 * The /stream/me dashboard for one account: `accountOverview`, plus the
 * auctions, works and split wallets its rows point to.
 */

export type DashboardBid =
  | {
      readonly kind: "oneOfOne";
      readonly bid: AccountOneOfOneBid;
      readonly auction: OneOfOneAuction;
      readonly work: StreamWork;
    }
  | {
      readonly kind: "edition";
      readonly bid: EditionBidView;
      readonly auction: EditionAuction;
      readonly work: StreamWork;
      /** The price at `bid.raiseToGetIn`, the lowest step that gets every unit in. */
      readonly raisePrice: Wei | null;
      /** `settlementOrderFor(edition, account)`: this account's next settle order. */
      readonly settleOrder: readonly number[];
    };

/** Everything to claim except split payouts, which the wallets table releases. */
export interface DashboardClaim {
  readonly item: Exclude<ClaimableItem, { readonly kind: "split-payout" }>;
  readonly work: StreamWork | null;
}

export interface DashboardHolding {
  readonly work: StreamWork;
  /** 1 for a 1/1; the balance for an edition. */
  readonly quantity: number;
}

/** A split wallet row: the account's share of a seller wallet, or royalties waiting for it. */
export interface DashboardWallet {
  readonly kind: "seller" | "royalty";
  readonly wallet: SplitWalletView;
  /** The payee this row releases: the account, or the seller wallet in a royalty wallet. */
  readonly payeeIndex: number;
  readonly share: number;
  readonly released: Wei;
  readonly releasable: Wei;
  readonly works: readonly StreamWork[];
}

interface Dashboard {
  readonly overview: AccountOverview;
  readonly bids: readonly DashboardBid[];
  readonly claims: readonly DashboardClaim[];
  readonly holdings: readonly DashboardHolding[];
  readonly wallets: readonly DashboardWallet[];
}

function sameAddress(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

/** Reads each work once. */
async function readWorks(
  source: StreamDataSource,
  keys: readonly WorkKey[]
): Promise<Map<WorkKey, StreamWork>> {
  const unique = [...new Set(keys)];
  const works = await Promise.all(unique.map((key) => source.getWork(key)));
  const map = new Map<WorkKey, StreamWork>();
  works.forEach((work) => {
    if (work !== null) {
      map.set(work.key, work);
    }
  });
  return map;
}

const OPEN_ONE_OF_ONE = new Set(["ACTIVE", "PAUSED", "ENDED"]);
const FINAL_EDITION = new Set(["SETTLED", "VOID"]);

/** 1/1 bids in auctions not yet settled, and edition bids not yet final. */
async function readBids(
  source: StreamDataSource,
  overview: AccountOverview,
  works: Map<WorkKey, StreamWork>
): Promise<DashboardBid[]> {
  const oneOfOne = await Promise.all(
    overview.oneOfOneBids
      .filter((bid) => OPEN_ONE_OF_ONE.has(bid.state))
      .map(async (bid): Promise<DashboardBid | null> => {
        const auction = await source.getOneOfOneAuction(bid.saleId);
        const work = works.get(bid.work);
        return auction && work
          ? { kind: "oneOfOne", bid, auction, work }
          : null;
      })
  );
  const editionKeys = [
    ...new Set(overview.editionBids.map((bid) => bid.edition)),
  ];
  const auctions = new Map(
    (await Promise.all(editionKeys.map((key) => source.getEditionAuction(key))))
      .filter((auction): auction is EditionAuction => auction !== null)
      .map((auction) => [auction.edition, auction])
  );
  const editions = await Promise.all(
    overview.editionBids
      .filter((bid) => !bid.withdrawn && !bid.claimed)
      .map(async (bid): Promise<DashboardBid | null> => {
        const auction = auctions.get(bid.edition);
        const work = works.get(bid.edition);
        if (!auction || !work || FINAL_EDITION.has(auction.status)) {
          return null;
        }
        const raisePrice =
          bid.raiseToGetIn === null
            ? null
            : ((await source.ladder(bid.edition))[bid.raiseToGetIn] ?? null);
        const settleOrder = await source.settlementOrderFor(
          bid.edition,
          overview.account
        );
        return { kind: "edition", bid, auction, work, raisePrice, settleOrder };
      })
  );
  return [...oneOfOne, ...editions].filter(
    (row): row is DashboardBid => row !== null
  );
}

function claimWork(item: DashboardClaim["item"]): WorkKey | null {
  switch (item.kind) {
    case "auction-credit":
      return null;
    case "edition-bid":
      return item.edition;
    case "pending-delivery":
      return item.work;
  }
}

/** The account's seller-wallet shares, then royalties waiting to move into those wallets. */
async function readWallets(
  source: StreamDataSource,
  account: Address,
  overview: AccountOverview,
  works: Map<WorkKey, StreamWork>
): Promise<DashboardWallet[]> {
  const rows: DashboardWallet[] = [];
  const royaltyWallets = new Map<Address, StreamWork[]>();
  for (const wallet of overview.splitWallets) {
    const payee = wallet.payees.find((entry) =>
      sameAddress(entry.account, account)
    );
    const walletWorks = wallet.works
      .map((key) => works.get(key))
      .filter((work): work is StreamWork => work !== undefined);
    if (payee) {
      rows.push({
        kind: "seller",
        wallet,
        payeeIndex: payee.index,
        share: payee.share,
        released: payee.released,
        releasable: payee.releasable,
        works: walletWorks,
      });
    }
    for (const work of walletWorks) {
      const royalty = work.economics.royaltyReceiver;
      royaltyWallets.set(royalty, [
        ...(royaltyWallets.get(royalty) ?? []),
        work,
      ]);
    }
  }
  const royalties = await Promise.all(
    [...royaltyWallets.keys()].map((address) => source.splitWallet(address))
  );
  for (const wallet of royalties) {
    // The royalty wallet's seller-side payee is the seller split wallet itself.
    const sellerSide = wallet?.payees.find((payee) =>
      overview.splitWallets.some((seller) =>
        sameAddress(seller.address, payee.account)
      )
    );
    if (wallet && sellerSide && wallet.received > 0n) {
      rows.push({
        kind: "royalty",
        wallet,
        payeeIndex: sellerSide.index,
        share: sellerSide.share,
        released: sellerSide.released,
        releasable: sellerSide.releasable,
        works: royaltyWallets.get(wallet.address) ?? [],
      });
    }
  }
  return rows;
}

export async function readDashboard(
  source: StreamDataSource,
  account: Address
): Promise<Dashboard> {
  const overview = await source.accountOverview(account);
  const claimItems = overview.claimable.filter(
    (item): item is DashboardClaim["item"] => item.kind !== "split-payout"
  );
  const works = await readWorks(source, [
    ...overview.oneOfOneBids.map((bid) => bid.work),
    ...overview.editionBids.map((bid) => bid.edition),
    ...claimItems.map(claimWork).filter((key): key is WorkKey => key !== null),
    ...overview.owned,
    ...overview.editions.map((balance) => balance.edition),
    ...overview.splitWallets.flatMap((wallet) => wallet.works),
  ]);
  const holdings: DashboardHolding[] = [
    ...overview.owned.map((key) => ({ key, quantity: 1 })),
    ...overview.editions.map((entry) => ({
      key: entry.edition,
      quantity: entry.balance,
    })),
  ]
    .map(({ key, quantity }) => {
      const work = works.get(key);
      return work ? { work, quantity } : null;
    })
    .filter((row): row is DashboardHolding => row !== null);
  const [bids, wallets] = await Promise.all([
    readBids(source, overview, works),
    readWallets(source, account, overview, works),
  ]);
  return {
    overview,
    bids,
    claims: claimItems.map((item) => {
      const key = claimWork(item);
      return { item, work: key === null ? null : (works.get(key) ?? null) };
    }),
    holdings,
    wallets,
  };
}
