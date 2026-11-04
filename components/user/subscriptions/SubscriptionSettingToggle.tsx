"use client";

import { useId } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import UserPageSubscriptionsToggle from "./UserPageSubscriptionsToggle";

function EditableSettingControls({
  toggleId,
  checked,
  disabled,
  loading,
  offLabel,
  onLabel,
  ariaLabel,
  describedBy,
  onChange,
  sidebar,
}: Readonly<{
  toggleId: string;
  checked: boolean;
  disabled: boolean;
  loading: boolean;
  offLabel: string;
  onLabel: string;
  ariaLabel: string;
  describedBy: string | undefined;
  onChange: () => void;
  sidebar: boolean;
}>) {
  const labelClass = `tw-inline-flex tw-min-h-11 tw-min-w-0 tw-items-center tw-text-[13px] tw-leading-5 sm:tw-text-sm ${sidebar ? "lg:tw-min-h-7 lg:tw-text-[13px]" : ""} ${disabled ? "tw-cursor-not-allowed" : "tw-cursor-pointer"}`;

  return (
    <>
      <div
        className={
          sidebar
            ? "tw-contents lg:tw-col-start-1 lg:tw-row-start-2 lg:tw-flex lg:tw-items-center lg:tw-gap-2"
            : "tw-contents"
        }
      >
        <label
          htmlFor={toggleId}
          className={`tw-order-1 ${labelClass} ${!loading && !checked ? "tw-font-semibold tw-text-iron-100" : "tw-font-normal tw-text-iron-500"}`}
        >
          {offLabel}
        </label>
        {sidebar && (
          <span
            aria-hidden="true"
            className="tw-order-2 tw-hidden tw-text-iron-600 lg:tw-inline"
          >
            /
          </span>
        )}
        <label
          htmlFor={toggleId}
          className={`tw-order-3 ${labelClass} ${!loading && checked ? "tw-font-semibold tw-text-iron-100" : "tw-font-normal tw-text-iron-500"}`}
        >
          {onLabel}
        </label>
      </div>
      <div
        className={`tw-order-2 tw-flex tw-items-center ${sidebar ? "lg:tw-col-start-2 lg:tw-row-span-2 lg:tw-row-start-1 lg:tw-flex lg:tw-items-center lg:tw-justify-end" : ""}`}
      >
        <UserPageSubscriptionsToggle
          id={toggleId}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          ariaLabel={ariaLabel}
          describedBy={describedBy}
        />
      </div>
    </>
  );
}

