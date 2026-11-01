import { SPLITS_DENOMINATOR } from "@/lib/stream/constants";
import type { MockStreamEngine } from "@/lib/stream/mock/engine";
import { revert } from "@/lib/stream/mock/engine";
import { bidView } from "@/lib/stream/mock/sales/editionAuction";
import { englishState } from "@/lib/stream/mock/sales/englishAuction";
import type { MockSplitWallet } from "@/lib/stream/mock/state";
import type {
  AccountOneOfOneBid,
  AccountOverview,
  Address,
  ClaimableItem,
  EditionBalance,
  EditionBidView,
  SplitWalletView,
  StreamArtist,
  Wei,
  WorkKey,
} from "@/lib/stream/types";

function sameAddress(left: Address, right: Address): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

/** `ISplitWallet.releasable(ETH, index)`. */
function releasable(wallet: MockSplitWallet, index: number): Wei {
  const payee = wallet.payees[index];
  if (!payee) {
    return 0n;
  }
  const entitled =
    (wallet.received * BigInt(payee.share)) / BigInt(SPLITS_DENOMINATOR);
  const owed = entitled - (wallet.released[index] ?? 0n);
  return owed > 0n ? owed : 0n;
}

export function splitWalletView(wallet: MockSplitWallet): SplitWalletView {
  return {
    address: wallet.address,
    payees: wallet.payees.map((payee, index) => ({
      index,
      artistId: payee.artistId,
      account: payee.account,
      share: payee.share,
      released: wallet.released[index] ?? 0n,
      releasable: releasable(wallet, index),
    })),
    received: wallet.received,
    works: [...wallet.works],
  };
}

/** `ISplitWallet.release(ETH, index)`: pays the payee's account. */
export function releaseSplit(
  engine: MockStreamEngine,
  address: Address,
  index: number
): Wei {
  const wallet = engine.splitWallet(address);
  const payee = wallet?.payees[index];
  if (!wallet || !payee) {
    revert("UnknownPayee", { wallet: address, index });
  }
  const amount = releasable(wallet, index);
  if (amount === 0n) {
    revert("NothingToRelease", { wallet: address, index });
  }
  wallet.released[index] = (wallet.released[index] ?? 0n) + amount;
  // A royalty wallet pays the seller split wallet, which splits it again.
  const nested = engine.splitWallet(payee.account);
  if (nested) {
    nested.received += amount;
  } else {
    engine.creditBalance(payee.account, amount);
  }
  return amount;
}

export function artistView(
  engine: MockStreamEngine,
  artistId: string
): StreamArtist | null {
  const artist = engine.state.artists.get(artistId);
  if (!artist) {
    return null;
  }
  const restrained =
    artist.restrainedUntil !== null && engine.now() < artist.restrainedUntil;
  return {
    artistId: artist.artistId,
    displayName: artist.displayName,
    handle: artist.handle,
    bio: artist.bio,
    authority: artist.authority,
    payout: artist.payout,
    activeAuthority: restrained ? null : artist.authority,
    pendingChange:
      restrained && artist.restrainedUntil !== null
        ? {
            kind: "LOST_KEY",
            stagedAt: artist.restrainedUntil - 180 * 86_400,
            executableAt: artist.restrainedUntil,
            contestedAt: null,
            nextAuthority: artist.payout,
            nextPayout: artist.payout,
          }
        : null,
    lastActivity: artist.lastActivity,
    consolidatedWallets: [...artist.consolidatedWallets],
    federatedContracts: [...artist.federatedContracts],
    programs: [...artist.programs],
  };
}

export function artistIdForAccount(
  engine: MockStreamEngine,
  account: Address
): string | null {
  for (const artist of engine.state.artists.values()) {
    if (
      sameAddress(artist.authority, account) ||
      artist.consolidatedWallets.some((wallet) => sameAddress(wallet, account))
    ) {
      return artist.artistId;
    }
  }
  return null;
}

