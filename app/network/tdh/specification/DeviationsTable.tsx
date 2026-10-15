"use client";

import { useState, type ReactNode } from "react";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import {
  TDH_CHIP_BUTTON,
  TDH_CHIP_OFF,
  TDH_CHIP_ON,
  TDH_TABLE,
  TDH_TD_STACK_LG,
  TDH_TH,
} from "../shared/tdhStyles";
import { DEVIATIONS, type DeviationGroup } from "./specData";

type Filter = "all" | Exclude<DeviationGroup, "other">;

const FILTERS: readonly Filter[] = ["all", "changes", "kept"];
const DECISION_TONE: Record<string, string> = {
  adopted: "tw-bg-success",
  dev2: "tw-bg-primary-400",
  kept: "tw-bg-iron-400",
  dev13: "tw-bg-amber-400",
};

/** P26 §11: the 19 deviations, filterable by whether they changed values. */
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
        className="tw-flex tw-gap-2 tw-overflow-x-auto tw-pb-1"
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
      <div className="tw-mt-3 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07]">
        <table className={`${TDH_TABLE} tw-block lg:tw-table`}>
          <caption className="tw-sr-only" aria-live="polite">
            {t(locale, "network.tdh.spec.s11.tableCaption", {
              shown: formatInteger(locale, shown.length),
            })}
          </caption>
          <thead className="tw-hidden lg:tw-table-header-group">
            <tr>
              <th scope="col" className={TDH_TH}>
                {t(locale, "network.tdh.spec.s11.id")}
              </th>
              <th scope="col" className={TDH_TH}>
                {t(locale, "network.tdh.spec.s11.old")}
              </th>
              <th scope="col" className={TDH_TH}>
                {t(locale, "network.tdh.spec.s11.v1")}
              </th>
              <th scope="col" className={TDH_TH}>
                {t(locale, "network.tdh.spec.s11.effect")}
              </th>
              <th scope="col" className={TDH_TH}>
                {t(locale, "network.tdh.spec.s11.decision")}
              </th>
            </tr>
          </thead>
          <tbody className="tw-block lg:tw-table-row-group">
            {shown.map((row) => (
              <tr
                key={row.id}
                id={`dev-${row.id}`}
                className="tw-grid tw-scroll-mt-28 tw-gap-1 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-p-4 first:tw-border-t-0 target:tw-bg-primary-500/10 lg:tw-table-row lg:tw-p-0"
              >
                <th
                  scope="row"
                  className={`${TDH_TD_STACK_LG} tw-whitespace-nowrap tw-font-mono tw-text-[13px] tw-font-medium tw-text-iron-50`}
                >
                  {`DEV-${row.id}`}
                  {row.group === "changes" && (
                    <span className="tw-ml-2 tw-rounded-full tw-bg-amber-400/15 tw-px-2 tw-py-0.5 tw-font-sans tw-text-[11px] tw-text-amber-200 lg:tw-ml-0 lg:tw-mt-1.5 lg:tw-block lg:tw-w-max">
                      {t(locale, "network.tdh.spec.s11.filter.changes")}
                    </span>
                  )}
                </th>
                <Cell label={t(locale, "network.tdh.spec.s11.old")}>
                  {t(locale, key(row.id, "old"))}
                </Cell>
                <Cell label={t(locale, "network.tdh.spec.s11.v1")}>
                  {t(locale, key(row.id, "v1"))}
                </Cell>
                <Cell label={t(locale, "network.tdh.spec.s11.effect")}>
                  {t(locale, key(row.id, "effect"))}
                </Cell>
                <Cell label={t(locale, "network.tdh.spec.s11.decision")}>
                  <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-whitespace-nowrap tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium tw-text-iron-100">
                    <span
                      aria-hidden="true"
                      className={`tw-size-1.5 tw-rounded-full ${DECISION_TONE[row.decision] ?? "tw-bg-iron-400"}`}
                    />
                    {t(
                      locale,
                      `network.tdh.spec.decision.${row.decision}` as MessageKey
                    )}
                  </span>
                </Cell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(locale, "network.tdh.spec.decision.legend")}
      </p>
    </div>
  );
}

function Cell({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <td className={`${TDH_TD_STACK_LG}`}>
      <span
        aria-hidden="true"
        className="tw-mr-1 tw-text-xs tw-text-iron-500 lg:tw-hidden"
      >
        {label}:
      </span>
      {children}
    </td>
  );
}
