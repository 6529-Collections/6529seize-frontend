"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  type LiveClose,
  partyNames,
  thumbnailOf,
  type WorkSales,
} from "@/components/stream/browse/reads";
import {
  EditionClose,
  editionResultText,
  EditionTag,
  OneOfOneClose,
  OneOfOneTag,
  oneOfOneValueText,
  WorkCell,
  workHref,
} from "@/components/stream/browse/cells";
import StreamTable from "@/components/stream/browse/StreamTable";
import {
  useStreamNow,
  useStreamQuery,
} from "@/components/stream/data/StreamProvider";
import { endingSoon, readHomeBoard } from "@/components/stream/home/homeBoard";
import { aboutHref } from "@/components/stream/layout/streamNavigation";
import { Empty, Loading, Section } from "@/components/stream/pages/common";
import {
  STREAM_CARD,
  STREAM_FOCUS,
  STREAM_HEADING,
  STREAM_HELP,
  STREAM_LABEL,
} from "@/components/stream/ui/styles";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatUtcDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type { UnixSeconds } from "@/lib/stream/types";
import { STREAM_ROUTES } from "@/lib/stream/workKey";

function SaleRow({
  label,
  value,
  close,
}: {
  readonly label: string;
  readonly value: ReactNode;
  readonly close: ReactNode;
}) {
  return (
    <div className="tw-contents">
      <dt className={`${STREAM_LABEL} tw-pt-0.5`}>{label}</dt>
      <dd className="tw-m-0 tw-min-w-0">
        <span className="tw-block tw-truncate tw-font-medium tw-text-iron-50">
          {value}
        </span>
        <span className="tw-mt-0.5 tw-block tw-text-xs tw-text-iron-300">
          {close}
        </span>
      </dd>
    </div>
  );
}

/** A live work: image, title, artists, and each live auction's price and close. */
function LiveCard({
  sales,
  now,
  locale,
}: {
  readonly sales: WorkSales;
  readonly now: UnixSeconds;
  readonly locale: SupportedLocale;
}) {
  const { work, oneOfOne, edition } = sales;
  const href = workHref(work);
  const image = thumbnailOf(work);
  return (
    <article
      className={`${STREAM_CARD} tw-flex tw-h-full tw-flex-col tw-gap-3 tw-p-3`}
    >
      <Link href={href} tabIndex={-1} aria-hidden="true" className="tw-block">
        <span className="tw-relative tw-block tw-aspect-square tw-w-full tw-overflow-hidden tw-rounded-lg tw-bg-iron-900">
          {image === null ? null : (
            <Image
              src={image}
              alt=""
              fill
              unoptimized
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="tw-object-cover"
            />
          )}
        </span>
      </Link>
      <div className="tw-min-w-0">
        <h3 className={`${STREAM_HEADING} tw-truncate tw-text-base`}>
          <Link
            href={href}
            className={`tw-text-iron-50 tw-no-underline hover:tw-underline ${STREAM_FOCUS}`}
          >
            {work.title}
          </Link>
        </h3>
        <p className={`${STREAM_HELP} tw-truncate`}>{partyNames(work)}</p>
      </div>
      <dl className="tw-m-0 tw-mt-auto tw-grid tw-grid-cols-[auto_minmax(0,1fr)] tw-items-start tw-gap-x-4 tw-gap-y-3 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-pt-3 tw-text-sm tw-tabular-nums">
        {oneOfOne === null ? null : (
          <SaleRow
            label={t(locale, "stream.browse.oneOfOne")}
            value={oneOfOneValueText(locale, oneOfOne)}
            close={
              <OneOfOneClose auction={oneOfOne} now={now} locale={locale} />
            }
          />
        )}
        {edition === null ? null : (
          <SaleRow
            label={t(locale, "stream.browse.editions")}
            value={
              <Link
                href={STREAM_ROUTES.edition(edition.edition)}
                className={`tw-text-iron-50 tw-no-underline hover:tw-underline ${STREAM_FOCUS}`}
              >
                {editionResultText(locale, edition)}
              </Link>
            }
            close={<EditionClose auction={edition} now={now} locale={locale} />}
          />
        )}
      </dl>
    </article>
  );
}

function LiveGrid({
  live,
  now,
  locale,
}: {
  readonly live: readonly WorkSales[];
  readonly now: UnixSeconds;
  readonly locale: SupportedLocale;
}) {
  if (live.length === 0) {
    return <Empty text={t(locale, "stream.home.liveEmpty")} />;
  }
  return (
    <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-4 tw-p-0 sm:tw-grid-cols-2 lg:tw-grid-cols-3">
      {live.map((sales) => (
        <li key={sales.work.key} className="tw-min-w-0">
          <LiveCard sales={sales} now={now} locale={locale} />
        </li>
      ))}
    </ul>
  );
}

function EndingSoonTable({
  closes,
  now,
  locale,
}: {
  readonly closes: readonly LiveClose[];
  readonly now: UnixSeconds;
  readonly locale: SupportedLocale;
}) {
  if (closes.length === 0) {
    return <Empty text={t(locale, "stream.home.endingSoonEmpty")} />;
  }
  return (
    <StreamTable
      caption={t(locale, "stream.home.endingSoon")}
      columns={[
        { key: "work", label: t(locale, "stream.browse.col.work") },
        { key: "auction", label: t(locale, "stream.browse.col.auction") },
        {
          key: "now",
          label: t(locale, "stream.browse.col.now"),
          numeric: true,
        },
        {
          key: "closes",
          label: t(locale, "stream.browse.col.closes"),
          numeric: true,
        },
      ]}
      rows={closes.map((close) => ({
        key: `${close.sales.work.key}:${close.auction}`,
        cells: [
          <WorkCell
            key="work"
            href={workHref(close.sales.work)}
            title={close.sales.work.title}
            detail={partyNames(close.sales.work)}
            thumbnail={thumbnailOf(close.sales.work)}
          />,
          ...closingCells(close, now, locale),
        ],
      }))}
    />
  );
}

