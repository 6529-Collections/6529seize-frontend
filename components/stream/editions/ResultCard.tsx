"use client";

import { useState } from "react";

import {
  clockText,
  editionsText,
  ethText,
  priceText,
} from "@/components/stream/editions/format";
import { PanelCard, PANEL_NOTE } from "@/components/stream/editions/parts";
import Countdown from "@/components/stream/ui/Countdown";
import { STREAM_LABEL } from "@/components/stream/ui/styles";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { type MessageKey, t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type { EditionAuction } from "@/lib/stream/types";

function asideKey(auction: EditionAuction): MessageKey {
  if (auction.status === "NONE") {
    return "stream.editionAuction.result.notOpen";
  }
  if (auction.phase === "void") {
    return "stream.editionAuction.result.void";
  }
  if (auction.settled) {
    return "stream.editionAuction.result.final";
  }
  return auction.biddingOpen
    ? "stream.editionAuction.result.ifNow"
    : "stream.editionAuction.result.closed";
}

/** The result in words, kept to compare against after a change. */
function resultWords(
  locale: SupportedLocale,
  auction: EditionAuction
): string | null {
  const { clearing } = auction;
  return clearing.count === 0
    ? null
    : t(locale, "stream.editionAuction.result.short", {
        count: formatInteger(locale, clearing.count),
        price: priceText(locale, clearing.price),
      });
}

/** "Was 79 at 0.0487 until 6:41 PM": the live result's last change, while bidding is open. */
function useLastChange(
  locale: SupportedLocale,
  auction: EditionAuction,
  now: number
): { readonly was: string; readonly at: number } | null {
  const words = resultWords(locale, auction);
  const [seen, setSeen] = useState(words);
  const [change, setChange] = useState<{
    readonly was: string;
    readonly at: number;
  } | null>(null);
  if (seen !== words) {
    setSeen(words);
    // The first bid sets a price; there is nothing it was before.
    setChange(seen === null ? null : { was: seen, at: now });
  }
  return auction.biddingOpen ? change : null;
}

function Headline({
  auction,
  locale,
}: {
  readonly auction: EditionAuction;
  readonly locale: SupportedLocale;
}) {
  const { clearing } = auction;
  const big =
    "tw-m-0 tw-text-[28px] tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl";
  if (clearing.count === 0 || auction.phase === "void") {
    let key: MessageKey = "stream.editionAuction.result.noEditions";
    if (auction.status === "NONE" || auction.biddingOpen) {
      key = "stream.editionAuction.result.noBidsYet";
    }
    return <p className={big}>{t(locale, key)}</p>;
  }
  const unit =
    "tw-text-[0.5em] tw-font-medium tw-tracking-normal tw-text-iron-400";
  return (
    <p className={`${big} tw-tabular-nums`}>
      {formatInteger(locale, clearing.count)}{" "}
      <span className={unit}>
        {t(
          locale,
          clearing.count === 1
            ? "stream.editionAuction.result.unitOne"
            : "stream.editionAuction.result.unitOther"
        )}
      </span>{" "}
      <span className="tw-whitespace-nowrap">
        {priceText(locale, clearing.price)}{" "}
        <span className={unit}>
          {t(locale, "stream.editionAuction.result.each")}
        </span>
      </span>
    </p>
  );
}

function ResultLines({
  auction,
  locale,
}: {
  readonly auction: EditionAuction;
  readonly locale: SupportedLocale;
}) {
  const { clearing } = auction;
  if (auction.phase === "void") {
    return (
      <p className={`${PANEL_NOTE} tw-mt-2`}>
        {t(locale, "stream.editionAuction.result.voidLine")}
      </p>
    );
  }
  if (clearing.count === 0) {
    return (
      <p className={`${PANEL_NOTE} tw-mt-2`}>
        {t(
          locale,
          auction.biddingOpen || auction.status === "NONE"
            ? "stream.editionAuction.result.firstBid"
            : "stream.editionAuction.result.nobody"
        )}
      </p>
    );
  }
  return (
    <>
      <p className="tw-m-0 tw-mt-2 tw-text-sm tw-tabular-nums tw-text-iron-300">
        {t(locale, "stream.editionAuction.result.raised", {
          revenue: ethText(locale, clearing.revenue),
          artist: ethText(locale, clearing.sellerShare),
          network: ethText(locale, clearing.networkFee),
        })}
      </p>
      {auction.terms.maxCount === 0 ? null : (
        <p className={`${PANEL_NOTE} tw-mt-1`}>
          {t(locale, "stream.editionAuction.result.cap", {
            cap: editionsText(locale, auction.terms.maxCount),
          })}
        </p>
      )}
    </>
  );
}

function closeRule(
  locale: SupportedLocale,
  auction: EditionAuction,
  now: number
): string {
  const { times, terms } = auction;
  if (auction.phase === "disputed") {
    return t(locale, "stream.editionAuction.close.disputed");
  }
  if (times.endTime > times.closeAt) {
    return t(locale, "stream.editionAuction.close.moved", {
      base: clockText(locale, times.closeAt, now),
      latest: clockText(locale, times.backstop, now),
    });
  }
  return t(locale, "stream.editionAuction.close.rule", {
    offset: formatInteger(locale, Math.round(terms.closeOffset / 60)),
    window: formatInteger(locale, Math.round(terms.softWindow / 60)),
    latest: clockText(locale, times.backstop, now),
  });
}

function CloseBox({
  auction,
  locale,
  now,
}: {
  readonly auction: EditionAuction;
  readonly locale: SupportedLocale;
  readonly now: number;
}) {
  const { times } = auction;
  const open = auction.biddingOpen || auction.status === "NONE";
  return (
    <div className="tw-mt-4 tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-3.5 tw-gap-y-1 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-pt-3.5">
      <p className={`${STREAM_LABEL} tw-basis-full`}>
        {t(
          locale,
          open
            ? "stream.editionAuction.close.label"
            : "stream.editionAuction.close.closedLabel"
        )}
      </p>
      <p className="tw-m-0 tw-text-lg tw-font-semibold tw-tabular-nums tw-text-iron-50">
        {t(locale, "stream.editionAuction.close.at", {
          time: clockText(locale, times.endTime, now),
        })}
      </p>
      {open && auction.phase !== "disputed" ? (
        <Countdown
          endTime={times.endTime}
          now={now}
          locale={locale}
          closeWindow={auction.terms.softWindow}
          className="tw-text-sm tw-text-iron-200"
        />
      ) : null}
      {open ? (
        <p className={`${PANEL_NOTE} tw-basis-full`}>
          {closeRule(locale, auction, now)}
        </p>
      ) : null}
    </div>
  );
}

/** The result if bidding closed now (or the final one), the split, and the close clock. */
export default function ResultCard({
  auction,
  locale,
  now,
  id,
  className,
}: {
  readonly auction: EditionAuction;
  readonly locale: SupportedLocale;
  readonly now: number;
  readonly id: string;
  readonly className: string;
}) {
  const change = useLastChange(locale, auction, now);
  return (
    <PanelCard
      id={id}
      title={t(locale, "stream.editionAuction.result.title")}
      aside={t(locale, asideKey(auction))}
      className={className}
    >
      <div aria-live="polite" aria-atomic="true">
        <Headline auction={auction} locale={locale} />
      </div>
      <ResultLines auction={auction} locale={locale} />
      {change === null ? null : (
        <p className={`${PANEL_NOTE} tw-mt-1 tw-tabular-nums`}>
          {t(locale, "stream.editionAuction.result.was", {
            was: change.was,
            time: clockText(locale, change.at, now),
          })}
        </p>
      )}
      <CloseBox auction={auction} locale={locale} now={now} />
    </PanelCard>
  );
}
