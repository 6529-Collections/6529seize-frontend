import type { EditionAuctionActions } from "@/lib/stream/dataSource";
import { removeBid } from "@/lib/stream/editionBook";
import { later, type MockStreamEngine, revert } from "@/lib/stream/mock/engine";
import {
  bidView,
  claimEditionBid,
  findEditionAuction,
  logEvent,
  oneOfOneState,
  openPreparedAuction,
  ownBid,
  placeEditionBid,
  raiseEditionBid,
} from "@/lib/stream/mock/sales/editionAuction";
import { settleEditionAuction } from "@/lib/stream/mock/sales/editionSettlement";

/** `IUniformEditionAuction` writes on the mock: each runs atomically through `engine.tx`. */
export function createEditionActions(
  engine: MockStreamEngine
): EditionAuctionActions {
  return {
    open: (_from, edition) =>
      later(() =>
        engine.tx("editionOpen", () => {
          openPreparedAuction(engine, findEditionAuction(engine, edition));
        })
      ),
    bid: (from, edition, step, qty) =>
      later(() =>
        engine.tx("editionBid", () => ({
          bidId: placeEditionBid(
            engine,
            findEditionAuction(engine, edition),
            from,
            step,
            qty
          ).id,
        }))
      ),
    raise: (from, edition, bidId, newStep) =>
      later(() =>
        engine.tx("editionRaise", () => {
          raiseEditionBid(
            engine,
            findEditionAuction(engine, edition),
            from,
            bidId,
            newStep
          );
        })
      ),
    withdraw: (from, edition, bidId) =>
      later(() =>
        engine.tx(null, () => {
          const auction = findEditionAuction(engine, edition);
          // As the contract: the sale must be OPEN, the caller the bidder, the 1/1 paused.
          if (auction.status !== "OPEN") {
            revert("InvalidAuctionState", { status: auction.status });
          }
          const bid = ownBid(auction, from, bidId);
          if (oneOfOneState(engine, auction) !== "PAUSED") {
            revert("WithdrawalsClosed", { saleId: auction.saleId });
          }
          if (bid.withdrawn) {
            revert("UnknownBid", { saleId: auction.saleId, bidId });
          }
          const escrow = bidView(engine, auction, bid).escrow;
          removeBid(auction.book, bid);
          engine.creditBalance(from, escrow);
          logEvent(engine, auction, {
            kind: "withdrawn",
            bidder: from,
            bidId,
            amount: escrow,
            source: "BidWithdrawn",
          });
        })
      ),
    settle: (_from, edition) =>
      later(() =>
        engine.tx("editionSettle", () => ({
          settled: settleEditionAuction(
            engine,
            findEditionAuction(engine, edition)
          ),
        }))
      ),
    claim: (from, edition, bidId, to) =>
      later(() =>
        engine.tx("editionClaimWin", () =>
          claimEditionBid(
            engine,
            findEditionAuction(engine, edition),
            from,
            bidId,
            to
          )
        )
      ),
  };
}
