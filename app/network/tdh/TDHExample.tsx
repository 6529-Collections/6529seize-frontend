"use client";

import { useState } from "react";

import Button from "@/components/utils/button/Button";
import { formatInteger, formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

import {
  calculateTdhExample,
  type TdhExampleDays,
  type TdhExampleRow,
} from "./tdh-example.helpers";

type TdhExampleMessageKey = Extract<
  MessageKey,
  `network.tdh.example.${string}`
>;

const m = (
  locale: SupportedLocale,
  key: TdhExampleMessageKey,
  params: Parameters<typeof t>[2] = {}
) => t(locale, key, params);

const CARD_NAME_KEYS: Record<TdhExampleRow["id"], TdhExampleMessageKey> = {
  firstGm: "network.tdh.example.card.firstGm",
  nakamoto: "network.tdh.example.card.nakamoto",
  gradient: "network.tdh.example.card.gradient",
};

export default function TDHExample({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const [days, setDays] = useState<TdhExampleDays>(0);
  const [sellNakamoto, setSellNakamoto] = useState(false);
  const result = calculateTdhExample(days, sellNakamoto);

  return (
    <section
      id="tdh-example"
      aria-labelledby="tdh-example-heading"
      className="tw-scroll-mt-24 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-py-8 sm:tw-py-10"
    >
      <div className="tw-grid tw-grid-cols-1 tw-items-start tw-gap-4 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,2.5fr)] lg:tw-gap-12">
        <div className="lg:tw-sticky lg:tw-top-28">
          <h2
            className="tw-m-0 tw-text-lg tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-100 sm:tw-text-xl"
            id="tdh-example-heading"
            tabIndex={-1}
          >
            {m(locale, "network.tdh.example.title")}
          </h2>
        </div>

        <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800/50 tw-bg-iron-900/55 tw-p-4 sm:tw-p-6">
          <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400">
            {m(locale, "network.tdh.example.intro")}
          </p>

          <div
            aria-label={m(locale, "network.tdh.example.periodLabel")}
            className="tw-mt-5 tw-flex tw-flex-wrap tw-gap-2"
            role="group"
          >
            {([0, 30] as const).map((period) => (
              <Button
                aria-pressed={days === period}
                key={period}
                onClick={() => setDays(period)}
                size="sm"
                variant={days === period ? "primary" : "secondary"}
              >
                {m(
                  locale,
                  period === 0
                    ? "network.tdh.example.today"
                    : "network.tdh.example.inThirtyDays"
                )}
              </Button>
            ))}
          </div>

          <label className="tw-mt-5 tw-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-3 tw-text-sm tw-leading-6 tw-text-iron-200">
            <input
              checked={sellNakamoto}
              className="tw-size-4 tw-accent-primary-500"
              onChange={(event) => setSellNakamoto(event.target.checked)}
              type="checkbox"
            />
            {m(locale, "network.tdh.example.sellNakamoto")}
          </label>

          <div
            aria-label={m(locale, "network.tdh.example.tableScrollLabel")}
            className="tw-mt-6 tw-overflow-x-auto"
            role="region"
            tabIndex={0}
          >
            <table className="tw-w-full tw-min-w-[34rem] tw-border-collapse tw-text-left tw-text-sm">
              <caption className="tw-sr-only">
                {m(locale, "network.tdh.example.tableCaption")}
              </caption>
              <thead>
                <tr className="tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.08] tw-text-xs tw-uppercase tw-tracking-wide tw-text-iron-500">
                  <th className="tw-pb-3 tw-pr-4 tw-font-medium" scope="col">
                    {m(locale, "network.tdh.example.cardColumn")}
                  </th>
                  <th className="tw-pb-3 tw-pr-4 tw-font-medium" scope="col">
                    {m(locale, "network.tdh.example.daysColumn")}
                  </th>
                  <th className="tw-pb-3 tw-pr-4 tw-font-medium" scope="col">
                    {m(locale, "network.tdh.example.rateColumn")}
                  </th>
                  <th className="tw-pb-3 tw-pr-4 tw-font-medium" scope="col">
                    {m(locale, "network.tdh.example.baseColumn")}
                  </th>
                  <th
                    className="tw-pb-3 tw-text-right tw-font-medium"
                    scope="col"
                  >
                    {m(locale, "network.tdh.example.finalColumn")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr
                    className="tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.06] last:tw-border-b-0"
                    key={row.id}
                  >
                    <th
                      className="tw-py-3 tw-pr-4 tw-font-medium tw-text-iron-200"
                      scope="row"
                    >
                      {m(locale, CARD_NAME_KEYS[row.id])}
                    </th>
                    <td className="tw-py-3 tw-pr-4 tw-font-mono tw-text-iron-300">
                      {formatInteger(locale, row.holdingDays + days)}
                    </td>
                    <td className="tw-py-3 tw-pr-4 tw-font-mono tw-text-iron-300">
                      {formatNumber(locale, row.rate, {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="tw-py-3 tw-pr-4 tw-font-mono tw-text-iron-300">
                      {formatNumber(locale, row.base, {
                        maximumFractionDigits: 3,
                      })}
                    </td>
                    <td className="tw-py-3 tw-text-right tw-font-mono tw-font-medium tw-text-iron-100">
                      {formatInteger(locale, row.final)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="tw-mt-5 tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-2">
            <div className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07] tw-bg-black/30 tw-p-4">
              <p className="tw-m-0 tw-text-xs tw-uppercase tw-tracking-wide tw-text-iron-500">
                {m(locale, "network.tdh.example.boostLabel")}
              </p>
              <p className="tw-mb-0 tw-mt-2 tw-font-mono tw-text-sm tw-text-iron-200">
                {m(locale, "network.tdh.example.multiplier", {
                  value: formatNumber(locale, result.boost, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }),
                })}
              </p>
              <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-500">
                {m(
                  locale,
                  sellNakamoto
                    ? "network.tdh.example.soldBoost"
                    : "network.tdh.example.intactBoost"
                )}
              </p>
            </div>
            <div className="tw-rounded-lg tw-border tw-border-primary-500/30 tw-bg-primary-500/[0.08] tw-p-4">
              <p className="tw-text-primary-200 tw-m-0 tw-text-xs tw-uppercase tw-tracking-wide">
                {m(locale, "network.tdh.example.totalLabel")}
              </p>
              <p className="tw-mb-0 tw-mt-1 tw-font-mono tw-text-2xl tw-font-semibold tw-text-white">
                {formatInteger(locale, result.total)}
              </p>
            </div>
          </div>

          <p className="tw-sr-only" role="status">
            {m(locale, "network.tdh.example.resultAnnouncement", {
              total: formatInteger(locale, result.total),
              boost: formatNumber(locale, result.boost, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
            })}
          </p>

          <p className="tw-mb-0 tw-mt-4 tw-text-xs tw-leading-5 tw-text-iron-500">
            {m(locale, "network.tdh.example.roundingNote")}
          </p>
          <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
            {m(
              locale,
              sellNakamoto
                ? "network.tdh.example.saleNote"
                : "network.tdh.example.futureNote"
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
