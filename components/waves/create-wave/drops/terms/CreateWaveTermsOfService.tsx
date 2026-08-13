"use client";

import { useState } from "react";
import { CREATE_WAVE_FORM_STYLES } from "../../utils/createWaveFormStyles";

export default function CreateWaveTermsOfService({
  terms,
  setTerms,
  title = "Participation Terms",
  description = "Add custom terms that participants must agree to and sign with their wallet before submitting content.",
  toggleLabel = "Enable Terms",
  placeholder = "Enter the terms of service that participants will need to agree to and sign...",
  helperText = "Participants will need to sign these terms with their wallet",
}: {
  readonly terms: string | null;
  readonly setTerms: (terms: string | null) => void;
  readonly title?: string | undefined;
  readonly description?: string | undefined;
  readonly toggleLabel?: string | undefined;
  readonly placeholder?: string | undefined;
  readonly helperText?: string | undefined;
}) {
  const [enabled, setEnabled] = useState(!!terms);
  const titleId = "terms-of-service-title";
  const descriptionId = "terms-of-service-description";
  const helperId = "terms-of-service-helper";

  const onEnabledChange = (enabled: boolean) => {
    setEnabled(enabled);
    if (!enabled) {
      setTerms(null);
    }
  };

  return (
    <div className="tw-space-y-4">
      <div>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-2">
          <h3 id={titleId} className={CREATE_WAVE_FORM_STYLES.sectionTitle}>
            {title}
          </h3>
          <label
            htmlFor="tos-toggle"
            className="tw-flex tw-min-h-6 tw-cursor-pointer tw-items-center tw-gap-2"
          >
            <input
              id="tos-toggle"
              type="checkbox"
              aria-describedby={descriptionId}
              checked={enabled}
              onChange={(event) => onEnabledChange(event.target.checked)}
              className="tw-peer tw-sr-only"
            />
            <span
              aria-hidden="true"
              className={`tw-rounded-full tw-bg-gradient-to-b tw-p-[1px] peer-focus-visible:tw-ring-2 peer-focus-visible:tw-ring-primary-500 peer-focus-visible:tw-ring-offset-2 peer-focus-visible:tw-ring-offset-iron-950 ${
                enabled ? "tw-from-primary-300" : "tw-from-iron-600"
              }`}
            >
              <span
                className={`tw-relative tw-flex tw-h-5 tw-w-9 tw-flex-shrink-0 tw-items-center tw-rounded-full tw-border-2 tw-border-transparent tw-p-0 tw-transition-colors tw-duration-200 tw-ease-in-out motion-reduce:tw-transition-none ${
                  enabled ? "tw-bg-primary-500" : "tw-bg-iron-700"
                }`}
              >
                <span
                  className={`tw-pointer-events-none tw-inline-block tw-size-4 tw-transform tw-rounded-full tw-bg-iron-50 tw-shadow tw-ring-0 tw-transition tw-duration-200 tw-ease-in-out motion-reduce:tw-transition-none ${
                    enabled ? "tw-translate-x-[18px]" : "tw-translate-x-0"
                  }`}
                />
              </span>
            </span>
            <span className="tw-whitespace-nowrap tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-300">
              {toggleLabel}
            </span>
          </label>
        </div>
        <p
          id={descriptionId}
          className={`tw-mt-1 ${CREATE_WAVE_FORM_STYLES.supportingText}`}
        >
          {description}
        </p>
      </div>

      {enabled && (
        <div>
          <div className="tw-group tw-relative tw-w-full">
            <textarea
              value={terms ?? ""}
              aria-labelledby={titleId}
              aria-describedby={`${descriptionId} ${helperId}`}
              onChange={(e) => setTerms(e.target.value)}
              id="terms-of-service-text"
              rows={6}
              className="tw-peer tw-form-textarea tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-iron-950 tw-px-4 tw-py-4 tw-text-base tw-font-medium tw-text-white tw-caret-primary-400 tw-shadow-inner tw-ring-1 tw-ring-inset tw-ring-white/10 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 focus:tw-border-primary-400 focus:tw-bg-iron-950 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-inset focus:tw-ring-primary-400 desktop-hover:hover:tw-ring-white/15 desktop-hover:hover:focus:tw-ring-primary-400 sm:tw-text-sm"
              placeholder={placeholder}
            />
          </div>
          <div
            id={helperId}
            aria-live="polite"
            className={`tw-mt-2 tw-flex tw-justify-between ${CREATE_WAVE_FORM_STYLES.compactSupportingText}`}
          >
            <span>{helperText}</span>
            <span>{terms?.length ?? 0} characters</span>
          </div>
        </div>
      )}
    </div>
  );
}
