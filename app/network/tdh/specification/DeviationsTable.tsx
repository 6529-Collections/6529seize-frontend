"use client";

import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useState, useSyncExternalStore } from "react";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import {
  TDH_CHIP_BUTTON,
  TDH_CHIP_OFF,
  TDH_CHIP_ON,
  TDH_FOCUS_RING,
  TDH_TABLE,
  TDH_TH,
} from "../shared/tdhStyles";
import CaseSafe from "../shared/CaseSafe";
import { TDH_TONE_DOT, type TdhTone } from "../shared/TdhStatusPill";
import previewStyles from "../shared/tdhRowsPreview.module.css";
import { DEVIATIONS, type DeviationGroup } from "./specData";

type Filter = "all" | Exclude<DeviationGroup, "other">;

/** Rows shown inline before "Show all 19 differences". */
const PREVIEW_ROWS = 3;

const FILTERS: readonly Filter[] = ["all", "changes", "kept"];
/**
 * In the one TDH status palette: adopted, green; the spec winning over the
 * old backend, a decision that changes values, blue; the old behaviour kept,
 * grey, informational.
 */
const DECISION_TONE: Record<string, TdhTone> = {
  adopted: "success",
  dev2: "primary",
  kept: "neutral",
  dev13: "neutral",
};

const CELL =
  "tw-block tw-border-0 tw-p-0 tw-align-top xl:tw-table-cell xl:tw-border-b xl:tw-border-solid xl:tw-border-white/[0.05] xl:tw-px-4 xl:tw-py-3";

function Decision({
  locale,
  decision,
}: {
  readonly locale: SupportedLocale;
  readonly decision: string;
}) {
  return (
    <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-whitespace-nowrap tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-px-2 tw-py-0.5 tw-font-sans tw-text-xs tw-font-medium tw-text-iron-100">
      <span className="tw-sr-only">
        {t(locale, "network.tdh.spec.s11.decision")}:
      </span>
      <span
        aria-hidden="true"
        className={`tw-size-2 tw-shrink-0 tw-rounded-full ${TDH_TONE_DOT[DECISION_TONE[decision] ?? "neutral"]}`}
      />
      {t(locale, `network.tdh.spec.decision.${decision}` as MessageKey)}
    </span>
  );
}

/** The deviations that can change values: open from the start on phones. */
const OPEN_AT_FIRST: ReadonlySet<number> = new Set(
  DEVIATIONS.filter((row) => row.group === "changes").map((row) => row.id)
);

/** The deviation a `#dev-2` address names, if any. */
function hashDeviation(): number | null {
  const match = /^#dev-(\d+)$/.exec(window.location.hash);
  return match?.[1] ? Number(match[1]) : null;
}

