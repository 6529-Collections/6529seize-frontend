import type { StreamDataSource } from "@/lib/stream/dataSource";
import { lowestStepFullyIn, lowestWinningStep } from "@/lib/stream/editionBook";
import {
  accountOverview,
  artistIdForAccount,
  artistView,
  editionBalancesOf,
  splitWalletView,
} from "@/lib/stream/mock/accounts";
import { later, type MockStreamEngine } from "@/lib/stream/mock/engine";
import { federatedDirectory, federatedView } from "@/lib/stream/mock/federated";
import {
  auctionPhase,
  auctionPrices,
  bidView,
  candidatesView,
  editionAuctionView,
  quoteBid,
  stepTotalsView,
} from "@/lib/stream/mock/sales/editionAuction";
import { acceptsBids } from "@/lib/stream/editionTiming";
import {
  englishState,
  englishView,
} from "@/lib/stream/mock/sales/englishAuction";
import { readSale } from "@/lib/stream/mock/sales/registry";
import { summaryOf, workView } from "@/lib/stream/mock/works";
import type {
  Address,
  DisputeView,
  StreamHomeFeed,
  StreamSourceInfo,
  WorkKey,
} from "@/lib/stream/types";

const ENDING_SOON = 60 * 60;

function sameAddress(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

/**
 * The mock data source: every read is computed from the engine's in-memory
 * state at the simulated time. Reads are async to match the chain source.
 */
export class MockStreamDataSource implements StreamDataSource {
  constructor(private readonly engine: MockStreamEngine) {}

  source(): StreamSourceInfo {
    return {
      kind: "mock",
      chainId: 11_155_111,
      network: "sepolia",
      instance: "r4",
      federated: "design",
      contracts: this.engine.contracts,
    };
  }

  now(): number {
    return this.engine.now();
  }

  subscribe(listener: () => void): () => void {
    return this.engine.subscribe(listener);
  }

  version(): number {
    return this.engine.version();
  }

  private visible(key: WorkKey): boolean {
    const token = this.engine.state.tokens.get(key);
    if (!token || token.burned) {
      return false;
    }
    const contract =
      token.federatedContract === null
        ? undefined
        : this.engine.state.federated.get(token.federatedContract);
    return contract === undefined || contract.status === "ACTIVE";
  }

  homeFeed(): Promise<StreamHomeFeed> {
    return later(() => {
      const { engine } = this;
      const now = engine.now();
      const auctions = [...engine.state.englishAuctions.values()].filter(
        (auction) => auction.program === "canonical"
      );
      const live = auctions
        .filter((auction) => englishState(engine, auction) === "ACTIVE")
        .sort((left, right) => left.endTime - right.endTime);
      const results = auctions
        .filter((auction) => auction.settlement !== null)
        .sort(
          (left, right) =>
            (right.settlement?.at ?? 0) - (left.settlement?.at ?? 0)
        );
      return {
        live: live.map((auction) => auction.work),
        endingSoon: live
          .filter((auction) => auction.endTime - now <= ENDING_SOON)
          .map((auction) => auction.work),
        upcoming: engine.state.packages
          .filter((entry) => entry.status === "REGISTERED")
          .flatMap((entry) => entry.items)
          .filter((item) => item.startable),
        recentResults: results.map((auction) => auction.work),
        editionsLive: [...engine.state.editionAuctions.values()]
          .filter(
            (auction) =>
              auction.program === "canonical" &&
              acceptsBids(auctionPhase(engine, auction))
          )
          .map((auction) => auction.edition),
      };
    });
  }

  listWorks(query: Parameters<StreamDataSource["listWorks"]>[0] = {}) {
    return later(() => {
      return [...this.engine.state.tokens.values()]
        .filter((token) => this.visible(token.key))
        .filter(
          (token) =>
            query.program === undefined || token.program === query.program
        )
        .filter(
          (token) =>
            query.variant === undefined || token.variant === query.variant
        )
        .filter(
          (token) =>
            query.artistId === undefined || token.artistId === query.artistId
        )
        .filter(
          (token) =>
            query.federatedContract === undefined ||
            (token.federatedContract !== null &&
              sameAddress(token.federatedContract, query.federatedContract))
        )
        .map((token) => summaryOf(this.engine, token));
    });
  }

  getWork(key: WorkKey) {
    return later(() => {
      const token = this.engine.state.tokens.get(key);
      return token ? workView(this.engine, token) : null;
    });
  }

  provenance(key: WorkKey) {
    return later(() => {
      return [...(this.engine.state.provenance.get(key) ?? [])];
    });
  }

  listArtists() {
    return later(() => {
      return [...this.engine.state.artists.keys()]
        .map((artistId) => artistView(this.engine, artistId))
        .filter((artist) => artist !== null);
    });
  }

  getArtist(artistId: string) {
    return later(() => {
      return artistView(this.engine, artistId.toLowerCase());
    });
  }

  artistOf(account: Address) {
    return later(() => {
      const artistId = artistIdForAccount(this.engine, account);
      return artistId === null ? null : artistView(this.engine, artistId);
    });
  }

  getSale(ref: Parameters<StreamDataSource["getSale"]>[0]) {
    return later(() => {
      return readSale(this.engine, ref);
    });
  }

  getOneOfOneAuction(saleId: string) {
    return later(() => {
      const auction = this.engine.state.englishAuctions.get(saleId);
      return auction ? englishView(this.engine, auction) : null;
    });
  }

  auctionForWork(key: WorkKey) {
    return later(() => {
      const sale = this.engine.state.tokens.get(key)?.sale;
      return sale?.kind === "ENGLISH_AUCTION"
        ? this.getOneOfOneAuction(sale.saleId)
        : null;
    });
  }

  claimableCredits(account: Address) {
    return later(() => {
      return this.engine.state.credits.get(account) ?? 0n;
    });
  }

  listEditionAuctions() {
    return later(() => {
      return [...this.engine.state.editionAuctions.values()]
        .filter((auction) => this.visible(auction.edition))
        .map((auction) => editionAuctionView(this.engine, auction));
    });
  }

  getEditionAuction(edition: WorkKey) {
    return later(() => {
      const auction = this.engine.state.editionAuctions.get(edition);
      return auction ? editionAuctionView(this.engine, auction) : null;
    });
  }

  stepTotals(edition: WorkKey) {
    return later(() => {
      const auction = this.engine.state.editionAuctions.get(edition);
      return auction ? stepTotalsView(auction) : [];
    });
  }

  candidates(edition: WorkKey) {
    return later(() => {
      const auction = this.engine.state.editionAuctions.get(edition);
      return auction ? candidatesView(auction) : [];
    });
  }

  editionBids(edition: WorkKey, bidder?: Address) {
    return later(() => {
      const auction = this.engine.state.editionAuctions.get(edition);
      if (!auction) {
        return [];
      }
      return auction.book.bids
        .filter(
          (bid) => bidder === undefined || sameAddress(bid.bidder, bidder)
        )
        .map((bid) => bidView(this.engine, auction, bid));
    });
  }

  quoteEditionBid(edition: WorkKey, step: number, qty: number) {
    return later(() => {
      const auction = this.engine.state.editionAuctions.get(edition);
      const valid =
        Number.isInteger(step) && step >= 0 && Number.isInteger(qty) && qty > 0;
      return auction && valid && step < auction.terms.steps
        ? quoteBid(auction, step, qty)
        : null;
    });
  }

  lowestStepFullyIn(edition: WorkKey, qty: number) {
    return later(() => {
      const auction = this.engine.state.editionAuctions.get(edition);
      if (!auction || !Number.isInteger(qty) || qty < 1) {
        return null;
      }
      return lowestStepFullyIn(
        auction.book,
        qty,
        auctionPrices(auction),
        auction.terms.marginShare
      );
    });
  }

  lowestWinningStep(edition: WorkKey, qty: number) {
    return later(() => {
      const auction = this.engine.state.editionAuctions.get(edition);
      if (!auction || !Number.isInteger(qty) || qty < 1) {
        return null;
      }
      return lowestWinningStep(
        auction.book,
        qty,
        auctionPrices(auction),
        auction.terms.marginShare
      );
    });
  }

  ladder(edition: WorkKey) {
    return later(() => {
      const auction = this.engine.state.editionAuctions.get(edition);
      return auction ? auctionPrices(auction) : [];
    });
  }

  editionBalances(account: Address) {
    return later(() => {
      return editionBalancesOf(this.engine, account);
    });
  }

  splitWallet(address: Address) {
    return later(() => {
      const wallet = this.engine.splitWallet(address);
      return wallet ? splitWalletView(wallet) : null;
    });
  }

  accountOverview(account: Address) {
    return later(() => {
      return accountOverview(this.engine, account);
    });
  }

  museumHoldings() {
    return later(() => {
      return [...this.engine.state.museum].sort(
        (left, right) => right.arrivedAt - left.arrivedAt
      );
    });
  }

  curationQueue() {
    return later(() => {
      return [...this.engine.state.packages];
    });
  }

  disputes(): Promise<readonly DisputeView[]> {
    return later(() => {
      const { engine } = this;
      const rows: DisputeView[] = [];
      for (const auction of engine.state.englishAuctions.values()) {
        const token = engine.token(auction.work);
        const statements = engine.state.statements.filter(
          (statement) =>
            statement.subject.token === token.token &&
            statement.subject.id === token.tokenId
        );
        const state = englishState(engine, auction);
        if (auction.pauseUsed || statements.length > 0) {
          rows.push({
            work: auction.work,
            state: disputeState(state, auction.pauseUsed),
            openedAt:
              auction.pausedAt ?? statements[0]?.at ?? auction.startTime,
            outcomeRef: statements.at(-1)?.entryHash ?? null,
            statements,
          });
        }
      }
      return rows;
    });
  }

  federatedDirectory(
    query?: Parameters<StreamDataSource["federatedDirectory"]>[0]
  ) {
    return later(() => {
      return federatedDirectory(this.engine, query);
    });
  }

  getFederatedContract(address: Address) {
    return later(() => {
      for (const entry of this.engine.state.federated.values()) {
        if (sameAddress(entry.address, address)) {
          return federatedView(this.engine, entry);
        }
      }
      return null;
    });
  }
}

function disputeState(
  state: ReturnType<typeof englishState>,
  pauseUsed: boolean
): DisputeView["state"] {
  if (state === "PAUSED") {
    return "paused";
  }
  if (state === "CANCELLED") {
    return "upheld";
  }
  return pauseUsed ? "rejected" : "statement-only";
}
