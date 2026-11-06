"use client";

import { useId } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import BodyPortalTooltip from "@/components/utils/tooltip/BodyPortalTooltip";
import UserPageSubscriptionsToggle from "./UserPageSubscriptionsToggle";

function SettingValue({
  loading,
  unavailable,
  value,
  tone,
}: Readonly<{
  loading: boolean;
  unavailable: boolean;
  value: string;
  tone: "positive" | "neutral";
}>) {
  const locale = useBrowserLocale();
  if (loading || unavailable) {
    return (
      <span
        data-setting-value
        className="tw-text-meta tw-font-normal tw-text-iron-400"
      >
        {t(
          locale,
          loading
            ? "subscriptions.settings.loading"
            : "subscriptions.details.unavailable"
        )}
      </span>
    );
  }
  return (
    <span
      data-setting-value
      className={`tw-inline-flex tw-items-center tw-gap-1.5 tw-text-meta tw-font-normal ${tone === "positive" ? "tw-text-emerald-400" : "tw-text-iron-300"}`}
    >
      {tone === "positive" && (
        <span
          aria-hidden="true"
          className="tw-size-1.5 tw-shrink-0 tw-rounded-full tw-bg-emerald-400"
        />
      )}
      {value}
    </span>
  );
}

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
  unavailable = false,
  offLabel,
  onLabel,
  ariaLabel,
  onChange,
  readOnly = false,
  readOnlyTone = "neutral",
}: Readonly<{
  label: string;
  layout?: "row" | "inline";
  labelNote?: string | undefined;
  detail?: string | undefined;
  description?: string | undefined;
  describedBy?: string | undefined;
  checked: boolean;
  disabled: boolean;
  busy: boolean;
  loading: boolean;
  unavailable?: boolean | undefined;
  offLabel: string;
  onLabel: string;
  ariaLabel: string;
  onChange: () => void;
  readOnly?: boolean;
  readOnlyTone?: "positive" | "neutral";
}>) {
  const id = useId();
  const toggleId = `${id}-toggle`;
  const sidebar = layout === "inline";
  const descriptionIds =
    [
      !loading && labelNote ? `${id}-note` : undefined,
      !loading && detail ? `${id}-detail` : undefined,
      description ? `${id}-description` : undefined,
      describedBy,
    ]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <div
      role="group"
      aria-labelledby={`${id}-label`}
      aria-busy={busy || loading}
      className={`tw-grid tw-min-w-0 tw-grid-cols-[minmax(0,1fr)_auto] tw-items-center tw-gap-x-4 tw-gap-y-1 ${sidebar ? "tw-py-3 lg:tw-py-0" : "tw-px-5 tw-py-3 max-md:tw-px-4"}`}
    >
      <h3
        id={`${id}-label`}
        className="tw-col-start-1 tw-m-0 tw-text-[15px] tw-font-medium tw-text-iron-100 md:tw-text-sm"
      >
        {label}
      </h3>
      <div className="tw-col-start-1 tw-row-start-2 tw-flex tw-min-w-0 tw-flex-wrap tw-items-baseline tw-gap-x-2 tw-gap-y-1">
        <span className="tw-inline-flex tw-items-center tw-gap-1">
          <SettingValue
            loading={loading}
            unavailable={unavailable}
            value={checked ? onLabel : offLabel}
            tone={readOnlyTone}
          />
          {description && (
            <>
              <button
                type="button"
                aria-label={label}
                aria-describedby={`${id}-description`}
                data-tooltip-id={`${id}-tooltip`}
                className="-tw-mx-3.5 -tw-my-3.5 tw-inline-flex tw-size-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-iron-100 md:-tw-mx-1.5 md:-tw-my-1.5 md:tw-size-7"
              >
                <InformationCircleIcon
                  className="tw-size-3.5"
                  aria-hidden="true"
                />
              </button>
              <BodyPortalTooltip
                id={`${id}-tooltip`}
                place="top"
                offset={8}
                delayShow={250}
                opacity={1}
                openEvents={{ mouseover: true, focus: true, click: true }}
                globalCloseEvents={{ escape: true, clickOutsideAnchor: true }}
                style={TOOLTIP_STYLES}
              >
                <span className="tw-block tw-max-w-[min(18rem,calc(100vw-2rem))] tw-text-pretty tw-text-meta tw-font-normal">
                  {description}
                </span>
              </BodyPortalTooltip>
            </>
          )}
        </span>
        {!loading && labelNote && (
          <>
            <span aria-hidden="true" className="tw-text-iron-600">
              ·
            </span>
            <span
              id={`${id}-note`}
              className="tw-text-meta tw-font-normal tw-tabular-nums tw-text-iron-500"
            >
              {labelNote}
            </span>
          </>
        )}
        {!loading && detail && (
          <>
            <span aria-hidden="true" className="tw-text-iron-600">
              ·
            </span>
            <span
              id={`${id}-detail`}
              className="tw-text-meta tw-font-normal tw-tabular-nums tw-text-iron-500"
            >
              {detail}
            </span>
          </>
        )}
      </div>
      {!readOnly && !unavailable && (
        <div
          data-setting-controls
          className="tw-col-start-2 tw-row-span-2 tw-row-start-1 tw-flex tw-items-center tw-justify-end"
        >
          {loading ? (
            <span
              aria-hidden="true"
              className="tw-h-6 tw-w-11 tw-animate-pulse tw-rounded-full tw-bg-iron-800 motion-reduce:tw-animate-none"
            />
          ) : (
            <UserPageSubscriptionsToggle
              id={toggleId}
              checked={checked}
              disabled={disabled}
              onChange={onChange}
              ariaLabel={ariaLabel}
              describedBy={descriptionIds}
            />
          )}
        </div>
      )}
      {description && (
        <span id={`${id}-description`} className="tw-sr-only">
          {description}
        </span>
      )}
    </div>
  );
}
