"use client";

import { useState } from "react";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import {
  TDH_CHIP_BUTTON,
  TDH_CHIP_OFF,
  TDH_CHIP_ON,
  TDH_TABLE,
  TDH_TH,
} from "../shared/tdhStyles";
import { TDH_TONE_DOT, type TdhTone } from "../shared/TdhStatusPill";
import { DEVIATIONS, type DeviationGroup } from "./specData";

type Filter = "all" | Exclude<DeviationGroup, "other">;

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

/**
 * P26 §11: the 19 deviations, filterable by whether they changed values. One
 * table: a dense grid of rows from `lg`, a card per deviation below, with
 * each row's anchor (`#dev-2`) in both.
 */
export default function DeviationsTable({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const shown = DEVIATIONS.filter(
    (row) => filter === "all" || row.group === filter
  );
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
      <div className="tw-mt-3 xl:tw-overflow-hidden xl:tw-rounded-lg xl:tw-border xl:tw-border-solid xl:tw-border-white/[0.07]">
        <table
          className={`${TDH_TABLE} tw-block xl:tw-table xl:tw-table-fixed`}
          aria-label={t(locale, "network.tdh.spec.s11.tableCaption", {
            shown: formatInteger(locale, shown.length),
          })}
        >
          <thead className="tw-hidden xl:tw-table-header-group">
            <tr>
              <th scope="col" className={`${TDH_TH} tw-w-[8.5rem]`}>
                {t(locale, "network.tdh.spec.s11.id")}
              </th>
              {(["old", "v1", "effect"] as const).map((field) => (
                <th key={field} scope="col" className={TDH_TH}>
                  {t(locale, `network.tdh.spec.s11.${field}`)}
                </th>
              ))}
              <th scope="col" className={`${TDH_TH} tw-w-[11rem]`}>
                {t(locale, "network.tdh.spec.s11.decision")}
              </th>
            </tr>
          </thead>
          <tbody className="tw-grid tw-gap-3 xl:tw-table-row-group">
            {shown.map((row) => (
              <tr
                key={row.id}
                id={`dev-${row.id}`}
                className="tw-grid tw-scroll-mt-28 tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-p-4 target:tw-ring-1 target:tw-ring-primary-400/60 sm:tw-grid-cols-3 xl:tw-table-row xl:tw-rounded-none xl:tw-border-0 xl:tw-bg-transparent xl:tw-p-0"
              >
                <th
                  scope="row"
                  className={`${CELL} tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-font-mono tw-text-sm tw-font-semibold tw-text-iron-50 sm:tw-col-span-3 xl:tw-table-cell`}
                >
                  <span className="tw-block">{`DEV-${row.id}`}</span>
                  {row.group === "changes" && (
                    <span className="tw-inline-block tw-whitespace-nowrap tw-rounded-full tw-bg-amber-400/15 tw-px-2 tw-py-0.5 tw-font-sans tw-text-xs tw-font-medium tw-text-amber-200">
                      {t(locale, "network.tdh.spec.s11.filter.changes")}
                    </span>
                  )}
                  <span className="xl:tw-hidden">
                    <Decision locale={locale} decision={row.decision} />
                  </span>
                </th>
                {(["old", "v1", "effect"] as const).map((field) => (
                  <td key={field} className={`${CELL} tw-min-w-0`}>
                    <span className="tw-block tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400 xl:tw-hidden">
                      {t(locale, `network.tdh.spec.s11.${field}`)}
                    </span>
                    <span className="tw-mt-1 tw-block tw-text-sm tw-leading-6 tw-text-iron-200 xl:tw-mt-0">
                      {t(locale, key(row.id, field))}
                    </span>
                  </td>
                ))}
                <td className={`${CELL} tw-hidden xl:tw-table-cell`}>
                  <Decision locale={locale} decision={row.decision} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="tw-m-0 tw-mt-3 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(locale, "network.tdh.spec.decision.legend")}
      </p>
    </div>
  );
}
