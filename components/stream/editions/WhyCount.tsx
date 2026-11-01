"use client";

import { useStreamQuery } from "@/components/stream/data/StreamProvider";
import { priceText, shortEthText } from "@/components/stream/editions/format";
import { PanelCard, PANEL_NOTE } from "@/components/stream/editions/parts";
import { formatInteger, formatPercent } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import { SPLITS_DENOMINATOR } from "@/lib/stream/constants";
import type { EditionAuction, EditionCandidate } from "@/lib/stream/types";

/** Long books show the first, the most, the last and the rows around the result. */
const FULL_LIST = 9;
const AROUND = 3;

function keptIndexes(candidates: readonly EditionCandidate[]): number[] {
  const all = candidates.map((_, index) => index);
  if (candidates.length <= FULL_LIST) {
    return all;
  }
  const chosen = candidates.findIndex((candidate) => candidate.chosen);
  const best = candidates.findIndex((candidate) => candidate.best);
  const keep = new Set([0, best, candidates.length - 1]);
  for (let index = chosen - AROUND; index <= chosen + AROUND; index += 1) {
    keep.add(index);
  }
  return all.filter((index) => keep.has(index));
}

function CandidateRow({
  candidate,
  marker,
  locale,
}: {
  readonly candidate: EditionCandidate;
  readonly marker: number;
  readonly locale: SupportedLocale;
}) {
  let tag = "";
  if (candidate.chosen) {
    tag = t(locale, "stream.editionAuction.why.sells");
  } else if (candidate.best) {
    tag = t(locale, "stream.editionAuction.why.most");
  }
  const strong = candidate.chosen
    ? "tw-font-semibold tw-text-iron-50"
    : "tw-text-iron-200";
  return (
    <li className="tw-grid tw-grid-cols-[minmax(0,8.6em)_minmax(30px,1fr)_3.8em_3.6em] tw-items-center tw-gap-2 tw-text-[12.5px] tw-tabular-nums sm:tw-grid-cols-[minmax(0,9.5em)_minmax(40px,1fr)_4.2em_4.4em] sm:tw-gap-2.5 sm:tw-text-[13.5px]">
      <span className={`tw-truncate ${strong}`}>
        {t(locale, "stream.editionAuction.why.row", {
          count: formatInteger(locale, candidate.count),
          price: priceText(locale, candidate.price),
        })}
      </span>
      <span
        aria-hidden="true"
        className="tw-relative tw-h-2.5 tw-rounded-sm tw-bg-white/[0.04]"
      >
        <span
          className={`tw-absolute tw-inset-y-0 tw-left-0 tw-rounded-sm ${candidate.chosen ? "tw-bg-success" : "tw-bg-white/[0.16]"}`}
          style={{ width: `${Math.min(100, candidate.shareOfBestBps / 100)}%` }}
        />
        <span
          className="tw-absolute -tw-inset-y-1 tw-border-0 tw-border-l tw-border-dashed tw-border-iron-400"
          style={{ left: `${marker * 100}%` }}
        />
      </span>
      <span className={`tw-text-right ${strong}`}>
        {shortEthText(locale, candidate.revenue)}
      </span>
      <span
        className={`tw-text-[11.5px] tw-font-bold ${candidate.chosen ? "tw-text-success" : "tw-text-iron-400"}`}
      >
        {tag}
      </span>
    </li>
  );
}

