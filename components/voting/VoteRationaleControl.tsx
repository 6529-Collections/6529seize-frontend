"use client";

import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import { useId, type ReactNode } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { VoteControlVariant } from "./VotePanel";

const VARIANT_STYLES = {
  default: {
    layout: "tw-flex tw-flex-col",
    label: "tw-min-h-9 touch-only:tw-min-h-11 max-sm:tw-text-sm",
    panel: "",
    spacing: "tw-pt-1.5",
    field: "tw-text-sm tw-leading-5",
    height: "tw-h-24",
    minHeight: "tw-min-h-24",
    rows: 4,
    action: "tw-mt-4",
  },
  compact: {
    layout:
      "tw-grid tw-grid-cols-[minmax(0,1fr)_auto] tw-items-center tw-gap-x-3",
    label:
      "tw-col-start-1 tw-row-start-2 tw-min-h-8 touch-only:before:tw-absolute touch-only:before:tw-inset-x-0 touch-only:before:tw-top-1/2 touch-only:before:tw-h-11 touch-only:before:-tw-translate-y-1/2 touch-only:before:tw-content-['']",
    panel: "tw-col-span-2 tw-col-start-1 tw-row-start-1",
    spacing: "tw-pb-3",
    field: "tw-text-xs tw-leading-[18px]",
    height: "tw-h-14",
    minHeight: "",
    rows: 2,
    action: "tw-col-start-2 tw-row-start-2",
  },
} as const;

interface VoteRationaleControlProps {
  readonly checked: boolean;
  readonly onCheckedChange: (checked: boolean) => void;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly generated: boolean;
  readonly invalid: boolean;
  readonly placeholder?: string | undefined;
  readonly variant?: VoteControlVariant | undefined;
  readonly resizeWithContainer?: boolean | undefined;
  readonly action?: ReactNode;
}

export function VoteRationaleControl({
  checked,
  onCheckedChange,
  value,
  onChange,
  generated,
  invalid,
  placeholder,
  variant = "default",
  resizeWithContainer = false,
  action,
}: VoteRationaleControlProps) {
  const locale = useBrowserLocale();
  const styles = VARIANT_STYLES[variant];
  const id = useId();
  const switchId = `${id}-switch`;
  const fieldId = `${id}-field`;
  const panelId = `${id}-panel`;
  const descriptionId = `${id}-description`;
  const validationId = `${id}-validation`;
  const showInvalid = checked && invalid;
  const describedBy = [descriptionId, showInvalid ? validationId : undefined]
    .filter(Boolean)
    .join(" ");
  const resizeContainerClass = resizeWithContainer
    ? `tw-min-h-14 tw-resize-y tw-overflow-hidden tw-rounded-lg ${styles.height}`
    : undefined;
  const hasAction = action !== undefined && action !== null;

  return (
    <div className={`tw-w-full tw-min-w-0 ${styles.layout}`}>
      <label
        htmlFor={switchId}
        className={`tw-relative tw-flex tw-w-fit tw-min-w-0 tw-max-w-full tw-cursor-pointer tw-items-center tw-gap-1.5 tw-rounded-md tw-text-[13px] tw-font-medium tw-text-iron-400 tw-transition-colors tw-duration-150 has-[:checked]:tw-text-iron-100 has-[:focus-visible]:tw-ring-2 has-[:focus-visible]:tw-ring-primary-400 desktop-hover:hover:tw-text-iron-100 motion-reduce:tw-transition-none ${styles.label}`}
      >
        <input
          id={switchId}
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(event) => onCheckedChange(event.target.checked)}
          aria-controls={panelId}
          aria-describedby={describedBy}
          className="tw-peer tw-absolute tw-inset-0 tw-m-0 tw-h-full tw-w-full tw-cursor-pointer tw-opacity-0"
        />
        <ChatBubbleLeftIcon
          aria-hidden="true"
          className="tw-size-4 tw-flex-shrink-0 peer-checked:tw-fill-current"
        />
        <span className="tw-min-w-0 tw-break-words">
          {t(locale, "waves.voteRationale.switchLabel")}
        </span>
      </label>
      <p id={descriptionId} className="tw-sr-only">
        {t(locale, "waves.voteRationale.fieldDescription")}
      </p>
      <div
        id={panelId}
        aria-hidden={!checked}
        inert={!checked}
        className={`tw-grid tw-min-w-0 tw-transition-[grid-template-rows,opacity] tw-duration-200 tw-ease-[var(--vote-reply-easing,ease-out)] motion-reduce:tw-transition-none ${styles.panel} ${
          checked
            ? "tw-grid-rows-[1fr] tw-opacity-100"
            : "tw-grid-rows-[0fr] tw-opacity-0"
        }`}
      >
        <div className="tw-min-h-0 tw-overflow-hidden">
          <div className={`tw-space-y-1.5 ${styles.spacing}`}>
            <label htmlFor={fieldId} className="tw-sr-only">
              {t(locale, "waves.voteRationale.fieldLabel")}
            </label>
            <div className={resizeContainerClass}>
              <textarea
                id={fieldId}
                rows={styles.rows}
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
                aria-invalid={showInvalid}
                aria-describedby={describedBy}
                className={`tw-block tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-px-2.5 tw-py-2 tw-transition-colors placeholder:tw-text-iron-400 focus:tw-border-primary-400 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400/30 touch-only:tw-text-base motion-reduce:tw-transition-none max-sm:tw-text-base ${resizeWithContainer ? "tw-h-full tw-min-h-full tw-resize-none tw-overflow-clip" : "tw-resize-y"} ${styles.field} ${!resizeWithContainer ? styles.minHeight : ""} ${generated ? "tw-text-iron-400" : "tw-text-iron-100"}`}
              />
            </div>
            <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
              {t(locale, "waves.voteRationale.publicReplyDescription")}
            </p>
            {showInvalid && (
              <p
                id={validationId}
                role="alert"
                className="tw-m-0 tw-text-xs tw-leading-5 tw-text-rose-400"
              >
                {t(locale, "waves.voteRationale.emptyBlockReason")}
              </p>
            )}
          </div>
        </div>
      </div>
      {hasAction && <div className={styles.action}>{action}</div>}
    </div>
  );
}
