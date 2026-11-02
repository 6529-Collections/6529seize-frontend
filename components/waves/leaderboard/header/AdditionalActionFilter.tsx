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
      className={`tw-relative tw-m-0 tw-inline-flex tw-h-[38px] tw-max-w-full tw-cursor-pointer tw-items-center tw-gap-1.5 tw-whitespace-nowrap tw-rounded-lg tw-text-xs tw-font-medium tw-leading-5 tw-ring-1 tw-ring-inset tw-transition-colors tw-duration-150 [&:has(:focus-visible)]:tw-outline [&:has(:focus-visible)]:tw-outline-2 [&:has(:focus-visible)]:tw-outline-offset-2 [&:has(:focus-visible)]:tw-outline-amber-300/80 ${
        checked
          ? "tw-bg-amber-400/[0.08] tw-pl-[11px] tw-pr-[13px] tw-text-amber-300 tw-ring-amber-300/30 desktop-hover:hover:tw-bg-amber-400/[0.12] desktop-hover:hover:tw-ring-amber-300/40"
          : "tw-bg-iron-950 tw-px-[13px] tw-text-iron-400 tw-ring-white/[0.07] desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-iron-300"
      }`}
    >
      <input
        type="checkbox"
        className="tw-sr-only"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {checked && (
        <svg
          viewBox="0 0 12 12"
          className="tw-size-3 tw-shrink-0"
          aria-hidden="true"
        >
          <path
            d="M2.5 6.3l2.2 2.2 4.8-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span>{t(locale, "memes.additionalAction.label")}</span>
    </label>
  );
}
