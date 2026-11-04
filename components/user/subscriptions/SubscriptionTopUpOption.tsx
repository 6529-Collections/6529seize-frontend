"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { formatSubscriptionEth } from "./coverage/subscriptionCoverage.helpers";
import {
  getTopUpOptionClass,
  TOP_UP_RADIO_CLASS,
} from "./subscriptionTopUpStyles";

export default function SubscriptionTopUpOption({
  id,
  count,
  amountEth,
  badge,
  description,
  display,
  selected,
  onSelect,
}: Readonly<{
  id: string;
  count: number;
  amountEth: string;
  badge?: string | undefined;
  description?: string | undefined;
  display?: string | undefined;
  selected: boolean;
  onSelect: () => void;
}>) {
  const locale = useBrowserLocale();
  const cardCountLabel = t(
    locale,
    count === 1
      ? "subscriptions.topUp.cardCount.one"
      : "subscriptions.topUp.cardCount.many",
    { count: formatInteger(locale, count) }
  );
  const displayLabel = badge ?? display;
  const optionLabelKey =
    count === 1
      ? "subscriptions.topUp.cardOption.one"
      : "subscriptions.topUp.cardOption.many";
  const labelText = displayLabel
    ? t(locale, optionLabelKey, {
        count: formatInteger(locale, count),
        label: displayLabel,
      })
    : cardCountLabel;

  return (
    <label
      htmlFor={id}
      className={`${getTopUpOptionClass(selected)} tw-cursor-pointer`}
    >
      <span className="tw-absolute tw-right-4 tw-top-4 tw-flex">
        <input
          id={id}
          type="radio"
          name="subscription-top-up-card-count"
          value={count}
          checked={selected}
          onClick={() => {
            if (selected) onSelect();
          }}
          onChange={onSelect}
          aria-label={labelText}
          aria-describedby={
            description ? `${id}-amount ${id}-description` : `${id}-amount`
          }
          className={TOP_UP_RADIO_CLASS}
        />
      </span>
      <span className="tw-flex tw-min-h-20 tw-min-w-0 tw-flex-col tw-justify-between tw-gap-2 tw-pr-7">
        {displayLabel && (
          <span
            className={`tw-text-xs tw-font-medium tw-leading-4 ${selected ? "tw-text-primary-300" : "tw-text-iron-500"}`}
          >
            {displayLabel}
          </span>
        )}
        <span className="tw-mt-auto tw-flex tw-min-w-0 tw-flex-col tw-gap-1">
          <span className="tw-text-base tw-font-medium tw-leading-6 tw-text-iron-100">
            {cardCountLabel}
          </span>
          <span
            id={`${id}-amount`}
            className={`tw-whitespace-nowrap tw-text-sm tw-tabular-nums tw-leading-5 ${selected ? "tw-text-primary-300" : "tw-text-iron-400"}`}
          >
            {formatSubscriptionEth(locale, amountEth)}{" "}
            <span className="tw-text-xs tw-text-iron-500">
              {t(locale, "subscriptions.balance.ethUnit")}
            </span>
          </span>
        </span>
        {description && (
          <span
            id={`${id}-description`}
            className="tw-text-xs tw-leading-5 tw-text-iron-400"
          >
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
