"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

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
      className={`tw-m-0 tw-inline-flex tw-min-h-11 tw-max-w-full tw-cursor-pointer tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-px-2.5 tw-py-2 tw-text-xs tw-font-semibold focus-within:tw-outline focus-within:tw-outline-2 focus-within:tw-outline-offset-2 focus-within:tw-outline-primary-400 ${
        checked
          ? "tw-border-amber-400/60 tw-bg-amber-400/10 tw-text-amber-200"
          : "tw-border-iron-700 tw-bg-iron-950 tw-text-iron-200 desktop-hover:hover:tw-bg-iron-900"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="tw-m-0 tw-size-4 tw-shrink-0 tw-accent-amber-400"
      />
      <span>{t(locale, "memes.additionalAction.label")}</span>
    </label>
  );
}
