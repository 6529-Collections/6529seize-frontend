"use client";

import { useState } from "react";

import { useStreamQuery } from "@/components/stream/data/StreamProvider";
import { editionsText, priceText } from "@/components/stream/editions/format";
import {
  PanelCard,
  PANEL_ACTION,
  PANEL_NOTE,
  StandingTag,
} from "@/components/stream/editions/parts";
import { STREAM_LABEL } from "@/components/stream/ui/styles";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type { EditionAuction, EditionStepTotal } from "@/lib/stream/types";

/** Out rows shown below the price line before "Show N lower prices". */
const LOW_ROWS = 4;

function PriceLine({
  auction,
  locale,
}: {
  readonly auction: EditionAuction;
  readonly locale: SupportedLocale;
}) {
  const { clearing, terms, totalUnits } = auction;
  const capped =
    terms.cap > 0 && clearing.count === terms.cap && totalUnits > terms.cap;
  return (
    <tr>
      <td colSpan={4} className="tw-p-0">
        <p className="tw-m-0 tw-flex tw-items-center tw-gap-2.5 tw-whitespace-nowrap tw-py-2.5 tw-text-[13px] tw-font-semibold tw-tabular-nums tw-text-success after:tw-h-0.5 after:tw-flex-1 after:tw-rounded-sm after:tw-bg-success after:tw-content-['']">
          {t(
            locale,
            capped
              ? "stream.editionAuction.book.lineCap"
              : "stream.editionAuction.book.line",
            {
              count: formatInteger(locale, clearing.count),
              price: priceText(locale, clearing.price),
            }
          )}
        </p>
      </td>
    </tr>
  );
}

function BookRow({
  row,
  mine,
  locale,
}: {
  readonly row: EditionStepTotal;
  readonly mine: number;
  readonly locale: SupportedLocale;
}) {
  const out = row.status === "out";
  return (
    <tr className="tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.07]">
      <td
        className={`tw-whitespace-nowrap tw-py-2 tw-pr-2 tw-font-semibold ${out ? "tw-text-iron-400" : "tw-text-iron-50"}`}
      >
        {priceText(locale, row.price)}
      </td>
      <td
        className={`tw-px-2 tw-py-2 ${out ? "tw-text-iron-400" : "tw-text-iron-200"}`}
      >
        {formatInteger(locale, row.units)}
        {mine > 0 ? (
          <span className="tw-ml-1.5 tw-whitespace-nowrap tw-text-xs tw-font-semibold tw-text-primary-300">
            {mine === row.units
              ? t(locale, "stream.editionAuction.book.allYours")
              : t(locale, "stream.editionAuction.book.yours", {
                  units: formatInteger(locale, mine),
                })}
          </span>
        ) : null}
      </td>
      <td
        className={`tw-px-2 tw-py-2 ${out ? "tw-text-iron-400" : "tw-text-iron-200"}`}
      >
        {formatInteger(locale, row.cumulative)}
      </td>
      <td className="tw-py-2 tw-pl-2 tw-text-right">
        <StandingTag won={row.won} qty={row.units} locale={locale} />
      </td>
    </tr>
  );
}

function Footer({
  auction,
  hidden,
  collapsible,
  expanded,
  onToggle,
  locale,
}: {
  readonly auction: EditionAuction;
  readonly hidden: number;
  readonly collapsible: boolean;
  readonly expanded: boolean;
  readonly onToggle: () => void;
  readonly locale: SupportedLocale;
}) {
  const { clearing } = auction;
  const gap = clearing.rationed && clearing.cutoff > clearing.cutStepUnits;
  return (
    <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-2">
      <div className="tw-min-w-0 tw-flex-1 tw-basis-64">
        <p className={PANEL_NOTE}>
          {t(locale, "stream.editionAuction.book.rule")}
        </p>
        {clearing.rationed ? (
          <p className={PANEL_NOTE}>
            {t(locale, "stream.editionAuction.book.queue")}
          </p>
        ) : null}
        {gap ? (
          <p className={PANEL_NOTE}>
            {t(locale, "stream.editionAuction.book.gap")}
          </p>
        ) : null}
      </div>
      {collapsible ? (
        <button
          type="button"
          className={PANEL_ACTION}
          onClick={onToggle}
          aria-expanded={expanded}
        >
          {toggleLabel(locale, expanded, hidden)}
        </button>
      ) : null}
    </div>
  );
}