function Verdict({
  auction,
  candidates,
  locale,
}: {
  readonly auction: EditionAuction;
  readonly candidates: readonly EditionCandidate[];
  readonly locale: SupportedLocale;
}) {
  const chosen = candidates.find((candidate) => candidate.chosen);
  const best = candidates.find((candidate) => candidate.best);
  if (chosen === undefined || best === undefined) {
    return null;
  }
  const { maxCount: cap } = auction.terms;
  const capBinds = cap > 0 && chosen.count === cap && auction.liveUnits > cap;
  return (
    <>
      <p className="tw-m-0 tw-mt-3.5 tw-text-sm tw-font-semibold tw-tabular-nums tw-text-iron-50">
        {chosen === best
          ? t(locale, "stream.editionAuction.why.verdictMost", {
              count: formatInteger(locale, chosen.count),
              price: priceText(locale, chosen.price),
            })
          : t(locale, "stream.editionAuction.why.verdictBreadth", {
              bestCount: formatInteger(locale, best.count),
              bestPrice: priceText(locale, best.price),
              count: formatInteger(locale, chosen.count),
              price: priceText(locale, chosen.price),
              margin: formatPercent(
                locale,
                auction.terms.marginShare / SPLITS_DENOMINATOR,
                0
              ),
            })}
      </p>
      {capBinds ? (
        <p className="tw-m-0 tw-mt-1 tw-text-sm tw-tabular-nums tw-text-iron-200">
          {t(locale, "stream.editionAuction.why.cap", {
            cap: formatInteger(locale, cap),
          })}
        </p>
      ) : null}
    </>
  );
}

function whyTitle(locale: SupportedLocale, auction: EditionAuction): string {
  const count = auction.clearing.count;
  if (count === 0 || auction.phase === "void") {
    return t(locale, "stream.editionAuction.why.title");
  }
  return t(
    locale,
    count === 1
      ? "stream.editionAuction.why.titleOne"
      : "stream.editionAuction.why.titleOther",
    { count: formatInteger(locale, count) }
  );
}

/**
 * "Why 80 editions": every possible result as editions × price = ETH raised,
 * as a bar list scaled to the most, with a dashed line at 90% of the most.
 */
export default function WhyCount({
  auction,
  locale,
  id,
  className,
}: {
  readonly auction: EditionAuction;
  readonly locale: SupportedLocale;
  readonly id: string;
  readonly className: string;
}) {
  const { data: candidates } = useStreamQuery(
    "edition-candidates",
    [auction.edition],
    (source) => source.candidates(auction.edition)
  );
  const title = whyTitle(locale, auction);
  const rows = auction.phase === "void" ? [] : (candidates ?? []);
  const marker = 1 - auction.terms.marginShare / SPLITS_DENOMINATOR;
  const kept = keptIndexes(rows);
  return (
    <PanelCard id={id} title={title} className={className}>
      {rows.length === 0 ? (
        <p className="tw-m-0 tw-rounded-lg tw-border tw-border-dashed tw-border-white/10 tw-p-4 tw-text-sm tw-text-iron-400">
          {t(
            locale,
            auction.phase === "void"
              ? "stream.editionAuction.why.void"
              : "stream.editionAuction.why.empty"
          )}
        </p>
      ) : (
        <>
          <p className={`${PANEL_NOTE} tw-mb-3.5`}>
            {t(locale, "stream.editionAuction.why.rule")}
          </p>
          <ul
            className="tw-m-0 tw-grid tw-list-none tw-gap-2 tw-p-0"
            aria-label={t(locale, "stream.editionAuction.why.listLabel")}
          >
            {kept.map((index, position) => {
              const candidate = rows[index];
              if (candidate === undefined) {
                return null;
              }
              const previous = kept[position - 1];
              const gap = previous !== undefined && index > previous + 1;
              return [
                gap ? (
                  <li
                    key={`gap-${index}`}
                    aria-hidden="true"
                    className="tw-text-xs tw-text-iron-500"
                  >
                    · · ·
                  </li>
                ) : null,
                <CandidateRow
                  key={candidate.step}
                  candidate={candidate}
                  marker={marker}
                  locale={locale}
                />,
              ];
            })}
          </ul>
          <Verdict auction={auction} candidates={rows} locale={locale} />
          <p className={`${PANEL_NOTE} tw-mt-1`}>
            {t(locale, "stream.editionAuction.why.note", {
              share: formatPercent(locale, marker, 0),
            })}
          </p>
        </>
      )}
    </PanelCard>
  );
}