function oneOfOneBids(
  engine: MockStreamEngine,
  account: Address
): AccountOneOfOneBid[] {
  const rows: AccountOneOfOneBid[] = [];
  for (const auction of engine.state.englishAuctions.values()) {
    const mine = auction.bids.filter((bid) => sameAddress(bid.bidder, account));
    const last = mine.at(-1);
    if (last) {
      rows.push({
        saleId: auction.saleId,
        work: auction.work,
        amount: last.amount,
        at: last.at,
        leading:
          auction.bidder !== null && sameAddress(auction.bidder, account),
        state: englishState(engine, auction),
      });
    }
  }
  return rows.sort((left, right) => right.at - left.at);
}

function editionBidsOf(
  engine: MockStreamEngine,
  account: Address
): (EditionBidView & { readonly edition: WorkKey })[] {
  const rows: (EditionBidView & { readonly edition: WorkKey })[] = [];
  for (const auction of engine.state.editionAuctions.values()) {
    for (const bid of auction.book.bids) {
      if (sameAddress(bid.bidder, account)) {
        rows.push({
          ...bidView(engine, auction, bid),
          edition: auction.edition,
        });
      }
    }
  }
  return rows;
}

function claimables(
  engine: MockStreamEngine,
  account: Address,
  editionBids: readonly (EditionBidView & { readonly edition: WorkKey })[]
): ClaimableItem[] {
  const items: ClaimableItem[] = [];
  const credit = engine.state.credits.get(account) ?? 0n;
  if (credit > 0n) {
    items.push({ kind: "auction-credit", amount: credit });
  }
  for (const bid of editionBids) {
    const auction = engine.state.editionAuctions.get(bid.edition);
    const final = auction?.status === "SETTLED" || auction?.status === "VOID";
    if (final && !bid.claimed && !bid.withdrawn) {
      items.push({
        kind: "edition-bid",
        edition: bid.edition,
        bidId: bid.bidId,
        editions: bid.won,
        refund: bid.refund,
      });
    }
  }
  for (const auction of engine.state.englishAuctions.values()) {
    if (
      auction.pendingDelivery !== null &&
      sameAddress(auction.pendingDelivery, account)
    ) {
      items.push({
        kind: "pending-delivery",
        work: auction.work,
        saleId: auction.saleId,
      });
    }
  }
  for (const wallet of engine.state.splitWallets.values()) {
    wallet.payees.forEach((payee, index) => {
      const amount = releasable(wallet, index);
      if (sameAddress(payee.account, account) && amount > 0n) {
        items.push({
          kind: "split-payout",
          wallet: wallet.address,
          payeeIndex: index,
          amount,
        });
      }
    });
  }
  return items;
}

export function editionBalancesOf(
  engine: MockStreamEngine,
  account: Address
): EditionBalance[] {
  const rows: EditionBalance[] = [];
  for (const [key, balance] of engine.state.editionBalances) {
    const [edition, holder] = key.split("|");
    const token =
      edition === undefined ? undefined : engine.state.tokens.get(edition);
    if (
      token &&
      holder !== undefined &&
      balance > 0 &&
      sameAddress(holder as Address, account)
    ) {
      rows.push({
        edition: token.key,
        token: token.token,
        id: token.tokenId,
        balance,
      });
    }
  }
  return rows;
}

export function accountOverview(
  engine: MockStreamEngine,
  account: Address
): AccountOverview {
  const artistId = artistIdForAccount(engine, account);
  const editionBids = editionBidsOf(engine, account);
  const owned = [...engine.state.tokens.values()]
    .filter(
      (token) =>
        token.standard === "ERC721" &&
        token.owner !== null &&
        sameAddress(token.owner, account)
    )
    .map((token) => token.key);
  return {
    account,
    artist: artistId === null ? null : artistView(engine, artistId),
    oneOfOneBids: oneOfOneBids(engine, account),
    editionBids,
    claimable: claimables(engine, account, editionBids),
    owned,
    editions: editionBalancesOf(engine, account),
    splitWallets: [...engine.state.splitWallets.values()]
      .filter((wallet) =>
        wallet.payees.some((payee) => sameAddress(payee.account, account))
      )
      .map(splitWalletView),
  };
}
