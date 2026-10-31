"use client";

import Link from "next/link";

import { useStreamQuery } from "@/components/stream/data/StreamProvider";
import {
  Empty,
  Facts,
  Loading,
  NotFoundNote,
  PageHeader,
  PlaceholderNote,
  Section,
} from "@/components/stream/pages/common";
import { SalePanel } from "@/components/stream/sales/salePanels";
import { ArtistChip, AddressChip } from "@/components/stream/ui/AddressChip";
import MediaViewer from "@/components/stream/ui/MediaViewer";
import {
  SpecBadge,
  storageBadge,
  variantBadge,
} from "@/components/stream/ui/StatusBadge";
import {
  STREAM_CARD,
  STREAM_FOCUS,
  STREAM_HELP,
  STREAM_LABEL,
} from "@/components/stream/ui/styles";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger, formatUtcDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import { locatorDisplayUrl } from "@/lib/stream/media";
import type { StreamWork, WorkKey } from "@/lib/stream/types";
import { STREAM_ROUTES } from "@/lib/stream/workKey";

function RecordFacts({
  work,
  locale,
}: {
  readonly work: StreamWork;
  readonly locale: SupportedLocale;
}) {
  const yes = t(locale, "stream.common.yes");
  const no = t(locale, "stream.common.no");
  return (
    <Facts
      items={[
        {
          label: t(locale, "stream.work.collection"),
          value: work.collection
            ? t(locale, "stream.work.collectionSerial", {
                name: work.collection.name,
                serial: formatInteger(locale, work.collection.serial),
              })
            : t(locale, "stream.common.none"),
        },
        {
          label: t(locale, "stream.work.license"),
          value: work.license?.spdxId ?? t(locale, "stream.work.recordNotOpen"),
        },
        {
          label: t(locale, "stream.work.storage"),
          value: (
            <SpecBadge spec={storageBadge(work.storage)} locale={locale} />
          ),
        },
        {
          label: t(locale, "stream.work.finalized"),
          value: work.record?.finalized === true ? yes : no,
        },
        {
          label: t(locale, "stream.work.seed"),
          value: t(locale, `stream.work.seedPolicy.${work.seed.policy}`),
        },
        {
          label: t(locale, "stream.work.minted"),
          value:
            work.mintedAt === null
              ? t(locale, "stream.common.none")
              : formatUtcDate(locale, work.mintedAt * 1_000),
        },
      ]}
    />
  );
}

