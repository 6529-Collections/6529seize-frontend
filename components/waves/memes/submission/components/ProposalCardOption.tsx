"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { ProposalCardLayout } from "@/lib/proposal-card/document";
import { useId } from "react";

/** Choose optional proposal framing using the shared submission option-card styling. */
export function ProposalCardOption({
  layout,
  onChange,
  disabled = false,
}: {
  readonly layout: ProposalCardLayout | null;
  readonly onChange: (layout: ProposalCardLayout | null) => void;
  readonly disabled?: boolean;
}) {
  const locale = useBrowserLocale();
  const id = useId();
  return (
    <div className="tw-rounded-lg tw-bg-iron-900/70 tw-px-3 tw-py-3 tw-ring-1 tw-ring-iron-800 tw-transition-colors desktop-hover:hover:tw-ring-iron-700">
      <label
        className="tw-flex tw-min-h-11 tw-cursor-pointer tw-items-start tw-gap-3"
        htmlFor={id}
      >
        <input
          id={id}
          type="checkbox"
          checked={layout !== null}
          disabled={disabled}
          onChange={(event) =>
            onChange(event.target.checked ? "portrait" : null)
          }
          aria-describedby={`${id}-description`}
          className="tw-form-checkbox tw-mt-0.5 tw-h-4 tw-w-4 tw-flex-shrink-0 tw-cursor-pointer tw-rounded tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-800 tw-text-primary-400 focus:tw-ring-primary-400 focus:tw-ring-offset-0"
        />
        <span className="tw-flex tw-min-w-0 tw-flex-col tw-gap-1">
          <span className="tw-text-sm tw-font-medium tw-text-iron-100">
            {t(locale, "memes.proposalFrame.enable")}
          </span>
          <span
            id={`${id}-description`}
            className="tw-text-pretty tw-text-xs tw-leading-5 tw-text-iron-400"
          >
            {t(locale, "memes.proposalFrame.description")}
          </span>
        </span>
      </label>
      {layout !== null && (
        <fieldset className="tw-mb-0 tw-mt-3 tw-border-0 tw-p-0">
          <legend className="tw-mb-2 tw-text-xs tw-font-medium tw-text-iron-300">
            {t(locale, "memes.proposalFrame.orientation")}
          </legend>
          <div className="tw-flex tw-flex-wrap tw-gap-3">
            {(["portrait", "landscape"] as const).map((value) => (
              <label
                key={value}
                className="tw-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-px-3 tw-text-sm tw-text-iron-100"
              >
                <input
                  type="radio"
                  name={`${id}-layout`}
                  value={value}
                  checked={layout === value}
                  disabled={disabled}
                  onChange={() => onChange(value)}
                  className="tw-accent-primary-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
                />
                {t(
                  locale,
                  value === "portrait"
                    ? "memes.proposalFrame.portrait"
                    : "memes.proposalFrame.landscape"
                )}
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}
