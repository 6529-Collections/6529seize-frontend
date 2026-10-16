"use client";

import { useState } from "react";
import { formatInteger, formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  HOUSEHOLD_SCENARIOS,
  householdScenario,
  type HouseholdScenario,
} from "../examples";
import {
  TDH_CHIP_BUTTON,
  TDH_CHIP_OFF,
  TDH_CHIP_ON,
  TDH_TABLE,
  TDH_TD,
  TDH_TD_NUM,
  TDH_TH,
  TDH_TH_NUM,
  tdhNarrowCell,
} from "../../shared/tdhStyles";
import TdhTableFrame from "../../shared/TdhTableFrame";
import ExplorableFrame from "./ExplorableFrame";

const BASELINE = householdScenario("identity");

function multiplier(locale: SupportedLocale, cents: number): string {
  return formatNumber(locale, cents / 100, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function summary(locale: SupportedLocale, scenario: HouseholdScenario): string {
  const result = householdScenario(scenario);
  const total = formatInteger(locale, result.total);
  const rate = (value: number) =>
    formatNumber(locale, value / 10_000, { maximumFractionDigits: 2 });
  if (scenario === "wallets") {
    const [a, b] = result.records;
    return t(locale, "network.tdh.how.s12.result.wallets", {
      a: formatInteger(locale, a?.final ?? 0),
      b: formatInteger(locale, b?.final ?? 0),
      total,
      gain: formatInteger(locale, BASELINE.total - result.total),
    });
  }
  if (scenario === "tomorrow") {
    return t(locale, "network.tdh.how.s12.result.tomorrow", {
      total,
      delta: formatInteger(locale, result.total - BASELINE.total),
      rate: rate(BASELINE.records[0]?.dailyRateE4 ?? 0),
    });
  }
  if (scenario === "sell") {
    const own =
      BASELINE.records[0]?.rows.find((row) => row.card === "gradient2")
        ?.final ?? 0;
    return t(locale, "network.tdh.how.s12.result.sell", {
      total,
      delta: formatInteger(locale, BASELINE.total - result.total),
      own: formatInteger(locale, own),
    });
  }
  return t(locale, "network.tdh.how.s12.result.identity", {
    total,
    rate: rate(result.records[0]?.dailyRateE4 ?? 0),
    tomorrow: formatInteger(
      locale,
      householdScenario("tomorrow").total - result.total
    ),
  });
}

/** Step 12: the same household as one identity, two wallets, tomorrow, or after a sale. */
export default function HouseholdWalkthrough({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const [scenario, setScenario] = useState<HouseholdScenario>("identity");
  const result = householdScenario(scenario);
  return (
    <ExplorableFrame
      locale={locale}
      title={t(locale, "network.tdh.how.s12.scenarios")}
      onReset={() => setScenario("identity")}
    >
      <div
        role="group"
        aria-label={t(locale, "network.tdh.how.s12.scenarios")}
        className="tw-flex tw-flex-wrap tw-gap-2"
      >
        {HOUSEHOLD_SCENARIOS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={scenario === option}
            onClick={() => setScenario(option)}
            className={`${TDH_CHIP_BUTTON} ${scenario === option ? TDH_CHIP_ON : TDH_CHIP_OFF}`}
          >
            {t(locale, `network.tdh.how.s12.scenario.${option}`)}
          </button>
        ))}
      </div>
      {/* One record fills the panel; two sit side by side from lg. */}
      <div
        className={`tw-mt-4 tw-grid tw-gap-4 ${result.records.length > 1 ? "lg:tw-grid-cols-2" : ""}`}
      >
        {result.records.map((record) => (
          <TdhTableFrame
            key={record.label}
            label={t(
              locale,
              `network.tdh.how.s12.recordCaption.${record.label}`,
              {
                boost: multiplier(locale, record.betaCents),
              }
            )}
          >
            <table className={TDH_TABLE}>
              <caption className="tw-px-3 tw-py-2.5 tw-text-left tw-text-sm tw-font-medium tw-text-iron-200 sm:tw-px-4">
                {t(
                  locale,
                  `network.tdh.how.s12.recordCaption.${record.label}`,
                  {
                    boost: multiplier(locale, record.betaCents),
                  }
                )}
              </caption>
              <thead>
                <tr>
                  <th scope="col" className={tdhNarrowCell(TDH_TH)}>
                    {t(locale, "network.tdh.how.s12.card")}
                  </th>
                  <th scope="col" className={tdhNarrowCell(TDH_TH_NUM)}>
                    {t(locale, "network.tdh.how.s12.base")}
                  </th>
                  <th scope="col" className={tdhNarrowCell(TDH_TH_NUM)}>
                    {t(locale, "network.tdh.how.s12.final")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {record.rows.map((row) => (
                  <tr key={row.card}>
                    <th
                      scope="row"
                      className={`${tdhNarrowCell(TDH_TD)} tw-font-normal`}
                    >
                      {t(locale, `network.tdh.how.s12.card.${row.card}`)}
                    </th>
                    <td className={tdhNarrowCell(TDH_TD_NUM)}>
                      {formatInteger(locale, row.base)}
                    </td>
                    <td className={tdhNarrowCell(TDH_TD_NUM)}>
                      {formatInteger(locale, row.final)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <th
                    scope="row"
                    className={`${tdhNarrowCell(TDH_TD)} tw-border-b-0 tw-font-semibold tw-text-iron-50`}
                  >
                    {t(locale, "network.tdh.how.s12.total")}
                  </th>
                  <td
                    className={`${tdhNarrowCell(TDH_TD_NUM)} tw-border-b-0 tw-font-semibold tw-text-iron-50`}
                  >
                    {formatInteger(locale, record.base)}
                  </td>
                  <td
                    className={`${tdhNarrowCell(TDH_TD_NUM)} tw-border-b-0 tw-font-semibold tw-text-iron-50`}
                  >
                    {formatInteger(locale, record.final)}
                  </td>
                </tr>
              </tbody>
            </table>
          </TdhTableFrame>
        ))}
      </div>
      <p
        aria-live="polite"
        className="tw-m-0 tw-mt-4 tw-min-h-[3rem] tw-max-w-[38em] tw-text-sm tw-leading-6 tw-text-iron-200"
      >
        {summary(locale, scenario)}
      </p>
    </ExplorableFrame>
  );
}
