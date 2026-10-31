"use client";

import { useId } from "react";

import {
  useStream,
  useStreamQuery,
} from "@/components/stream/data/StreamProvider";
import Activity from "@/components/stream/editions/Activity";
import BidBox from "@/components/stream/editions/BidBox";
import { isLive } from "@/components/stream/editions/format";
import OrderBook from "@/components/stream/editions/OrderBook";
import ResultCard from "@/components/stream/editions/ResultCard";
import StatusBanner from "@/components/stream/editions/StatusBanner";
import WhyCount from "@/components/stream/editions/WhyCount";
import YourBids from "@/components/stream/editions/YourBids";
import { useStreamAction } from "@/components/stream/pages/common";
import type { SupportedLocale } from "@/i18n/locales";
import type {
  EditionAuctionActions,
  StreamActions,
  TxResult,
} from "@/lib/stream/dataSource";
import type { EditionAuction, EditionBidView } from "@/lib/stream/types";

const editionActions = (actions: StreamActions): EditionAuctionActions =>
  actions.sale("UNIFORM_AUCTION");

/** A failed step of a multi-call action, re-typed for the caller. */
function failed<T>(result: TxResult<unknown>): TxResult<T> | null {
  return result.ok ? null : { ok: false, error: result.error };
}

/**
 * The 6529 Stream Editions auction panel (registered in `salePanels.tsx` for
 * `UNIFORM_AUCTION`). It lays out in two columns when its container is
 * wide and in one column, reordered, when it is narrow: result, your bids, the
 * bid box, the order book, "why this many", activity.
 */
export default function EditionAuctionPanel({
  sale: auction,
  locale,
  now,
}: {
  readonly sale: EditionAuction;
  readonly locale: SupportedLocale;
  readonly now: number;
}) {
  const { account } = useStream();
  const ids = useId();
  const bidAction = useStreamAction(locale);
  const bidsAction = useStreamAction(locale);
  const bannerAction = useStreamAction(locale);
  const { edition } = auction;
  const { data: prices } = useStreamQuery(
    "edition-ladder",
    [edition],
    (source) => source.ladder(edition)
  );
  const { data: bids = [] } = useStreamQuery(
    "edition-bids",
    [edition, account],
    (source) =>
      account === null
        ? Promise.resolve([])
        : source.editionBids(edition, account)
  );
  const oneOfOneSale = auction.oneOfOne?.saleId ?? null;
  const { data: oneOfOne = null } = useStreamQuery(
    "edition-one-of-one",
    [oneOfOneSale],
    (source) =>
      oneOfOneSale === null
        ? Promise.resolve(null)
        : source.getOneOfOneAuction(oneOfOneSale)
  );

  const mine = new Map<number, number>();
  for (const bid of bids) {
    if (isLive(bid)) {
      mine.set(bid.step, (mine.get(bid.step) ?? 0) + bid.qty);
    }
  }

  const settle = () =>
    void bannerAction.run(async (actions, from) => {
      const master = auction.master;
      if (
        !auction.editionCreated &&
        auction.clearing.count > 0 &&
        auction.phase !== "void" &&
        master !== null
      ) {
        const created = await actions.createEdition(from, master);
        const stop = failed<{ readonly settled: boolean }>(created);
        if (stop !== null) {
          return stop;
        }
      }
      return editionActions(actions).settle(from, edition);
    });
  const claim = (claimable: readonly EditionBidView[]) =>
    void bannerAction.run(async (actions, from) => {
      let last: TxResult<{
        readonly editions: number;
        readonly refund: bigint;
      }> = { ok: false, error: { code: "NothingToClaim" } };
      for (const bid of claimable) {
        last = await editionActions(actions).claim(
          from,
          edition,
          bid.bidId,
          from
        );
        if (!last.ok) {
          return last;
        }
      }
      return last;
    });

  // Each card keeps its place in the narrow order; at @4xl the two columns take over.
  const card = (order: string) => `${order} @4xl:tw-order-none`;
  const column =
    "tw-contents @4xl:tw-flex @4xl:tw-min-w-0 @4xl:tw-flex-col @4xl:tw-gap-4";

  return (
    <div className="tw-@container">
      <StatusBanner
        auction={auction}
        oneOfOne={oneOfOne}
        bids={bids}
        now={now}
        locale={locale}
        actions={{
          pending: bannerAction.pending,
          message: bannerAction.message,
          open: () =>
            void bannerAction.run((actions, from) =>
              editionActions(actions).open(from, edition)
            ),
          settle,
          claim,
        }}
      />
      <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-4 @4xl:tw-grid @4xl:tw-grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] @4xl:tw-items-start @4xl:tw-gap-5">
        <div className={column}>
          <ResultCard
            auction={auction}
            locale={locale}
            now={now}
            id={`${ids}-result`}
            className={card("tw-order-1")}
          />
          <OrderBook
            auction={auction}
            mine={mine}
            locale={locale}
            id={`${ids}-book`}
            className={card("tw-order-4")}
          />
          <WhyCount
            auction={auction}
            locale={locale}
            id={`${ids}-why`}
            className={card("tw-order-5")}
          />
        </div>
        <div className={column}>
          <YourBids
            auction={auction}
            account={account}
            bids={bids}
            prices={prices}
            locale={locale}
            message={bidsAction.message}
            actions={{
              pending: bidsAction.pending,
              raise: (bid, step) =>
                void bidsAction.run((actions, from) =>
                  editionActions(actions).raise(from, edition, bid.bidId, step)
                ),
              withdraw: (bid) =>
                void bidsAction.run((actions, from) =>
                  editionActions(actions).withdraw(from, edition, bid.bidId)
                ),
            }}
            id={`${ids}-yours`}
            className={card("tw-order-2")}
          />
          <BidBox
            auction={auction}
            prices={prices}
            pending={bidAction.pending}
            submit={(step, qty) =>
              bidAction.run((actions, from) =>
                editionActions(actions).bid(from, edition, step, qty)
              )
            }
            locale={locale}
            id={`${ids}-bid`}
            className={card("tw-order-3")}
          />
          <Activity
            auction={auction}
            account={account}
            prices={prices}
            locale={locale}
            now={now}
            id={`${ids}-activity`}
            className={card("tw-order-6")}
          />
        </div>
      </div>
    </div>
  );
}
