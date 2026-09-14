"use client";

import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { CollectAcquisitionStrategy } from "./collect.types";

const STRATEGIES: readonly CollectAcquisitionStrategy[] = [
  "buy",
  "match_bid",
  "improve_bid",
  "discount_ask",
  "blended",
];

export default function CollectStrategyPicker({
  value,
  locale,
  onChange,
}: {
  readonly value: CollectAcquisitionStrategy;
  readonly locale: SupportedLocale;
  readonly onChange: (strategy: CollectAcquisitionStrategy) => void;
}) {
  return (
    <div
      role="group"
      aria-label={t(locale, "collect.strategy.title")}
      className="tw-my-5 tw-space-y-3"
    >
      <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-200">
        {t(locale, "collect.strategy.title")}
      </p>
      <div className="tw-flex tw-flex-wrap tw-gap-2">
        {STRATEGIES.map((strategy) => (
          <button
            key={strategy}
            type="button"
            aria-pressed={value === strategy}
            onClick={() => onChange(strategy)}
            className={`tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-px-4 tw-py-2 tw-text-sm tw-font-medium focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 ${value === strategy ? "tw-border-iron-100 tw-bg-iron-100 tw-text-iron-950" : "tw-border-white/10 tw-bg-transparent tw-text-iron-300 hover:tw-bg-iron-900 hover:tw-text-iron-100"}`}
          >
            {t(locale, `collect.strategy.${strategy}`)}
          </button>
        ))}
      </div>
      <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
        {t(locale, `collect.strategy.help.${value}`)}
      </p>
    </div>
  );
}
