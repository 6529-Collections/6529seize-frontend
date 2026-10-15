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
  TDH_TABLE_FRAME,
  TDH_TD_STACK_MD,
  TDH_TH,
} from "../shared/tdhStyles";
import { VECTOR_TOPICS, VECTORS, type VectorTopic } from "./vectors";

type Filter = VectorTopic | "all";

const CELL = `${TDH_TD_STACK_MD} tw-block md:tw-table-cell`;

/** The 36 conformance vectors, filterable by topic (plan §9.3). */
export default function VectorBrowser({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const shown = VECTORS.filter(
    (vector) => filter === "all" || vector.topics.includes(filter)
  );
  const topic = (value: VectorTopic) =>
    t(locale, `network.tdh.impl.topic.${value}` as MessageKey);
  const count = (value: Filter) =>
    value === "all"
      ? VECTORS.length
      : VECTORS.filter((vector) => vector.topics.includes(value)).length;
  return (
    <div>
      <div
        role="group"
        aria-label={t(locale, "network.tdh.impl.vectors.filterLabel")}
        className="tw-flex tw-flex-wrap tw-gap-2"
      >
        {(["all", ...VECTOR_TOPICS] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={filter === option}
            onClick={() => setFilter(option)}
            className={`${TDH_CHIP_BUTTON} ${filter === option ? TDH_CHIP_ON : TDH_CHIP_OFF}`}
          >
            {option === "all"
              ? t(locale, "network.tdh.impl.vectors.all")
              : topic(option)}
            <span className="tw-rounded-full tw-bg-iron-800 tw-px-1.5 tw-text-xs tw-tabular-nums tw-text-iron-300">
              {formatInteger(locale, count(option))}
            </span>
          </button>
        ))}
      </div>
      <div className={`${TDH_TABLE_FRAME} tw-mt-4`}>
        <table className={`${TDH_TABLE} tw-block md:tw-table`}>
          <caption className="tw-sr-only" aria-live="polite">
            {t(locale, "network.tdh.impl.vectors.caption", {
              shown: formatInteger(locale, shown.length),
            })}
          </caption>
          <thead className="tw-hidden md:tw-table-header-group">
            <tr>
              <th scope="col" className={TDH_TH}>
                {t(locale, "network.tdh.impl.vectors.vector")}
              </th>
              <th scope="col" className={TDH_TH}>
                {t(locale, "network.tdh.impl.vectors.covers")}
              </th>
              <th scope="col" className={TDH_TH}>
                {t(locale, "network.tdh.impl.vectors.topics")}
              </th>
            </tr>
          </thead>
          <tbody className="tw-block md:tw-table-row-group">
            {shown.map((vector) => (
              <tr
                key={vector.id}
                className="tw-grid tw-gap-1.5 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-p-4 first:tw-border-t-0 md:tw-table-row md:tw-p-0"
              >
                <th
                  scope="row"
                  className={`${CELL} tw-break-all tw-font-mono tw-text-xs tw-font-normal tw-text-iron-50 md:tw-whitespace-nowrap md:tw-break-normal`}
                >
                  {vector.id}
                </th>
                <td className={CELL}>
                  {t(locale, `network.tdh.impl.v.${vector.id}` as MessageKey)}
                </td>
                <td className={CELL}>
                  <span className="tw-flex tw-flex-wrap tw-gap-1">
                    {vector.topics.map((value) => (
                      <span
                        key={value}
                        className="tw-rounded-full tw-bg-iron-800 tw-px-2 tw-py-0.5 tw-text-[11px] tw-text-iron-300"
                      >
                        {topic(value)}
                      </span>
                    ))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
