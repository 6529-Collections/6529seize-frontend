"use client";

import { useStreamQuery } from "@/components/stream/data/StreamProvider";
import {
  bidTotals,
  editionsText,
  ethText,
  isLive,
  priceText,
  stepText,
} from "@/components/stream/editions/format";
import {
  PanelCard,
  PANEL_ACTION,
  PANEL_NOTE,
  StandingTag,
  standingOf,
} from "@/components/stream/editions/parts";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { type MessageKey, t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type {
  Address,
  EditionAuction,
  EditionBidView,
  Wei,
} from "@/lib/stream/types";

interface BidActions {
  readonly pending: boolean;
  readonly raise: (bid: EditionBidView, step: number) => void;
  readonly withdraw: (bid: EditionBidView) => void;
}

function Summary({
  auction,
  bids,
  locale,
}: {
  readonly auction: EditionAuction;
  readonly bids: readonly EditionBidView[];
  readonly locale: SupportedLocale;
}) {
  const live = bids.filter((bid) => !bid.withdrawn);
  if (live.length === 0) {
    return null;
  }
  const totals = bidTotals(live, auction.clearing.price);
  // Once bidding closes the book is frozen, so the result is final.
  const final = !auction.biddingOpen;
  let key: MessageKey;
  if (auction.phase === "void") {
    key = "stream.editionAuction.yours.voidSummary";
  } else if (totals.won === 0) {
    key = final
      ? "stream.editionAuction.yours.noneFinal"
      : "stream.editionAuction.yours.noneNow";
  } else {
    key = final
      ? "stream.editionAuction.yours.winFinal"
      : "stream.editionAuction.yours.winNow";
  }
  return (
    <p className="tw-m-0 tw-text-sm tw-tabular-nums tw-text-iron-200">
      <strong className="tw-font-semibold tw-text-iron-50">
        {t(locale, key, {
          editions: editionsText(locale, totals.won),
          pay: ethText(locale, totals.pay),
          held: ethText(locale, totals.held),
        })}
      </strong>
      {totals.won > 0 && totals.back > 0n ? (
        <>
          {" "}
          {t(
            locale,
            final
              ? "stream.editionAuction.yours.backFinal"
              : "stream.editionAuction.yours.backNow",
            { back: ethText(locale, totals.back) }
          )}
        </>
      ) : null}
    </p>
  );
}

function bidNote(
  locale: SupportedLocale,
  auction: EditionAuction,
  bid: EditionBidView
): string {
  if (bid.withdrawn) {
    return t(locale, "stream.editionAuction.yours.withdrawn", {
      amount: ethText(locale, bid.escrow),
    });
  }
  if (bid.claimed) {
    return t(locale, "stream.editionAuction.yours.claimed");
  }
  if (auction.phase === "void") {
    return t(locale, "stream.editionAuction.yours.voidBack", {
      amount: ethText(locale, bid.escrow),
    });
  }
  const standing = standingOf(bid.won, bid.qty);
  if (standing === "in") {
    return bid.refund > 0n
      ? t(locale, "stream.editionAuction.yours.pays", {
          price: priceText(locale, auction.clearing.price),
          back: ethText(locale, bid.refund),
        })
      : t(locale, "stream.editionAuction.yours.setsPrice");
  }
  if (standing === "partly") {
    return t(locale, "stream.editionAuction.yours.partly", {
      won: formatInteger(locale, bid.won),
      qty: formatInteger(locale, bid.qty),
    });
  }
  if (auction.biddingOpen && bid.step === auction.clearing.step) {
    return t(locale, "stream.editionAuction.yours.queued");
  }
  return auction.biddingOpen
    ? t(locale, "stream.editionAuction.yours.below")
    : t(locale, "stream.editionAuction.yours.allBack", {
        amount: ethText(locale, bid.escrow),
      });
}

/** "Raise to 0.0537 to get in · +0.0078 ETH", and what it does to everyone's price. */
function RaiseButton({
  auction,
  bid,
  prices,
  actions,
  locale,
}: {
  readonly auction: EditionAuction;
  readonly bid: EditionBidView;
  readonly prices: readonly Wei[] | undefined;
  readonly actions: BidActions;
  readonly locale: SupportedLocale;
}) {
  const target = bid.raiseToGetIn;
  const { data: quote } = useStreamQuery(
    "edition-raise-quote",
    [auction.edition, bid.bidId, target ?? -1],
    (source) =>
      target === null
        ? Promise.resolve(null)
        : source.quoteEditionRaise(auction.edition, bid.bidId, target)
  );
  if (target === null) {
    return (
      <p className={PANEL_NOTE}>
        {t(locale, "stream.editionAuction.yours.noRaise")}
      </p>
    );
  }
  const targetPrice = prices?.[target];
  if (targetPrice === undefined) {
    return null;
  }
  const cost = BigInt(bid.qty) * (targetPrice - bid.price);
  const moves =
    quote !== null &&
    quote !== undefined &&
    quote.after.step !== auction.clearing.step;
  return (
    <div className="tw-grid tw-justify-items-start tw-gap-1">
      <button
        type="button"
        className={PANEL_ACTION}
        disabled={actions.pending}
        onClick={() => actions.raise(bid, target)}
      >
        {t(locale, "stream.editionAuction.yours.raise", {
          price: priceText(locale, targetPrice),
          cost: ethText(locale, cost),
        })}
      </button>
      {moves ? (
        <p className={`${PANEL_NOTE} tw-tabular-nums`}>
          {t(locale, "stream.editionAuction.yours.raiseMoves", {
            price: priceText(locale, quote.after.price),
            editions: editionsText(locale, quote.after.count),
          })}
        </p>
      ) : null}
    </div>
  );
}

function BidRow({
  auction,
  bid,
  prices,
  actions,
  locale,
}: {
  readonly auction: EditionAuction;
  readonly bid: EditionBidView;
  readonly prices: readonly Wei[] | undefined;
  readonly actions: BidActions;
  readonly locale: SupportedLocale;
}) {
  const live = isLive(bid);
  const canRaise =
    live && auction.biddingOpen && standingOf(bid.won, bid.qty) !== "in";
  return (
    <li className="tw-grid tw-gap-1.5 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-py-2.5">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
        {live && auction.phase !== "void" ? (
          <StandingTag won={bid.won} qty={bid.qty} locale={locale} />
        ) : null}
        <span className="tw-text-sm tw-font-semibold tw-tabular-nums tw-text-iron-50">
          {t(locale, "stream.editionAuction.yours.bid", {
            qty: formatInteger(locale, bid.qty),
            price: stepText(locale, prices, bid.step),
          })}
        </span>
      </div>
      <p className={`${PANEL_NOTE} tw-tabular-nums`}>
        {bidNote(locale, auction, bid)}
      </p>
      {canRaise ? (
        <RaiseButton
          auction={auction}
          bid={bid}
          prices={prices}
          actions={actions}
          locale={locale}
        />
      ) : null}
      {live && auction.withdrawalsOpen ? (
        <div>
          <button
            type="button"
            className={PANEL_ACTION}
            disabled={actions.pending}
            onClick={() => actions.withdraw(bid)}
          >
            {t(locale, "stream.editionAuction.yours.withdraw", {
              amount: ethText(locale, bid.escrow),
            })}
          </button>
        </div>
      ) : null}
    </li>
  );
}

/** The viewer's bids: in, partly in or out, with a one-click raise to get in. */
export default function YourBids({
  auction,
  account,
  bids,
  prices,
  actions,
  message,
  locale,
  id,
  className,
}: {
  readonly auction: EditionAuction;
  readonly account: Address | null;
  readonly bids: readonly EditionBidView[];
  readonly prices: readonly Wei[] | undefined;
  readonly actions: BidActions;
  readonly message: string | null;
  readonly locale: SupportedLocale;
  readonly id: string;
  readonly className: string;
}) {
  const live = bids.filter((bid) => !bid.withdrawn);
  const totals = bidTotals(live, auction.clearing.price);
  const sorted = [...bids].sort(
    (left, right) => right.step - left.step || left.bidId - right.bidId
  );
  let empty: MessageKey | null = null;
  if (account === null) {
    empty = "stream.editionAuction.yours.connect";
  } else if (bids.length === 0) {
    empty =
      auction.biddingOpen || auction.status === "NONE"
        ? "stream.editionAuction.yours.noneYet"
        : "stream.editionAuction.yours.noneHad";
  }
  return (
    <PanelCard
      id={id}
      title={t(locale, "stream.editionAuction.yours.title")}
      aside={
        live.length === 0 || auction.phase === "void"
          ? undefined
          : t(locale, "stream.editionAuction.yours.aside", {
              won: formatInteger(locale, totals.won),
              wanted: formatInteger(locale, totals.wanted),
            })
      }
      className={className}
    >
      {empty === null ? (
        <>
          <Summary auction={auction} bids={bids} locale={locale} />
          <ul className="tw-m-0 tw-mt-3 tw-list-none tw-p-0">
            {sorted.map((bid) => (
              <BidRow
                key={bid.bidId}
                auction={auction}
                bid={bid}
                prices={prices}
                actions={actions}
                locale={locale}
              />
            ))}
          </ul>
        </>
      ) : (
        <p className="tw-m-0 tw-text-sm tw-text-iron-300">{t(locale, empty)}</p>
      )}
      <p
        className={`${PANEL_NOTE} tw-mt-2 tw-min-h-5`}
        role="status"
        aria-live="polite"
      >
        {message ?? ""}
      </p>
    </PanelCard>
  );
}
