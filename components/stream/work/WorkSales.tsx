"use client";

import Link from "next/link";

import {
  useStreamNow,
  useStreamQuery,
} from "@/components/stream/data/StreamProvider";
import { SalePanel } from "@/components/stream/sales/salePanels";
import Countdown from "@/components/stream/ui/Countdown";
import EthAmount from "@/components/stream/ui/EthAmount";
import {
  auctionStateBadge,
  SpecBadge,
} from "@/components/stream/ui/StatusBadge";
import {
  STREAM_CARD,
  STREAM_FOCUS,
  STREAM_HELP,
  STREAM_LABEL,
  STREAM_TEXT,
} from "@/components/stream/ui/styles";
import { formatStreamTime } from "@/components/stream/work/StreamTime";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type { StreamWork, WorkKey } from "@/lib/stream/types";
import { STREAM_ROUTES } from "@/lib/stream/workKey";

/**
 * The sale slot of a master: its edition auction, rendered by the sale-panel
 * registry like any other sale (the edition-auction lane owns that panel).
 */
function LinkedEditionSale({
  editionKey,
  locale,
}: {
  readonly editionKey: WorkKey;
  readonly locale: SupportedLocale;
}) {
  const { data: edition } = useStreamQuery("work", [editionKey], (source) =>
    source.getWork(editionKey)
  );
  if (!edition?.sale) {
    return null;
  }
  return <SalePanel saleRef={edition.sale} locale={locale} />;
}

/** On an edition: the 1/1 it follows, which sets when its auction closes. */
function MasterRelation({
  masterKey,
  editionKey,
  locale,
}: {
  readonly masterKey: WorkKey;
  readonly editionKey: WorkKey;
  readonly locale: SupportedLocale;
}) {
  const now = useStreamNow();
  const { data: auction } = useStreamQuery(
    "auction-for-work",
    [masterKey],
    (source) => source.auctionForWork(masterKey)
  );
  const { data: editions } = useStreamQuery(
    "edition-auction",
    [editionKey],
    (source) => source.getEditionAuction(editionKey)
  );
  if (!auction) {
    return null;
  }
  return (
    <section
      className={`${STREAM_CARD} tw-p-4`}
      aria-label={t(locale, "stream.workSales.master")}
    >
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
        <p className={STREAM_LABEL}>{t(locale, "stream.workSales.master")}</p>
        <SpecBadge spec={auctionStateBadge(auction.state)} locale={locale} />
      </div>
      <p className={`${STREAM_TEXT} tw-mt-2 tw-flex tw-flex-wrap tw-gap-x-3`}>
        {auction.highBidder === null ? (
          t(locale, "stream.english.noBid")
        ) : (
          <EthAmount wei={auction.highBid} locale={locale} />
        )}
        {auction.state === "ACTIVE" ? (
          <Countdown
            endTime={auction.endTime}
            now={now}
            locale={locale}
            closeWindow={auction.config.extensionWindow}
            extended={auction.endTime > auction.scheduledEnd}
          />
        ) : null}
      </p>
      {editions ? (
        <p className={`${STREAM_HELP} tw-mt-1`}>
          {t(locale, "stream.workSales.masterRule", {
            minutes: formatInteger(
              locale,
              Math.round(editions.terms.offset / 60)
            ),
            time: formatStreamTime(locale, editions.times.editionEnd),
          })}
        </p>
      ) : null}
      <Link
        href={STREAM_ROUTES.work(masterKey)}
        className={`tw-mt-2 tw-inline-block tw-text-sm tw-text-primary-300 tw-no-underline hover:tw-underline ${STREAM_FOCUS}`}
      >
        {t(locale, "stream.work.toMaster")}
      </Link>
    </section>
  );
}

/**
 * The sale panels a work page hosts, through the sale-panel registry: the
 * token's own sale, then the linked one (a master's edition auction, or an
 * edition's 1/1). An unknown sale kind renders as "unsupported".
 */
export default function WorkSales({
  work,
  locale,
}: {
  readonly work: StreamWork;
  readonly locale: SupportedLocale;
}) {
  const isEdition = work.standard === "ERC1155";
  return (
    <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-4">
      {work.sale === null ? (
        <p className={`${STREAM_CARD} ${STREAM_TEXT} tw-p-4`}>
          {t(locale, "stream.workSales.none")}
        </p>
      ) : (
        <SalePanel saleRef={work.sale} locale={locale} />
      )}
      {isEdition && work.linked.master !== null ? (
        <MasterRelation
          masterKey={work.linked.master}
          editionKey={work.key}
          locale={locale}
        />
      ) : null}
      {!isEdition && work.linked.edition !== null ? (
        <LinkedEditionSale editionKey={work.linked.edition} locale={locale} />
      ) : null}
    </div>
  );
}
