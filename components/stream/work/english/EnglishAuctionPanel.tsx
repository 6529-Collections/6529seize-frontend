"use client";

import Link from "next/link";
import { type ReactNode, useId } from "react";

import { useStreamQuery } from "@/components/stream/data/StreamProvider";
import {
  ActionMessage,
  useStreamAction,
} from "@/components/stream/pages/common";
import Countdown from "@/components/stream/ui/Countdown";
import EthAmount, { formatEth } from "@/components/stream/ui/EthAmount";
import {
  auctionStateBadge,
  SpecBadge,
} from "@/components/stream/ui/StatusBadge";
import {
  STREAM_CARD,
  STREAM_FOCUS,
  STREAM_HEADING,
  STREAM_HELP,
  STREAM_LABEL,
} from "@/components/stream/ui/styles";
import FactTable, { type FactRow } from "@/components/stream/work/FactTable";
import StreamTime from "@/components/stream/work/StreamTime";
import KnownAddress from "@/components/stream/work/KnownAddress";
import { useAddressLabels } from "@/components/stream/work/useAddressLabels";
import BidHistory from "@/components/stream/work/english/BidHistory";
import type { EnglishPanelContext } from "@/components/stream/work/english/context";
import { Credits } from "@/components/stream/work/english/EnglishActions";
import {
  EnglishStateBlock,
  ResumedNote,
} from "@/components/stream/work/english/EnglishStateBlock";
import { formatInteger, formatPercent } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { type MessageKey, t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import { SPLITS_DENOMINATOR } from "@/lib/stream/constants";
import type { OneOfOneAuction } from "@/lib/stream/types";
import { STREAM_ROUTES } from "@/lib/stream/workKey";

function Fact({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="tw-min-w-0">
      <dt className={STREAM_LABEL}>{label}</dt>
      <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-font-medium tw-tabular-nums tw-text-iron-50">
        {children}
      </dd>
    </div>
  );
}

function EndFact({ context }: { readonly context: EnglishPanelContext }) {
  const { auction, locale, now } = context;
  switch (auction.state) {
    case "ACTIVE":
      return (
        <Countdown
          endTime={auction.endTime}
          now={now}
          locale={locale}
          closeWindow={auction.config.extensionWindow}
          extended={auction.endTime > auction.scheduledEnd}
        />
      );
    case "PAUSED":
      // The stored end, as `auction(saleId).endTime` reports it while paused.
      return (
        <>
          <StreamTime seconds={auction.endTime} locale={locale} />
          <span className="tw-block tw-text-xs tw-font-normal tw-text-amber-300">
            {t(locale, "stream.english.end.paused")}
          </span>
        </>
      );
    case "CANCELLED":
      return <>{t(locale, "stream.english.end.cancelled")}</>;
    case "NONE":
      return <>{t(locale, "stream.english.notStarted")}</>;
    case "ENDED":
    case "SETTLED":
      return <StreamTime seconds={auction.endTime} locale={locale} />;
  }
}

/** What the current bid says when nobody leads. */
function noBidKey(auction: OneOfOneAuction): MessageKey {
  if (auction.bids.length > 0) {
    return "stream.english.noHighBid";
  }
  return auction.state === "ACTIVE"
    ? "stream.english.noBid"
    : "stream.english.noBids";
}

/** The four numbers a bidder looks at first. */
function KeyFacts({ context }: { readonly context: EnglishPanelContext }) {
  const { auction, locale, label } = context;
  const finished = auction.state === "SETTLED" || auction.state === "CANCELLED";
  const won = auction.settlement?.outcome === "collector";
  const leader = auction.bidder;
  return (
    <dl className="tw-m-0 tw-mt-4 tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-3">
      <Fact
        label={t(
          locale,
          finished ? "stream.english.finalBid" : "stream.english.currentBid"
        )}
      >
        {leader === null ? (
          t(locale, noBidKey(auction))
        ) : (
          <EthAmount
            wei={auction.bid}
            locale={locale}
            className="tw-text-lg tw-font-semibold"
          />
        )}
      </Fact>
      <Fact
        label={t(
          locale,
          won ? "stream.english.winner" : "stream.english.leader"
        )}
      >
        {leader === null ? (
          t(locale, "stream.common.none")
        ) : (
          <KnownAddress address={leader} label={label} locale={locale} />
        )}
      </Fact>
      {auction.state === "ACTIVE" ? (
        <Fact label={t(locale, "stream.english.nextBid")}>
          <EthAmount wei={auction.minimumBid} locale={locale} />
        </Fact>
      ) : null}
      <Fact
        label={t(
          locale,
          auction.state === "ACTIVE" || auction.state === "PAUSED"
            ? "stream.english.ends"
            : "stream.english.endedAt"
        )}
      >
        <EndFact context={context} />
      </Fact>
    </dl>
  );
}

/** The two bidding rules, from the auction's locked terms. */
function Rules({ context }: { readonly context: EnglishPanelContext }) {
  const { auction, locale } = context;
  if (auction.state !== "ACTIVE") {
    return null;
  }
  return (
    <ul className="tw-m-0 tw-mt-3 tw-list-none tw-space-y-0.5 tw-p-0">
      <li className={STREAM_HELP}>
        {t(locale, "stream.english.rule.increment", {
          share: formatPercent(
            locale,
            auction.config.incrementShare / SPLITS_DENOMINATOR,
            1
          ),
          floor: formatEth(locale, auction.config.incrementFloor),
        })}
      </li>
      <li className={STREAM_HELP}>
        {t(locale, "stream.english.rule.antiSnipe", {
          minutes: formatInteger(
            locale,
            Math.round(auction.config.extensionWindow / 60)
          ),
        })}
      </li>
    </ul>
  );
}

function EditionsClose({ context }: { readonly context: EnglishPanelContext }) {
  const { editions, locale } = context;
  if (editions === null) {
    return null;
  }
  const minutes = formatInteger(
    locale,
    Math.round(editions.terms.closeOffset / 60)
  );
  const link = (
    <Link
      href={STREAM_ROUTES.edition(editions.edition)}
      className={`tw-text-primary-300 tw-no-underline hover:tw-underline ${STREAM_FOCUS}`}
    >
      {t(locale, "stream.english.times.editionsLink")}
    </Link>
  );
  if (editions.phase === "void") {
    return (
      <>
        {t(locale, "stream.english.times.editionsVoid")} {link}
      </>
    );
  }
  const extended =
    editions.times.softEnd !== null &&
    editions.times.softEnd > editions.times.closeAt;
  let rule: MessageKey = "stream.english.times.editionsAfter";
  if (context.auction.state === "PAUSED") {
    rule = "stream.english.times.editionsAfterResume";
  } else if (extended) {
    rule = "stream.english.times.editionsAfterSoft";
  }
  return (
    <>
      <StreamTime seconds={editions.times.endTime} locale={locale} />
      <span className="tw-block tw-text-xs tw-text-iron-400">
        {t(locale, rule, { minutes })}
      </span>
      {link}
    </>
  );
}

/** Start, scheduled end, final end, and the editions' close after it. */
function TimesTable({ context }: { readonly context: EnglishPanelContext }) {
  const { auction, editions, locale } = context;
  const resumed =
    auction.pause.used &&
    auction.pause.pausedAt === null &&
    auction.state !== "CANCELLED";
  let moved: MessageKey | null = null;
  if (resumed) {
    moved = "stream.english.times.movedByResume";
  } else if (auction.bids.some((bid) => bid.extended)) {
    moved = "stream.english.times.moved";
  }
  const rows: FactRow[] = [
    {
      key: "start",
      label: t(locale, "stream.english.times.start"),
      value: <StreamTime seconds={auction.startTime} locale={locale} />,
    },
    {
      key: "scheduled",
      label: t(locale, "stream.english.times.scheduled"),
      value: <StreamTime seconds={auction.scheduledEnd} locale={locale} />,
    },
    {
      key: "end",
      label: t(locale, "stream.english.times.end"),
      value:
        auction.state === "PAUSED" ? (
          <>
            <StreamTime seconds={auction.endTime} locale={locale} />
            <span className="tw-block tw-text-xs tw-text-amber-300">
              {t(locale, "stream.english.times.endPaused")}
            </span>
          </>
        ) : (
          <>
            <StreamTime seconds={auction.endTime} locale={locale} />
            {moved === null ? null : (
              <span className="tw-block tw-text-xs tw-text-primary-300">
                {t(locale, moved)}
              </span>
            )}
          </>
        ),
    },
  ];
  if (editions !== null) {
    rows.push({
      key: "editions",
      label: t(locale, "stream.english.times.editions"),
      value: <EditionsClose context={context} />,
    });
  }
  return (
    <div className="tw-mt-5">
      <FactTable
        caption={t(locale, "stream.english.times.title")}
        rows={rows}
      />
    </div>
  );
}

/**
 * The 1/1 English auction (`IEnglishAuction`): current bid, the next minimum,
 * the anti-snipe end, bid history, and every action a bidder, winner or
 * passer-by can take (bid, settle, claim delivery, withdraw, claim credits).
 */
export default function EnglishAuctionPanel({
  sale,
  locale,
  now,
}: {
  readonly sale: OneOfOneAuction;
  readonly locale: SupportedLocale;
  readonly now: number;
}) {
  const headingId = useId();
  const { data: work = null } = useStreamQuery("work", [sale.work], (source) =>
    source.getWork(sale.work)
  );
  const editionKey = work?.linked.edition ?? null;
  const { data: editions = null } = useStreamQuery(
    "edition-auction",
    [editionKey],
    (source) =>
      editionKey === null
        ? Promise.resolve(null)
        : source.getEditionAuction(editionKey)
  );
  const label = useAddressLabels(locale, work?.parties);
  const action = useStreamAction(locale);
  const context: EnglishPanelContext = {
    auction: sale,
    work,
    editions,
    locale,
    now,
    label,
    action,
  };
  return (
    <section
      className={`${STREAM_CARD} tw-p-4 sm:tw-p-5`}
      aria-labelledby={headingId}
    >
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
        <h2 id={headingId} className={`${STREAM_HEADING} tw-text-base`}>
          {t(locale, "stream.sale.english.title")}
        </h2>
        <SpecBadge spec={auctionStateBadge(sale.state)} locale={locale} />
      </div>
      <KeyFacts context={context} />
      <Rules context={context} />
      <div className="tw-mt-4">
        <EnglishStateBlock context={context} />
      </div>
      <ResumedNote context={context} />
      <Credits context={context} />
      <ActionMessage message={action.message} />
      <TimesTable context={context} />
      <BidHistory context={context} />
    </section>
  );
}