function ReadOnlySettingValue({
  loading,
  value,
  tone,
}: Readonly<{
  loading: boolean;
  value: string;
  tone: "positive" | "neutral";
}>) {
  const locale = useBrowserLocale();
  if (loading) {
    return (
      <span data-setting-value className="tw-text-sm tw-text-iron-400">
        {t(locale, "subscriptions.settings.loading")}
      </span>
    );
  }
  return (
    <span
      data-setting-value
      className={`tw-inline-flex tw-items-center tw-gap-1.5 tw-text-right tw-text-sm tw-font-medium lg:tw-text-[13px] lg:tw-font-normal ${tone === "positive" ? "tw-text-emerald-400" : "tw-text-iron-300"}`}
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

function getSettingLayoutClasses(sidebar: boolean, readOnly: boolean) {
  const sidebarGroup = readOnly
    ? "lg:tw-flex lg:tw-flex-wrap lg:tw-items-baseline lg:tw-gap-x-2"
    : "lg:tw-grid lg:tw-grid-cols-[minmax(0,1fr)_auto]";
  const editableContent = `tw-flex tw-min-w-0 tw-flex-col tw-items-start tw-gap-2 ${sidebar ? "lg:tw-contents" : ""}`;
  const readOnlyControls = `tw-ml-auto tw-flex tw-min-h-6 tw-items-center tw-gap-2 md:max-lg:tw-ml-0 ${sidebar ? "lg:tw-ml-0" : ""}`;
  const editableControls = `tw-grid tw-min-h-11 tw-max-w-full tw-grid-cols-[minmax(0,max-content)_auto_minmax(0,max-content)] tw-items-center tw-gap-2 ${sidebar ? "lg:tw-contents" : ""}`;
  return {
    group: `tw-min-w-0 ${sidebar ? "tw-py-3 lg:tw-py-0 lg:tw-gap-x-2 lg:tw-gap-y-0.5" : "tw-px-5 tw-py-3 max-md:tw-px-4"} ${readOnly ? "tw-grid tw-grid-cols-[minmax(0,1fr)_auto] tw-items-center tw-gap-x-3 tw-gap-y-1 md:max-lg:tw-flex md:max-lg:tw-flex-wrap" : ""} ${sidebar ? sidebarGroup : ""}`,
    content: readOnly ? "tw-contents" : editableContent,
    label: `tw-flex tw-min-w-0 ${readOnly ? "tw-flex-col tw-gap-1 md:tw-min-h-6 md:tw-justify-center" : "tw-min-h-6 tw-flex-wrap tw-items-baseline tw-gap-x-2 tw-gap-y-1"} ${sidebar ? "lg:tw-col-start-1 lg:tw-row-start-1 lg:tw-basis-full" : ""}`,
    heading: `tw-m-0 tw-text-sm tw-font-normal tw-text-iron-400 ${sidebar ? "lg:tw-font-medium lg:tw-leading-5 lg:tw-text-iron-100" : ""}`,
    controls: readOnly ? readOnlyControls : editableControls,
    supportingText: sidebar ? "lg:tw-mt-0 lg:tw-text-left" : "",
  };
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
  offLabel,
  onLabel,
  ariaLabel,
  onChange,
  readOnly = false,
  readOnlyTone = "neutral",
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
  readOnly?: boolean;
  readOnlyTone?: "positive" | "neutral";
}>) {
  const id = useId();
  const toggleId = `${id}-toggle`;
  const sidebar = layout === "inline";
  const classes = getSettingLayoutClasses(sidebar, readOnly);
  const descriptionIds =
    [
      labelNote ? `${id}-note` : undefined,
      detail ? `${id}-detail` : undefined,
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
      className={classes.group}
    >
      <div className={classes.content}>
        <div className={classes.label}>
          <h3 id={`${id}-label`} className={classes.heading}>
            {label}
          </h3>
          {labelNote && !readOnly && (
            <span
              id={`${id}-note`}
              className="tw-text-xs tw-font-medium tw-tabular-nums tw-text-iron-300"
            >
              {labelNote}
            </span>
          )}
        </div>
        <div
          data-setting-controls={readOnly ? undefined : ""}
          className={classes.controls}
        >
          {readOnly ? (
            <ReadOnlySettingValue
              loading={loading}
              value={checked ? onLabel : offLabel}
              tone={readOnlyTone}
            />
          ) : (
            <EditableSettingControls
              toggleId={toggleId}
              checked={checked}
              disabled={disabled}
              loading={loading}
              offLabel={offLabel}
              onLabel={onLabel}
              ariaLabel={ariaLabel}
              describedBy={descriptionIds}
              onChange={onChange}
              sidebar={sidebar}
            />
          )}
        </div>
      </div>
      {readOnly && !loading && labelNote && (
        <span
          id={`${id}-note`}
          className={`tw-col-span-full tw-block tw-text-right tw-text-xs tw-font-normal tw-tabular-nums tw-text-iron-400 md:max-lg:tw-w-full md:max-lg:tw-text-left lg:tw-text-[13px] ${classes.supportingText}`}
        >
          {labelNote}
        </span>
      )}
      {detail && (!readOnly || !loading) && (
        <span
          id={`${id}-detail`}
          className={`tw-block tw-text-right tw-text-[13px] tw-font-normal tw-tabular-nums tw-text-iron-400 ${readOnly ? "tw-col-span-full md:max-lg:tw-w-full md:max-lg:tw-text-left" : "tw-col-span-full tw-mt-1 tw-w-full"} ${classes.supportingText}`}
        >
          {detail}
        </span>
      )}
      {description && (
        <p
          id={`${id}-description`}
          className="tw-col-span-full tw-mb-0 tw-mt-1 tw-w-full tw-text-pretty tw-text-[13px] tw-leading-5 tw-text-iron-500"
        >
          {description}
        </p>
      )}
    </div>
  );
}
