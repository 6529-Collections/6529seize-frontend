"use client";

import type { ReactNode } from "react";

import { useStreamQuery } from "@/components/stream/data/StreamProvider";
import {
  editionsText,
  ethText,
  priceText,
  sameAddress,
  shortAddress,
  stepText,
} from "@/components/stream/editions/format";
import { PanelCard } from "@/components/stream/editions/parts";
import { STREAM_FOCUS } from "@/components/stream/ui/styles";
import { formatDate, formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type {
  Address,
  EditionActivity,
  EditionAuction,
  Wei,
} from "@/lib/stream/types";

/** The newest lines shown. */
const MAX_LINES = 30;
const DAY = 86_400;

/** "6:35 PM", or "Tue 6:35 PM" on another day than `now` (UTC). */
function timeText(locale: SupportedLocale, at: number, now: number): string {
  return formatDate(locale, at * 1_000, {
    ...(Math.floor(at / DAY) === Math.floor(now / DAY)
      ? {}
      : { weekday: "short" }),
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

interface Line {
  readonly key: string;
  readonly at: number;
  readonly order: number;
  readonly system: boolean;
  readonly text: ReactNode;
}

function Who({
  address,
  account,
  locale,
}: {
  readonly address: Address;
  readonly account: Address | null;
  readonly locale: SupportedLocale;
}) {
  if (sameAddress(address, account)) {
    return (
      <span className="tw-font-semibold tw-text-primary-300">
        {t(locale, "stream.editionAuction.activity.you")}
      </span>
    );
  }
  return (
    <span className="tw-font-mono tw-text-xs tw-text-iron-300" title={address}>
      {shortAddress(address)}
    </span>
  );
}

function lineText(
  event: EditionActivity,
  context: {
    readonly account: Address | null;
    readonly prices: readonly Wei[] | undefined;
    readonly locale: SupportedLocale;
    readonly now: number;
  }
): ReactNode {
  const { account, prices, locale, now } = context;
  switch (event.kind) {
    case "opened":
      return t(locale, "stream.editionAuction.activity.opened");
    case "bid":
      return (
        <>
          <Who address={event.bidder} account={account} locale={locale} />{" "}
          {t(locale, "stream.editionAuction.activity.bid", {
            qty: formatInteger(locale, event.quantity),
            price: stepText(locale, prices, event.step),
          })}
          {event.extended
            ? ` · ${t(locale, "stream.editionAuction.activity.moved", {
                time: timeText(locale, event.endTime, now),
              })}`
            : null}
        </>
      );
    case "raised":
      return (
        <>
          <Who address={event.bidder} account={account} locale={locale} />{" "}
          {t(locale, "stream.editionAuction.activity.raised", {
            qty: formatInteger(locale, event.quantity),
            from: stepText(locale, prices, event.fromStep),
            to: stepText(locale, prices, event.step),
          })}
          {event.extended
            ? ` · ${t(locale, "stream.editionAuction.activity.moved", {
                time: timeText(locale, event.endTime, now),
              })}`
            : null}
        </>
      );
    case "withdrawn":
      return (
        <>
          <Who address={event.bidder} account={account} locale={locale} />{" "}
          {t(locale, "stream.editionAuction.activity.withdrew", {
            amount: ethText(locale, event.amount),
          })}
        </>
      );
    case "scanned":
      return t(locale, "stream.editionAuction.activity.scanned", {
        words: formatInteger(locale, event.wordsLeft),
      });
    case "cleared":
      return t(locale, "stream.editionAuction.activity.cleared", {
        artist: ethText(locale, event.revenue - event.networkFee),
        network: ethText(locale, event.networkFee),
      });
    case "swept":
      return t(locale, "stream.editionAuction.activity.swept", {
        gaps: formatInteger(locale, event.total - event.swept),
      });
    case "settled":
      return event.count === 0
        ? t(locale, "stream.editionAuction.activity.settledNone")
        : t(locale, "stream.editionAuction.activity.settled", {
            editions: editionsText(locale, event.count),
          });
    case "voided":
      return t(locale, "stream.editionAuction.activity.voided");
    case "claimed":
      return (
        <>
          <Who address={event.bidder} account={account} locale={locale} />{" "}
          {event.unitsWon > 0
            ? t(locale, "stream.editionAuction.activity.claimed", {
                editions: editionsText(locale, event.unitsWon),
                amount: ethText(locale, event.refund),
              })
            : t(locale, "stream.editionAuction.activity.refunded", {
                amount: ethText(locale, event.refund),
              })}
        </>
      );
  }
}

const SYSTEM_KINDS = new Set<EditionActivity["kind"]>([
  "opened",
  "scanned",
  "cleared",
  "swept",
  "settled",
  "voided",
]);

/** The sale's history, newest first, from its events, plus the close itself. */
export default function Activity({
  auction,
  account,
  prices,
  locale,
  now,
  id,
  className,
}: {
  readonly auction: EditionAuction;
  readonly account: Address | null;
  readonly prices: readonly Wei[] | undefined;
  readonly locale: SupportedLocale;
  readonly now: number;
  readonly id: string;
  readonly className: string;
}) {
  const { data: events } = useStreamQuery(
    "edition-activity",
    [auction.edition],
    (source) => source.editionActivity(auction.edition)
  );
  const context = { account, prices, locale, now };
  const lines: Line[] = (events ?? []).map((event, index) => ({
    key: `${event.txHash}-${event.kind}-${index}`,
    at: event.at,
    order: index,
    system: SYSTEM_KINDS.has(event.kind),
    text: lineText(event, context),
  }));
  const closed =
    auction.status !== "NONE" &&
    !auction.biddingOpen &&
    auction.phase !== "void" &&
    auction.phase !== "disputed" &&
    now >= auction.times.editionEnd;
  if (closed) {
    const { count, price } = auction.clearing;
    lines.push({
      key: "closed",
      at: auction.times.editionEnd,
      // Before the settlement events at the same second.
      order: -1,
      system: true,
      text:
        count === 0
          ? t(locale, "stream.editionAuction.activity.closedNone")
          : t(locale, "stream.editionAuction.activity.closed", {
              editions: editionsText(locale, count),
              price: priceText(locale, price),
            }),
    });
  }
  const shown = lines
    .sort((left, right) => right.at - left.at || right.order - left.order)
    .slice(0, MAX_LINES);
  return (
    <PanelCard
      id={id}
      title={t(locale, "stream.editionAuction.activity.title")}
      className={className}
    >
      {shown.length === 0 ? (
        <p className="tw-m-0 tw-text-[13px] tw-text-iron-400">
          {t(locale, "stream.editionAuction.activity.empty")}
        </p>
      ) : (
        // A keyboard-focusable scroll region (WCAG 2.1.1).
        <ul
          tabIndex={0}
          aria-labelledby={id}
          className={`tw-m-0 tw-grid tw-max-h-[300px] tw-list-none tw-gap-1.5 tw-overflow-auto tw-rounded-md tw-p-0 tw-text-[13px] tw-text-iron-400 ${STREAM_FOCUS}`}
        >
          {shown.map((line) => (
            <li
              key={line.key}
              className="tw-grid tw-grid-cols-[6.8em_minmax(0,1fr)] tw-gap-2"
            >
              <time
                dateTime={new Date(line.at * 1_000).toISOString()}
                className="tw-tabular-nums tw-text-iron-500"
              >
                {timeText(locale, line.at, now)}
              </time>
              <span className={line.system ? "tw-text-iron-200" : undefined}>
                {line.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  );
}
