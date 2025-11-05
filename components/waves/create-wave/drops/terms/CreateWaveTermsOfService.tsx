"use client";

import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { useState } from "react";

export default function CreateWaveTermsOfService({
  waveType,
  terms,
  setTerms,
}: {
  readonly waveType: ApiWaveType;
  readonly terms: string | null;
  readonly setTerms: (terms: string | null) => void;
}) {
  const [enabled, setEnabled] = useState(!!terms);

  const onEnabledChange = (enabled: boolean) => {
    setEnabled(enabled);
    if (!enabled) {
      setTerms(null);
    }
  };

  // Only show for Rank and Approve waves
  const isApplicableWaveType =
    waveType === ApiWaveType.Rank || waveType === ApiWaveType.Approve;

  if (!isApplicableWaveType) {
    return null;
  }

  return (
    <div className="tw-space-y-4">
      <div>
        <div className="tw-flex tw-items-center tw-justify-between">
          <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-100">
            Participation Terms
          </h3>
          <label htmlFor="tos-toggle" className="tw-flex tw-cursor-pointer">
            <div className="tw-flex tw-items-center tw-gap-x-2 sm:tw-gap-x-3">
              <div
                className={`tw-rounded-full tw-bg-gradient-to-b tw-p-[1px] ${
                  enabled ? "tw-from-primary-300" : "tw-from-iron-600"
                }`}>
                <input
                  id="tos-toggle"
                  type="checkbox"
                  checked={enabled}
                  onChange={() => onEnabledChange(!enabled)}
                  className="tw-sr-only"
                />
                <span
                  className={`tw-p-0 tw-relative tw-flex tw-items-center tw-h-6 tw-w-11 tw-flex-shrink-0 tw-cursor-pointer tw-rounded-full tw-border-2 tw-border-transparent tw-transition-colors tw-duration-200 tw-ease-in-out focus:tw-outline-none ${
                    enabled
                      ? "tw-bg-primary-500 focus-focus:tw-ring-2 focus-visible:tw-ring-primary-500 focus-visible:tw-ring-offset-2"
                      : "tw-bg-iron-700"
                  }`}
                  role="switch"
                  aria-checked={enabled}>
                  <span
                    aria-hidden="true"
                    className={`tw-pointer-events-none tw-inline-block tw-h-5 tw-w-5 tw-transform tw-rounded-full tw-bg-iron-50 tw-shadow tw-ring-0 tw-transition tw-duration-200 tw-ease-in-out ${
                      enabled ? "tw-translate-x-5" : "tw-translate-x-0"
                    }`}></span>
                </span>
              </div>
              <span className="tw-mb-0 tw-text-sm sm:tw-text-base tw-font-semibold tw-text-iron-50 tw-whitespace-nowrap">
                Enable Terms
              </span>
            </div>
          </label>
        </div>
        <p className="tw-text-sm tw-text-iron-300 tw-mt-1">
          Add custom terms that participants must agree to and sign with their
          wallet before submitting content.
        </p>
      </div>

      {enabled && (
        <div className="tw-mt-4">
          <div className="tw-group tw-w-full tw-relative">
            <textarea
              value={terms ?? ""}
              onChange={(e) => setTerms(e.target.value)}
              id="terms-of-service-text"
              rows={6}
              className="tw-ring-iron-650 focus:tw-border-blue-500 focus:tw-ring-primary-400 tw-caret-primary-400 tw-form-textarea tw-block tw-px-4 tw-py-4 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-600 tw-peer tw-bg-iron-900 focus:tw-bg-iron-900 tw-font-medium tw-shadow-sm tw-ring-1 tw-ring-inset placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-transition tw-duration-300 tw-ease-out"
              placeholder="Enter the terms of service that participants will need to agree to and sign..."></textarea>
          </div>
          <div className="tw-mt-2 tw-flex tw-justify-between tw-text-xs tw-text-iron-400">
            <span>
              Participants will need to sign these terms with their wallet
            </span>
            <span>{terms?.length ?? 0} characters</span>
          </div>
        </div>
      )}
    </div>
  );
}
