"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { CheckIcon } from "@heroicons/react/24/outline";

export function AdditionalActionFilter({
  checked,
  onChange,
}: {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}) {
  const locale = useBrowserLocale();
  return (
    <label
      className={`tw-relative tw-m-0 tw-inline-flex tw-h-[38px] tw-max-w-full tw-cursor-pointer tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-px-2.5 tw-py-0 tw-text-xs tw-font-medium tw-shadow-sm tw-shadow-black/30 focus-within:tw-outline focus-within:tw-outline-2 focus-within:tw-outline-offset-2 focus-within:tw-outline-primary-400 ${
        checked
          ? "tw-border-amber-400/30 tw-bg-amber-400/10 tw-text-amber-200"
          : "tw-border-white/[0.06] tw-bg-iron-900/75 tw-text-iron-500 desktop-hover:hover:tw-bg-iron-800/50 desktop-hover:hover:tw-text-iron-200"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="tw-absolute tw-left-2.5 tw-top-1/2 tw-z-10 tw-m-0 tw-size-3.5 -tw-translate-y-1/2 tw-cursor-pointer tw-opacity-0"
      />
      <span
        aria-hidden="true"
        className={`tw-pointer-events-none tw-flex tw-size-3.5 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-[3px] tw-border tw-border-solid ${
          checked
            ? "tw-border-amber-400 tw-bg-amber-400 tw-text-iron-950"
            : "tw-border-iron-500 tw-bg-transparent"
        }`}
      >
        <CheckIcon
          className={`tw-size-3 ${checked ? "tw-opacity-100" : "tw-opacity-0"}`}
          strokeWidth={2.5}
        />
      </span>
      <span>{t(locale, "memes.additionalAction.label")}</span>
    </label>
  );
}
