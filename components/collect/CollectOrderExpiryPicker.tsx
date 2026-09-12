"use client";

import { useId } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate, formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import {
  defaultCollectCustomExpiryInput,
  resolveCollectCustomExpiry,
} from "./collect-custom-expiry";

export interface CollectOrderExpiryValue {
  readonly expiryHours: string;
  readonly expiryDateTime?: string;
}

interface Props {
  readonly value: CollectOrderExpiryValue;
  readonly label?: string;
  readonly disabled: boolean;
  readonly invalid?: boolean;
  readonly errorId?: string;
  readonly onChange: (value: CollectOrderExpiryValue) => void;
}

const OPTIONS = ["24", "168", "720", "custom"] as const;

export default function CollectOrderExpiryPicker({
  value,
  label,
  disabled,
  invalid = false,
  errorId,
  onChange,
}: Props) {
  const locale = useBrowserLocale();
  const id = useId();
  const fieldLabel = label ?? t(locale, "collect.trade.duration");
  const custom = value.expiryHours === "custom";
  const resolved = custom
    ? resolveCollectCustomExpiry(value.expiryDateTime ?? "")
    : null;
  const zone = new Intl.DateTimeFormat(locale).resolvedOptions().timeZone;
  const optionLabel = (hours: string) => {
    if (hours === "custom") return t(locale, "collect.expiry.custom");
    const key =
      hours === "24"
        ? "collect.trade.durationDay"
        : "collect.trade.durationDays";
    return t(locale, key, { days: formatInteger(locale, Number(hours) / 24) });
  };
  const localError =
    invalid && resolved?.issue
      ? t(locale, `collect.expiry.invalid.${resolved.issue}`)
      : null;

  return (
    <div className="tw-min-w-0 tw-space-y-2">
      <label
        htmlFor={`${id}-duration`}
        className="tw-block tw-text-sm tw-text-iron-200"
      >
        {fieldLabel}
      </label>
      <Listbox
        value={value.expiryHours}
        disabled={disabled}
        onChange={(expiryHours: string) =>
          onChange({
            ...value,
            expiryHours,
            ...(expiryHours === "custom" && value.expiryDateTime === undefined
              ? { expiryDateTime: defaultCollectCustomExpiryInput() }
              : {}),
          })
        }
      >
        <ListboxButton
          id={`${id}-duration`}
          type="button"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.click();
            }
          }}
          aria-label={fieldLabel}
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
          className="tw-flex tw-min-h-11 tw-w-full tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
        >
          <span>{optionLabel(value.expiryHours)}</span>
          <ChevronDownIcon
            aria-hidden="true"
            className="tw-size-4 tw-shrink-0 tw-text-iron-400"
          />
        </ListboxButton>
        <ListboxOptions
          aria-label={fieldLabel}
          anchor="bottom start"
          modal={false}
          className="tailwind-scope tw-z-[1020] tw-max-h-64 tw-w-[var(--button-width)] tw-overflow-auto tw-rounded-lg tw-bg-iron-900 tw-p-1 tw-text-sm tw-text-iron-100 tw-shadow-lg tw-ring-1 tw-ring-white/10 [--anchor-gap:0.5rem] focus:tw-outline-none"
        >
          {OPTIONS.map((hours) => (
            <ListboxOption
              key={hours}
              value={hours}
              className="tw-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-justify-between tw-gap-3 tw-rounded-md tw-px-3 tw-py-2 data-[focus]:tw-bg-iron-800"
            >
              {({ selected }) => (
                <>
                  <span>{optionLabel(hours)}</span>
                  {selected && (
                    <CheckIcon
                      aria-hidden="true"
                      className="tw-size-4 tw-shrink-0 tw-text-iron-300"
                    />
                  )}
                </>
              )}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </Listbox>
      {custom && (
        <div className="tw-space-y-2 tw-pt-1">
          <label
            htmlFor={`${id}-custom`}
            className="tw-block tw-text-xs tw-text-iron-300"
          >
            {t(locale, "collect.expiry.endsAt")}
          </label>
          <input
            id={`${id}-custom`}
            type="datetime-local"
            step={60}
            disabled={disabled}
            value={value.expiryDateTime ?? ""}
            onChange={(event) =>
              onChange({ ...value, expiryDateTime: event.target.value })
            }
            aria-invalid={invalid}
            aria-describedby={[
              `${id}-zone`,
              `${id}-instant`,
              invalid ? `${id}-invalid` : undefined,
            ]
              .filter(Boolean)
              .join(" ")}
            className="tw-block tw-min-h-11 tw-w-full tw-min-w-0 tw-max-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-100 [color-scheme:dark] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50"
          />
          <p
            id={`${id}-zone`}
            className="tw-m-0 tw-break-words tw-text-xs tw-leading-5 tw-text-iron-400"
          >
            {t(locale, "collect.expiry.timezone", { zone })}
          </p>
          <p
            id={`${id}-instant`}
            className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-300"
          >
            {resolved?.expiresAt !== null && resolved?.expiresAt !== undefined
              ? t(locale, "collect.expiry.exact", {
                  date: formatDate(locale, resolved.expiresAt * 1000, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    timeZoneName: "shortOffset",
                  }),
                })
              : t(locale, "collect.expiry.range")}
          </p>
          {localError && (
            <p
              id={`${id}-invalid`}
              role="alert"
              className="tw-m-0 tw-text-xs tw-leading-5 tw-text-error"
            >
              {localError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
