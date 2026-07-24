"use client";

import { useState } from "react";
import type { CreateWaveOutcomeConfig } from "@/types/waves.types";
import { CreateWaveOutcomeType } from "@/types/waves.types";
import PrimaryButton from "@/components/utils/button/PrimaryButton";

export default function CreateWaveOutcomesCICApprove({
  onOutcome,
  onCancel,
}: {
  readonly onOutcome: (outcome: CreateWaveOutcomeConfig) => void;
  readonly onCancel: () => void;
}) {
  const outcomeType = CreateWaveOutcomeType.NIC;
  const [outcome, setOutcome] = useState<CreateWaveOutcomeConfig>({
    type: outcomeType,
    title: null,
    credit: null,
    category: null,
    winnersConfig: null,
  });

  const [creditError, setCreditError] = useState<boolean>(false);

  const setCredit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCredit = parseFloat(e.target.value);
    const isValid = !isNaN(newCredit) && newCredit >= 0;
    setOutcome({ ...outcome, credit: isValid ? newCredit : null });
    setCreditError(false);
  };

  const onSubmit = () => {
    const dontHaveCreditSet = !outcome.credit;
    setCreditError(dontHaveCreditSet);

    if (dontHaveCreditSet) {
      return;
    }
    onOutcome(outcome);
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-6">
      <div className="tw-grid tw-gap-x-5 tw-pt-[0.5px]">
        <div>
          <div className="tw-group tw-relative tw-w-full">
            <input
              type="text"
              inputMode="decimal"
              value={outcome.credit !== null ? outcome.credit.toString() : ""}
              onChange={setCredit}
              id="outcome-cic-credit"
              autoComplete="off"
              className={`${
                creditError
                  ? "tw-caret-error tw-ring-error focus:tw-border-error focus:tw-ring-error"
                  : "tw-caret-primary-400 tw-ring-iron-650 focus:tw-border-blue-500 focus:tw-ring-primary-400"
              } ${
                outcome.credit
                  ? "tw-text-primary-400 focus:tw-text-white"
                  : "tw-text-white"
              } tw-peer tw-form-input tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-border-iron-600 tw-bg-iron-900 tw-px-4 tw-pb-4 tw-pt-3 tw-text-base tw-font-medium tw-shadow-sm tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset sm:tw-text-sm`}
              placeholder=" "
            />
            <label
              htmlFor="outcome-cic-credit"
              className={`${
                creditError
                  ? "peer-focus:tw-text-error"
                  : "peer-focus:tw-text-primary-400"
              } tw-absolute tw-start-1 tw-top-2 tw-z-10 tw-origin-[0] -tw-translate-y-4 tw-scale-75 tw-transform tw-cursor-text tw-bg-iron-900 tw-px-2 tw-text-base tw-font-normal tw-text-iron-500 tw-duration-300 peer-placeholder-shown:tw-top-1/2 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-scale-100 peer-focus:tw-top-2 peer-focus:-tw-translate-y-4 peer-focus:tw-scale-75 peer-focus:tw-bg-iron-900 peer-focus:tw-px-2 rtl:peer-focus:tw-left-auto rtl:peer-focus:tw-translate-x-1/4`}
            >
              NIC
            </label>
          </div>
          {creditError && (
            <div className="tw-flex tw-items-center tw-gap-x-2 tw-pt-1.5">
              <svg
                className="tw-size-5 tw-flex-shrink-0 tw-text-error"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="tw-text-xs tw-font-medium tw-text-error">
                NIC must be a positive number
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="tw-flex tw-justify-end tw-gap-x-3">
        <button
          onClick={onCancel}
          type="button"
          className="tw-relative tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out hover:tw-border-iron-700 hover:tw-bg-iron-700"
        >
          Cancel
        </button>
        <PrimaryButton
          onClicked={onSubmit}
          disabled={false}
          loading={false}
          padding="tw-px-4 tw-py-3"
        >
          Save
        </PrimaryButton>
      </div>
    </div>
  );
}
