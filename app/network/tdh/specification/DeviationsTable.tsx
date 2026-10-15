"use client";

import { useState } from "react";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import {
  TDH_CHIP_BUTTON,
  TDH_CHIP_OFF,
  TDH_CHIP_ON,
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
      <ol className="tw-m-0 tw-mt-3 tw-list-none tw-space-y-3 tw-p-0">
        {shown.map((row) => (
          <li
            key={row.id}
            id={`dev-${row.id}`}
            className="tw-scroll-mt-28 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-p-4 target:tw-ring-1 target:tw-ring-primary-400/60 sm:tw-p-5"
          >
            <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
              <h3 className="tw-m-0 tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-font-mono tw-text-sm tw-font-semibold tw-text-iron-50">
                {`DEV-${row.id}`}
                {row.group === "changes" && (
                  <span className="tw-rounded-full tw-bg-amber-400/15 tw-px-2 tw-py-0.5 tw-font-sans tw-text-[11px] tw-font-medium tw-text-amber-200">
                    {t(locale, "network.tdh.spec.s11.filter.changes")}
                  </span>
                )}
              </h3>
              <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-whitespace-nowrap tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium tw-text-iron-100">
                <span className="tw-sr-only">
                  {t(locale, "network.tdh.spec.s11.decision")}:
                </span>
                <span
                  aria-hidden="true"
                  className={`tw-size-1.5 tw-rounded-full ${DECISION_TONE[row.decision] ?? "tw-bg-iron-400"}`}
                />
                {t(
                  locale,
                  `network.tdh.spec.decision.${row.decision}` as MessageKey
                )}
              </span>
            </div>
            <dl className="tw-m-0 tw-mt-3 tw-grid tw-gap-x-5 tw-gap-y-3 sm:tw-grid-cols-3">
              {(["old", "v1", "effect"] as const).map((field) => (
                <div key={field} className="tw-min-w-0">
                  <dt className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-500">
                    {t(locale, `network.tdh.spec.s11.${field}`)}
                  </dt>
                  <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-200">
                    {t(locale, key(row.id, field))}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ol>
      <p className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(locale, "network.tdh.spec.decision.legend")}
      </p>
    </div>
  );
}
