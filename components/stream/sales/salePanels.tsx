"use client";

import type { ComponentType, ReactNode } from "react";

import {
  useStreamNow,
  useStreamQuery,
} from "@/components/stream/data/StreamProvider";
import Countdown from "@/components/stream/ui/Countdown";
import EthAmount from "@/components/stream/ui/EthAmount";
import {
  auctionStateBadge,
  editionPhaseBadge,
  SpecBadge,
} from "@/components/stream/ui/StatusBadge";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import {
  STREAM_CARD,
  STREAM_HEADING,
  STREAM_LABEL,
} from "@/components/stream/ui/styles";
import type {
  EditionAuction,
  KnownSaleKind,
  OneOfOneAuction,
  SaleRef,
  SaleViewByKind,
} from "@/lib/stream/types";

/**
 * One panel per sale kind. Feature lanes replace these summaries with the full
 * bidding UIs; a new sale method adds one panel here and one mock adapter.
 */
interface SalePanelProps<K extends KnownSaleKind> {
  readonly sale: SaleViewByKind[K];
  readonly locale: SupportedLocale;
  readonly now: number;
}

const PANEL = `${STREAM_CARD} tw-p-4`;

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

function EnglishAuctionSummary({
  sale,
  locale,
  now,
}: SalePanelProps<"ENGLISH_AUCTION">) {
  const auction: OneOfOneAuction = sale;
  return (
    <section
      className={PANEL}
      aria-label={t(locale, "stream.sale.english.title")}
    >
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
        <h2 className={`${STREAM_HEADING} tw-text-base`}>
          {t(locale, "stream.sale.english.title")}
        </h2>
        <SpecBadge spec={auctionStateBadge(auction.state)} locale={locale} />
      </div>
      <dl className="tw-m-0 tw-mt-3 tw-grid tw-grid-cols-2 tw-gap-3">
        <Fact label={t(locale, "stream.sale.english.highBid")}>
          <EthAmount wei={auction.highBid} locale={locale} />
        </Fact>
        {auction.state === "ACTIVE" ? (
          <Fact label={t(locale, "stream.sale.english.minimumNext")}>
            <EthAmount wei={auction.minimumNextBid} locale={locale} />
          </Fact>
        ) : null}
        <Fact label={t(locale, "stream.sale.english.bids")}>
          {formatInteger(locale, auction.bids.length)}
        </Fact>
        <Fact label={t(locale, "stream.sale.english.end")}>
          <Countdown
            endTime={auction.endTime}
            now={now}
            locale={locale}
            closeWindow={auction.config.extensionWindow}
            extended={auction.endTime > auction.scheduledEnd}
          />
        </Fact>
      </dl>
    </section>
  );
}

function EditionAuctionSummary({
  sale,
  locale,
  now,
}: SalePanelProps<"UNIFORM_AUCTION">) {
  const auction: EditionAuction = sale;
  const { clearing } = auction;
  return (
    <section
      className={PANEL}
      aria-label={t(locale, "stream.sale.edition.title")}
    >
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
        <h2 className={`${STREAM_HEADING} tw-text-base`}>
          {t(locale, "stream.sale.edition.title")}
        </h2>
        <SpecBadge spec={editionPhaseBadge(auction.phase)} locale={locale} />
      </div>
      <p className="tw-m-0 tw-mt-3 tw-text-sm tw-text-iron-200">
        {clearing.count === 0
          ? t(locale, "stream.sale.edition.noneYet")
          : t(locale, "stream.sale.edition.rightNow", {
              count: formatInteger(locale, clearing.count),
            })}{" "}
        {clearing.count === 0 ? null : (
          <EthAmount wei={clearing.price} locale={locale} />
        )}
      </p>
      <dl className="tw-m-0 tw-mt-3 tw-grid tw-grid-cols-2 tw-gap-3">
        <Fact label={t(locale, "stream.sale.edition.raised")}>
          <EthAmount wei={clearing.revenue} locale={locale} />
        </Fact>
        <Fact label={t(locale, "stream.sale.edition.cap")}>
          {auction.terms.cap === 0
            ? t(locale, "stream.sale.edition.noCap")
            : formatInteger(locale, auction.terms.cap)}
        </Fact>
        <Fact label={t(locale, "stream.sale.edition.end")}>
          <Countdown
            endTime={auction.times.editionEnd}
            now={now}
            locale={locale}
            closeWindow={auction.terms.softWindow}
            extended={auction.phase === "extended"}
          />
        </Fact>
        <Fact label={t(locale, "stream.sale.edition.bids")}>
          {formatInteger(locale, auction.bidCount)}
        </Fact>
      </dl>
    </section>
  );
}

const SALE_PANELS: {
  readonly [K in KnownSaleKind]: ComponentType<SalePanelProps<K>>;
} = {
  ENGLISH_AUCTION: EnglishAuctionSummary,
  UNIFORM_AUCTION: EditionAuctionSummary,
};

/** Reads a sale of any kind and renders its registered panel. */
export function SalePanel({
  saleRef,
  locale,
}: {
  readonly saleRef: SaleRef;
  readonly locale: SupportedLocale;
}) {
  const now = useStreamNow();
  const { data } = useStreamQuery(
    "sale",
    [saleRef.kind, saleRef.saleId],
    (source) => source.getSale(saleRef)
  );
  if (data === undefined) {
    return (
      <div className={`${PANEL} tw-h-40 tw-animate-pulse`} aria-busy="true" />
    );
  }
  switch (data.kind) {
    case "ENGLISH_AUCTION":
      return (
        <SALE_PANELS.ENGLISH_AUCTION
          sale={data.sale}
          locale={locale}
          now={now}
        />
      );
    case "UNIFORM_AUCTION":
      return (
        <SALE_PANELS.UNIFORM_AUCTION
          sale={data.sale}
          locale={locale}
          now={now}
        />
      );
    case "unsupported":
      return (
        <p className={`${PANEL} tw-m-0 tw-text-sm tw-text-iron-300`}>
          {t(locale, "stream.sale.unsupported", { kind: data.ref.kind })}
        </p>
      );
  }
}
