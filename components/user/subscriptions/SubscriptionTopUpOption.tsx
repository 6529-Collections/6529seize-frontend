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
      <span className="tw-col-start-1 tw-row-span-2 tw-row-start-1 tw-flex">
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
      <span className="tw-contents">
        {displayLabel && (
          <span
            className={`tw-col-start-2 tw-row-start-1 tw-self-end tw-text-[15px] tw-font-medium ${selected ? "tw-text-primary-300" : "tw-text-iron-100"}`}
          >
            {displayLabel}
          </span>
        )}
        <span className="tw-contents">
          <span
            className={`tw-col-start-2 ${displayLabel ? "tw-row-start-2 tw-self-start tw-text-meta tw-font-normal tw-leading-5 tw-text-iron-400" : "tw-row-span-2 tw-row-start-1 tw-text-[15px] tw-font-medium tw-text-iron-100"}`}
          >
            {cardCountLabel}
          </span>
          <span
            id={`${id}-amount`}
            className={`tw-col-start-3 tw-row-span-2 tw-row-start-1 tw-whitespace-nowrap tw-text-right tw-text-sm tw-font-normal tw-tabular-nums tw-leading-5 ${selected ? "tw-text-primary-300" : "tw-text-iron-400"}`}
          >
            {formatSubscriptionEth(locale, amountEth)}{" "}
            <span className="tw-text-sm tw-text-iron-500">
              {t(locale, "subscriptions.balance.ethUnit")}
            </span>
          </span>
        </span>
        {description && (
          <span
            id={`${id}-description`}
            className="tw-col-span-2 tw-col-start-2 tw-row-start-3 tw-mt-1 tw-text-meta tw-font-normal tw-leading-5 tw-text-iron-400"
          >
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