function subscribeToHash(onChange: () => void): () => void {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

/**
 * P26 §11: the 19 deviations, filterable by whether they changed values. One
 * table: a dense grid of rows from `xl`; below it, one line per deviation
 * (its id, whether it can change values, and its rule in a line) that opens
 * to the whole entry. Those that can change values start open, and a link
 * to `#dev-2` opens its row.
 */
export default function DeviationsTable({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  // The row the address names opens; a row the reader toggled keeps the
  // reader's choice.
  const target = useSyncExternalStore(
    subscribeToHash,
    hashDeviation,
    () => null
  );
  const [toggled, setToggled] = useState<ReadonlyMap<number, boolean>>(
    () => new Map()
  );
  const isOpenRow = (id: number) =>
    toggled.get(id) ?? (OPEN_AT_FIRST.has(id) || target === id);
  const toggle = (id: number) =>
    setToggled((current) => new Map(current).set(id, !isOpenRow(id)));
  const [all, setAll] = useState(false);
  const shown = DEVIATIONS.filter(
    (row) => filter === "all" || row.group === filter
  );
  // The first rows inline; every row once the reader asks, picks a filter,
  // or follows a link to a row.
  // Every row stays in the document (a chip's #dev-14 must resolve); the
  // rows after the first are hidden by CSS while the table is limited.
  const limited = !all && filter === "all" && target === null;
  const key = (id: number, field: string) =>
    `network.tdh.spec.dev.${id}.${field}` as MessageKey;
  return (
    <div>
      <div
        role="group"
        aria-label={t(locale, "network.tdh.spec.s11.filterLabel")}
        className="tw-flex tw-flex-wrap tw-gap-2"
      >
        {FILTERS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={filter === option}
            onClick={() => setFilter(option)}
            className={`${TDH_CHIP_BUTTON} tw-shrink-0 ${filter === option ? TDH_CHIP_ON : TDH_CHIP_OFF}`}
          >
            {t(locale, `network.tdh.spec.s11.filter.${option}`)}
          </button>
        ))}
      </div>
      <p className="tw-sr-only" aria-live="polite">
        {t(locale, "network.tdh.spec.s11.tableCaption", {
          shown: formatInteger(locale, shown.length),
        })}
      </p>
      <div
        className={`tw-mt-3 xl:tw-overflow-hidden xl:tw-rounded-lg xl:tw-border xl:tw-border-solid xl:tw-border-white/[0.07] ${limited ? (previewStyles["collapsed"] ?? "") : ""}`}
      >
        <table
          className={`${TDH_TABLE} tw-block xl:tw-table xl:tw-table-fixed`}
          aria-label={t(locale, "network.tdh.spec.s11.tableCaption", {
            shown: formatInteger(locale, shown.length),
          })}
        >
          <thead className="tw-hidden xl:tw-table-header-group">
            <tr>
              <th scope="col" className={`${TDH_TH} tw-w-[5.5rem]`}>
                {t(locale, "network.tdh.spec.s11.id")}
              </th>
              {(["old", "v1", "effect"] as const).map((field) => (
                <th key={field} scope="col" className={TDH_TH}>
                  {t(locale, `network.tdh.spec.s11.${field}`)}
                </th>
              ))}
              <th scope="col" className={`${TDH_TH} tw-w-[13rem]`}>
                {t(locale, "network.tdh.spec.s11.decision")}
              </th>
            </tr>
          </thead>
          <tbody className="tw-grid tw-grid-cols-[minmax(0,1fr)] tw-gap-2 xl:tw-table-row-group">
            {shown.map((row, index) => {
              const isOpen = isOpenRow(row.id);
              const body = `dev-${row.id}-body`;
              return (
                <tr
                  key={row.id}
                  id={`dev-${row.id}`}
                  data-tdh-more-row={index >= PREVIEW_ROWS ? "" : undefined}
                  className="tw-grid tw-scroll-mt-28 tw-grid-cols-[minmax(0,1fr)] tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-px-4 tw-py-2 target:tw-ring-1 target:tw-ring-primary-400/60 sm:tw-grid-cols-3 xl:tw-table-row xl:tw-rounded-none xl:tw-border-0 xl:tw-bg-transparent xl:tw-p-0"
                >
                  <th
                    scope="row"
                    className={`${CELL} tw-min-w-0 tw-font-mono tw-text-sm tw-font-semibold tw-text-iron-50 sm:tw-col-span-3 xl:tw-table-cell`}
                  >
                    {/* Below xl the row's head opens and closes it. */}
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={body}
                      onClick={() => toggle(row.id)}
                      className={`tw-flex tw-min-h-11 tw-w-full tw-items-center tw-gap-2 tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-font-mono tw-text-sm tw-font-semibold tw-text-iron-50 xl:tw-hidden ${TDH_FOCUS_RING}`}
                    >
                      <ChevronRightIcon
                        aria-hidden="true"
                        className={`tw-size-4 tw-shrink-0 tw-text-iron-400 tw-transition-transform motion-reduce:tw-transition-none ${isOpen ? "tw-rotate-90" : ""}`}
                      />
                      <span className="tw-shrink-0">{`DEV-${row.id}`}</span>
                      {row.group === "changes" ? (
                        <span className="tw-inline-block tw-shrink-0 tw-whitespace-nowrap tw-rounded-full tw-bg-amber-400/15 tw-px-2 tw-py-0.5 tw-font-sans tw-text-xs tw-font-medium tw-text-amber-200">
                          {t(locale, "network.tdh.spec.s11.filter.changes")}
                        </span>
                      ) : null}
                      {/* A one-line preview of the rule, cut with an ellipsis
                          on purpose: the whole text is in the row it opens. */}
                      <span
                        className={`tw-min-w-0 tw-flex-1 tw-truncate tw-font-sans tw-text-sm tw-font-normal tw-text-iron-300 ${isOpen ? "tw-invisible" : ""}`}
                        aria-hidden="true"
                        data-tdh-check-ignore="text-escapes-frame text-clipped"
                      >
                        {t(locale, key(row.id, "v1"))}
                      </span>
                    </button>
                    <span className="tw-hidden xl:tw-block">{`DEV-${row.id}`}</span>
                    {isOpen && (
                      <span className="tw-mt-1 tw-block xl:tw-hidden">
                        <Decision locale={locale} decision={row.decision} />
                      </span>
                    )}
                  </th>
                  {(["old", "v1", "effect"] as const).map((field) => (
                    <td
                      key={field}
                      id={field === "old" ? body : undefined}
                      className={`${CELL} tw-min-w-0 ${isOpen ? "" : "max-xl:tw-hidden"} max-xl:tw-pb-2`}
                    >
                      <span className="tw-block tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400 xl:tw-hidden">
                        <CaseSafe
                          text={t(locale, `network.tdh.spec.s11.${field}`)}
                        />
                      </span>
                      {/* From xl the ID column is narrow: the "can change
                        values" mark moves to the head of the effect. */}
                      {field === "effect" && row.group === "changes" && (
                        <span className="tw-mb-1 tw-hidden tw-whitespace-nowrap tw-rounded-full tw-bg-amber-400/15 tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium tw-text-amber-200 xl:tw-inline-block">
                          {t(locale, "network.tdh.spec.s11.filter.changes")}
                        </span>
                      )}
                      <span className="tw-mt-1 tw-block tw-text-sm tw-leading-6 tw-text-iron-200 xl:tw-mt-0">
                        {t(locale, key(row.id, field))}
                      </span>
                    </td>
                  ))}
                  <td className={`${CELL} tw-hidden xl:tw-table-cell`}>
                    <Decision locale={locale} decision={row.decision} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filter === "all" && target === null && (
        <button
          type="button"
          aria-expanded={!limited}
          onClick={() => setAll((value) => !value)}
          className={`tw-mt-2 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-0 tw-text-sm tw-font-medium tw-text-primary-300 hover:tw-text-primary-400 ${TDH_FOCUS_RING}`}
        >
          {limited
            ? t(locale, "network.tdh.spec.s11.showAll", {
                count: formatInteger(locale, DEVIATIONS.length),
              })
            : t(locale, "network.tdh.spec.s11.showFewer")}
          <ChevronDownIcon
            aria-hidden="true"
            className={`tw-size-4 tw-transition-transform motion-reduce:tw-transition-none ${limited ? "" : "tw-rotate-180"}`}
          />
        </button>
      )}
      <p className="tw-m-0 tw-mt-3 tw-max-w-[36em] tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "network.tdh.spec.decision.legend")}
      </p>
    </div>
  );
}
