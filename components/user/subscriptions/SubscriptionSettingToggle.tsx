"use client";

import { useId } from "react";
import UserPageSubscriptionsToggle from "./UserPageSubscriptionsToggle";

export default function SubscriptionSettingToggle({
  label,
  layout = "row",
  labelNote,
  detail,
  description,
  describedBy,
  checked,
  disabled,
  busy,
  loading,
  offLabel,
  onLabel,
  ariaLabel,
  onChange,
}: Readonly<{
  label: string;
  layout?: "row" | "inline";
  labelNote?: string;
  detail?: string | undefined;
  description?: string | undefined;
  describedBy?: string | undefined;
  checked: boolean;
  disabled: boolean;
  busy: boolean;
  loading: boolean;
  offLabel: string;
  onLabel: string;
  ariaLabel: string;
  onChange: () => void;
}>) {
  const id = useId();
  const toggleId = `${id}-toggle`;
  const descriptionIds =
    [
      labelNote ? `${id}-note` : undefined,
      detail ? `${id}-detail` : undefined,
      description ? `${id}-description` : undefined,
      describedBy,
    ]
      .filter(Boolean)
      .join(" ") || undefined;
  const labelClass = `tw-inline-flex tw-min-h-11 tw-items-center tw-whitespace-nowrap tw-text-xs tw-font-medium sm:tw-text-sm ${disabled ? "tw-cursor-not-allowed" : "tw-cursor-pointer"}`;

  return (
    <div
      role="group"
      aria-labelledby={`${id}-label`}
      aria-busy={busy || loading}
      className={`tw-min-w-0 ${layout === "inline" ? "tw-py-4 xl:tw-py-2" : "tw-px-5 tw-py-3 max-md:tw-px-4"}`}
    >
      <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-3 tw-gap-y-1 xl:tw-justify-start">
        <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-1 xl:tw-flex-row xl:tw-items-baseline xl:tw-gap-2">
          <h3
            id={`${id}-label`}
            className="tw-m-0 tw-text-sm tw-font-normal tw-text-iron-400"
          >
            {label}
          </h3>
          {labelNote && (
            <span
              id={`${id}-note`}
              className="tw-text-xs tw-font-normal tw-text-iron-400"
            >
              {labelNote}
            </span>
          )}
        </div>
        <div
          data-setting-controls
          className="tw-ml-auto tw-flex tw-min-h-11 tw-items-center tw-gap-2 xl:tw-ml-0"
        >
          <label
            htmlFor={toggleId}
            className={`${labelClass} ${!loading && !checked ? "tw-text-iron-100" : "tw-text-iron-500"}`}
          >
            {offLabel}
          </label>
          <UserPageSubscriptionsToggle
            id={toggleId}
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            ariaLabel={ariaLabel}
            describedBy={descriptionIds}
          />
          <label
            htmlFor={toggleId}
            className={`${labelClass} ${!loading && checked ? "tw-text-iron-100" : "tw-text-iron-500"}`}
          >
            {onLabel}
          </label>
        </div>
      </div>
      {detail && (
        <span
          id={`${id}-detail`}
          className="tw-mt-1 tw-block tw-w-full tw-text-right tw-text-[13px] tw-font-normal tw-tabular-nums tw-text-iron-400"
        >
          {detail}
        </span>
      )}
      {description && (
        <p
          id={`${id}-description`}
          className="tw-mb-0 tw-mt-1 tw-w-full tw-text-pretty tw-text-[13px] tw-leading-5 tw-text-iron-500"
        >
          {description}
        </p>
      )}
    </div>
  );
}
