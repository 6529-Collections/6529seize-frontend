"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { formatSubscriptionEth } from "./coverage/subscriptionCoverage.helpers";
import styles from "./UserPageSubscriptions.module.css";

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
      className={`tw-relative tw-flex tw-min-h-[72px] tw-cursor-pointer tw-items-center tw-gap-3 tw-px-4 tw-py-3 tw-transition-colors tw-duration-300 tw-ease-out motion-reduce:tw-transition-none ${selected ? "tw-bg-primary-500/10 tw-ring-1 tw-ring-inset tw-ring-primary-400/40 desktop-hover:hover:tw-bg-primary-500/15" : "tw-bg-transparent desktop-hover:hover:tw-bg-iron-900"}`}
    >
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
        className={`${styles["radioInput"] ?? ""} tw-shrink-0 [&:not(:checked)]:tw-border-iron-500`}
      />
      <span className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-1">
        <span className="tw-min-w-0">
          <span className="tw-block tw-text-base tw-font-medium tw-text-iron-100">
            {cardCountLabel}
          </span>
          {displayLabel && (
            <span className="tw-mt-0.5 tw-block tw-text-sm tw-text-iron-400">
              {displayLabel}
            </span>
          )}
        </span>
        <span
          id={`${id}-amount`}
          className="tw-ml-auto tw-whitespace-nowrap tw-text-base tw-font-normal tw-tabular-nums tw-text-iron-100"
        >
          {formatSubscriptionEth(locale, amountEth)}{" "}
          <span className="tw-text-iron-400">
            {t(locale, "subscriptions.balance.ethUnit")}
          </span>
        </span>
        {description && (
          <span
            id={`${id}-description`}
            className="tw-basis-full tw-text-xs tw-leading-5 tw-text-iron-400"
          >
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