/** A copy's content address, linked through the 6529 media resolver; an on-chain copy has no URL. */
function LocatorText({
  uri,
  url,
  locale,
}: {
  readonly uri: string;
  readonly url: string | null;
  readonly locale: SupportedLocale;
}) {
  const text = "tw-min-w-0 tw-break-all tw-font-mono tw-text-xs";
  if (url === null) {
    return (
      <span className={`${text} tw-text-iron-300`}>
        {t(locale, "stream.locator.onChainCopy")}
      </span>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${text} tw-text-iron-200 hover:tw-text-iron-50 ${STREAM_FOCUS}`}
    >
      {uri}
    </a>
  );
}

function Locators({
  work,
  locale,
}: {
  readonly work: StreamWork;
  readonly locale: SupportedLocale;
}) {
  const primary = work.media.find((file) => file.role === "PRIMARY");
  if (!primary) {
    return <Empty text={t(locale, "stream.work.recordNotOpen")} />;
  }
  return (
    <ul className="tw-m-0 tw-list-none tw-space-y-1.5 tw-p-0">
      {primary.locators.map((locator, index) => (
        <li
          key={`${locator.kind}-${locator.uri}`}
          className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-2 tw-text-sm"
        >
          <span className={STREAM_LABEL}>
            {t(locale, `stream.locator.${locator.kind}`)}
          </span>
          <LocatorText
            uri={locator.uri}
            url={locatorDisplayUrl(locator)}
            locale={locale}
          />
          {index === primary.preferred ? (
            <span className="tw-text-xs tw-text-primary-300">
              {t(locale, "stream.locator.preferred")}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function Provenance({
  workKey,
  locale,
}: {
  readonly workKey: WorkKey;
  readonly locale: SupportedLocale;
}) {
  const { data: events } = useStreamQuery("provenance", [workKey], (source) =>
    source.provenance(workKey)
  );
  if (events === undefined) {
    return <Loading />;
  }
  if (events.length === 0) {
    return <Empty text={t(locale, "stream.work.noHistory")} />;
  }
  return (
    <ol className="tw-m-0 tw-list-none tw-space-y-2 tw-p-0">
      {[...events].reverse().map((event) => (
        <li
          key={`${event.txHash}-${event.kind}`}
          className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-3 tw-text-sm"
        >
          <span className="tw-tabular-nums tw-text-iron-400">
            {formatUtcDate(locale, event.at * 1_000, {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "UTC",
            })}
          </span>
          <span className="tw-text-iron-100">
            {t(locale, `stream.provenance.${event.kind}`)}
          </span>
        </li>
      ))}
    </ol>
  );
}

function WorkBody({
  work,
  locale,
}: {
  readonly work: StreamWork;
  readonly locale: SupportedLocale;
}) {
  const linked = work.linked.edition ?? work.linked.master;
  const lead = work.parties[0];
  return (
    <div>
      <PageHeader title={work.title}>
        <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-3">
          {lead ? (
            <ArtistChip
              artistId={lead.artistId}
              name={lead.displayName}
              locale={locale}
            />
          ) : null}
          <SpecBadge spec={variantBadge(work.variant)} locale={locale} />
          {work.burned ? (
            <span className="tw-text-xs tw-text-error">
              {t(locale, "stream.work.burned")}
            </span>
          ) : null}
        </div>
        {work.program === "federated" ? (
          <p className={`${STREAM_LABEL} tw-mt-3 tw-text-amber-200`}>
            {t(locale, "stream.status.federated")} ·{" "}
            {t(locale, "stream.federated.notCurated")}
          </p>
        ) : null}
        <PlaceholderNote locale={locale} />
      </PageHeader>
      <div className="tw-grid tw-gap-6 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <MediaViewer media={work.media} title={work.title} locale={locale} />
        <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-4">
          {work.sale === null ? null : (
            <SalePanel saleRef={work.sale} locale={locale} />
          )}
          {linked === null ? null : (
            <Link
              href={
                work.linked.edition === null
                  ? STREAM_ROUTES.work(linked)
                  : STREAM_ROUTES.edition(linked)
              }
              className={`${STREAM_CARD} tw-block tw-p-4 tw-text-sm tw-text-primary-300 tw-no-underline hover:tw-bg-iron-900 ${STREAM_FOCUS}`}
            >
              {t(
                locale,
                work.linked.edition === null
                  ? "stream.work.toMaster"
                  : "stream.work.toEdition"
              )}
            </Link>
          )}
          {work.owner === null ? null : (
            <p className={STREAM_HELP}>
              {t(locale, "stream.work.owner")}{" "}
              <AddressChip address={work.owner} locale={locale} />
            </p>
          )}
        </div>
      </div>
      <Section title={t(locale, "stream.work.record")}>
        <RecordFacts work={work} locale={locale} />
      </Section>
      <Section title={t(locale, "stream.work.copies")}>
        <Locators work={work} locale={locale} />
      </Section>
      {work.dispute.statements.length === 0 ? null : (
        <Section title={t(locale, "stream.work.statements")}>
          <ul className="tw-m-0 tw-list-none tw-space-y-2 tw-p-0">
            {work.dispute.statements.map((statement) => (
              <li
                key={statement.entryHash}
                className="tw-text-sm tw-text-iron-200"
              >
                {statement.summary}
              </li>
            ))}
          </ul>
        </Section>
      )}
      <Section title={t(locale, "stream.work.history")}>
        <Provenance workKey={work.key} locale={locale} />
      </Section>
    </div>
  );
}

/** /stream/works/[id]: every variant (Stream 1/1, Stream Editions, federated 721, 1155 and pair). */
export default function WorkPage({ workKey }: { readonly workKey: WorkKey }) {
  const locale = useBrowserLocale();
  const { data: work } = useStreamQuery("work", [workKey], (source) =>
    source.getWork(workKey)
  );
  if (work === undefined) {
    return <Loading />;
  }
  return work === null ? (
    <NotFoundNote locale={locale} />
  ) : (
    <WorkBody work={work} locale={locale} />
  );
}