function toggleLabel(
  locale: SupportedLocale,
  expanded: boolean,
  hidden: number
): string {
  if (expanded) {
    return t(locale, "stream.editionAuction.book.fewer");
  }
  return t(
    locale,
    hidden === 1
      ? "stream.editionAuction.book.moreOne"
      : "stream.editionAuction.book.moreOther",
    { count: formatInteger(locale, hidden) }
  );
}

/**
 * The order book: only prices that have bids, highest first, the green price
 * line under the clearing row, dimmed rows below it (four, then collapsed),
 * and the viewer's units on each row.
 */
export default function OrderBook({
  auction,
  mine,
  locale,
  id,
  className,
}: {
  readonly auction: EditionAuction;
  /** The viewer's live units per step. */
  readonly mine: ReadonlyMap<number, number>;
  readonly locale: SupportedLocale;
  readonly id: string;
  readonly className: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: rows } = useStreamQuery(
    "edition-step-totals",
    [auction.edition],
    (source) => source.stepTotals(auction.edition)
  );
  const aside =
    auction.bidCount === 0
      ? undefined
      : t(locale, "stream.editionAuction.book.aside", {
          bids: formatInteger(locale, auction.bidCount),
          wanted: editionsText(locale, auction.totalUnits),
        });
  // A cancelled 1/1 voids the sale: every bid is out and refunded in full.
  const isVoid = auction.phase === "void";
  const descending = [...(rows ?? [])]
    .reverse()
    .map((row) => (isVoid ? { ...row, status: "out" as const, won: 0 } : row));
  const outRows = descending.filter((row) => row.status === "out");
  const hidden = expanded ? 0 : Math.max(0, outRows.length - LOW_ROWS);
  const shownOut = new Set(
    (expanded ? outRows : outRows.slice(0, LOW_ROWS)).map((row) => row.step)
  );
  const visible = descending.filter(
    (row) => row.status !== "out" || shownOut.has(row.step)
  );
  return (
    <PanelCard
      id={id}
      title={t(locale, "stream.editionAuction.book.title")}
      aside={aside}
      className={className}
    >
      {descending.length === 0 ? (
        <p className="tw-m-0 tw-rounded-lg tw-border tw-border-dashed tw-border-white/10 tw-p-4 tw-text-sm tw-text-iron-400">
          {t(locale, "stream.editionAuction.book.empty")}
        </p>
      ) : (
        <>
          <div className="tw-overflow-x-auto">
            <table className="tw-w-full tw-border-collapse tw-text-left tw-text-sm tw-tabular-nums">
              <caption className="tw-sr-only">
                {t(locale, "stream.editionAuction.book.caption")}
              </caption>
              <thead>
                <tr className="tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.07]">
                  <th scope="col" className={`${STREAM_LABEL} tw-pb-2 tw-pr-2`}>
                    {t(locale, "stream.editionAuction.book.price")}
                  </th>
                  <th scope="col" className={`${STREAM_LABEL} tw-px-2 tw-pb-2`}>
                    {t(locale, "stream.editionAuction.book.editions")}
                  </th>
                  <th scope="col" className={`${STREAM_LABEL} tw-px-2 tw-pb-2`}>
                    {t(locale, "stream.editionAuction.book.total")}
                  </th>
                  <th scope="col" className="tw-pb-2 tw-pl-2">
                    <span className="tw-sr-only">
                      {t(locale, "stream.editionAuction.book.status")}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => [
                  <BookRow
                    key={row.step}
                    row={row}
                    mine={mine.get(row.step) ?? 0}
                    locale={locale}
                  />,
                  row.step === auction.clearing.step &&
                  auction.clearing.count > 0 &&
                  !isVoid ? (
                    <PriceLine
                      key={`${row.step}-line`}
                      auction={auction}
                      locale={locale}
                    />
                  ) : null,
                ])}
              </tbody>
            </table>
          </div>
          <Footer
            auction={auction}
            hidden={hidden}
            collapsible={outRows.length > LOW_ROWS}
            expanded={expanded}
            onToggle={() => setExpanded((value) => !value)}
            locale={locale}
          />
        </>
      )}
    </PanelCard>
  );
}
