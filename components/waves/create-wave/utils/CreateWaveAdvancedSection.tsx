"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useId, useState, type ReactNode } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function CreateWaveAdvancedSection({
  title,
  summary,
  isCustomized,
  hasError,
  variant = "default",
  children,
}: {
  readonly title?: string;
  readonly summary?: string;
  readonly isCustomized: boolean;
  readonly hasError: boolean;
  readonly variant?: "default" | "filled";
  readonly children: ReactNode;
}) {
  const locale = useBrowserLocale();
  const contentId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [previousHasError, setPreviousHasError] = useState(false);

  // Validation must reveal hidden controls before the parent flow focuses the
  // first invalid field. Latch the section open so fixing the first character
  // does not immediately hide the rest of the settings being corrected.
  if (hasError !== previousHasError) {
    setPreviousHasError(hasError);
    if (hasError && !isOpen) {
      setIsOpen(true);
    }
  }

  const isExpanded = isOpen || hasError;
  const isFilled = variant === "filled";
  const sectionTitle = title ?? t(locale, "waves.create.advanced.title");
  const detail = hasError
    ? t(locale, "waves.create.advanced.errorSummary")
    : summary;

  let status: string | null = null;
  if (hasError) {
    status = t(locale, "waves.create.advanced.needsAttention");
  } else if (isCustomized) {
    status = t(locale, "waves.create.advanced.customized");
  }

  const sectionClasses = isFilled
    ? "tw-border-white/5 tw-bg-iron-900/60 desktop-hover:hover:tw-border-white/10"
    : "tw-border-white/10 tw-bg-transparent desktop-hover:hover:tw-border-white/20";
  const buttonClasses = isFilled
    ? "tw-bg-transparent desktop-hover:hover:tw-bg-white/[0.02]"
    : "tw-bg-iron-900/60 desktop-hover:hover:tw-bg-iron-900";
  const contentClasses = isFilled ? "tw-p-0" : "tw-p-4";

  return (
    <section
      className={`tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-transition-colors tw-duration-300 tw-ease-out motion-reduce:tw-transition-none ${sectionClasses}`}
    >
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={contentId}
        onClick={() => setIsOpen((current) => (hasError ? true : !current))}
        className={`tw-group tw-flex tw-min-h-11 tw-w-full tw-items-center tw-justify-between tw-gap-4 tw-border-0 tw-px-4 tw-py-3 tw-text-left tw-transition-colors tw-duration-300 tw-ease-out focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 motion-reduce:tw-transition-none ${buttonClasses}`}
      >
        <span className="tw-flex tw-min-w-0 tw-flex-col tw-gap-0">
          <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-leading-4">
            <span className="tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-100">
              {sectionTitle}
            </span>
            {status ? (
              <span
                className={`tw-rounded-full tw-px-2 tw-py-0.5 tw-text-xs tw-font-semibold ${
                  hasError
                    ? "tw-bg-error/15 tw-text-error"
                    : "tw-bg-primary-500/15 tw-text-primary-300"
                }`}
              >
                {status}
              </span>
            ) : null}
          </span>
          {detail ? (
            <span className="tw-block tw-text-xs tw-leading-4 tw-text-iron-400">
              {detail}
            </span>
          ) : null}
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className={`tw-size-5 tw-shrink-0 tw-text-primary-400 tw-transition-all tw-duration-300 tw-ease-out group-focus-visible:tw-text-primary-300 desktop-hover:group-hover:tw-text-primary-300 motion-reduce:tw-transition-none ${
            isExpanded ? "tw-rotate-180" : ""
          }`}
        />
      </button>
      <div
        id={contentId}
        hidden={!isExpanded}
        className={`tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-bg-transparent ${contentClasses}`}
      >
        {children}
      </div>
    </section>
  );
}