/** The auction, its price now and its countdown, for one closing auction. */
function closingCells(
  { sales, auction }: LiveClose,
  now: UnixSeconds,
  locale: SupportedLocale
): ReactNode[] {
  if (auction === "edition" && sales.edition !== null) {
    return [
      t(locale, "stream.browse.editions"),
      editionResultText(locale, sales.edition),
      <EditionClose
        key="close"
        auction={sales.edition}
        now={now}
        locale={locale}
      />,
    ];
  }
  if (sales.oneOfOne === null) {
    return [null, null, null];
  }
  return [
    t(locale, "stream.browse.oneOfOne"),
    oneOfOneValueText(locale, sales.oneOfOne),
    <OneOfOneClose
      key="close"
      auction={sales.oneOfOne}
      now={now}
      locale={locale}
    />,
  ];
}

function ResultsTable({
  results,
  locale,
}: {
  readonly results: readonly WorkSales[];
  readonly locale: SupportedLocale;
}) {
  if (results.length === 0) {
    return <Empty text={t(locale, "stream.home.resultsEmpty")} />;
  }
  return (
    <StreamTable
      caption={t(locale, "stream.home.results")}
      columns={[
        { key: "work", label: t(locale, "stream.browse.col.work") },
        { key: "oneOfOne", label: t(locale, "stream.browse.oneOfOne") },
        { key: "editions", label: t(locale, "stream.browse.editions") },
        {
          key: "settled",
          label: t(locale, "stream.browse.col.settled"),
          wide: true,
        },
      ]}
      rows={results.map(({ work, oneOfOne, edition }) => ({
        key: work.key,
        cells: [
          <WorkCell
            key="work"
            href={workHref(work)}
            title={work.title}
            detail={partyNames(work)}
            thumbnail={thumbnailOf(work)}
          />,
          oneOfOne === null ? null : (
            <span
              key="oneOfOne"
              className="tw-flex tw-flex-wrap tw-items-center tw-gap-2"
            >
              <OneOfOneTag auction={oneOfOne} locale={locale} />
              {oneOfOne.settlement?.outcome === "collector" ? (
                <span className="tw-whitespace-nowrap">
                  {oneOfOneValueText(locale, oneOfOne)}
                </span>
              ) : null}
            </span>
          ),
          edition === null ? (
            t(locale, "stream.browse.none")
          ) : (
            <span
              key="editions"
              className="tw-flex tw-flex-wrap tw-items-center tw-gap-2"
            >
              <EditionTag auction={edition} locale={locale} />
              {edition.clearing.count > 0 ? (
                <span className="tw-whitespace-nowrap">
                  {editionResultText(locale, edition)}
                </span>
              ) : null}
            </span>
          ),
          oneOfOne?.settlement
            ? formatUtcDate(locale, oneOfOne.settlement.at * 1_000)
            : null,
        ],
      }))}
    />
  );
}

const ORIENTATION = [
  { page: "overview", key: "stream" },
  { page: "editions", key: "editions" },
  { page: "federated", key: "federated" },
] as const;

/** Three lines on the three products, each linking to its explainer. */
function Orientation({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <dl className="tw-m-0 tw-grid tw-gap-3 sm:tw-grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:tw-gap-x-6">
      {ORIENTATION.map((entry) => (
        <div key={entry.key} className="tw-contents">
          <dt className="tw-text-sm tw-font-semibold">
            <Link
              href={aboutHref(entry.page)}
              className={`tw-text-iron-50 tw-underline tw-underline-offset-2 hover:tw-text-primary-300 ${STREAM_FOCUS}`}
            >
              {t(locale, `stream.home.about.${entry.key}.name`)}
            </Link>
          </dt>
          <dd className="tw-m-0 tw-mb-2 tw-text-sm tw-leading-6 tw-text-iron-300 sm:tw-mb-0">
            {t(locale, `stream.home.about.${entry.key}.line`)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** /stream: a collector's front page. The live work grid comes first. */
export default function StreamHomePage() {
  const locale = useBrowserLocale();
  const now = useStreamNow();
  const { data: board } = useStreamQuery("home-board", [], readHomeBoard);
  return (
    <div>
      <h1 className="tw-sr-only">{t(locale, "stream.home.title")}</h1>
      {board === undefined ? (
        <Loading />
      ) : (
        <>
          <Section title={t(locale, "stream.home.live")}>
            <LiveGrid live={board.live} now={now} locale={locale} />
          </Section>
          <Section title={t(locale, "stream.home.endingSoon")}>
            <EndingSoonTable
              closes={endingSoon(board.live, now)}
              now={now}
              locale={locale}
            />
          </Section>
          <Section title={t(locale, "stream.home.results")}>
            <ResultsTable results={board.results} locale={locale} />
          </Section>
        </>
      )}
      <Section title={t(locale, "stream.home.orientation")}>
        <Orientation locale={locale} />
      </Section>
    </div>
  );
}
