"use client";

import { useState } from "react";
import {
  CreateWaveDatesConfig,
  CreateWaveOutcomeConfig,
  CreateWaveOutcomeType,
} from "@/types/waves.types";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import CreateWaveOutcomeWarning from "../CreateWaveOutcomeWarning";
import PrimaryButton from "@/components/utils/button/PrimaryButton";

export default function CreateWaveOutcomesCICApprove({
  waveType,
  dates,
  onOutcome,
  onCancel,
}: {
  readonly waveType: ApiWaveType;
  readonly dates: CreateWaveDatesConfig;
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
    maxWinners: null,
  });

  const [creditError, setCreditError] = useState<boolean>(false);

  const setCredit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCredit = parseFloat(e.target.value);
    const isValid = !isNaN(newCredit) && newCredit >= 0;
    setOutcome({ ...outcome, credit: isValid ? newCredit : null });
    setCreditError(false);
  };

  const setMaxWinners = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMaxWinners = parseInt(e.target.value);
    const isValid = !isNaN(newMaxWinners) && newMaxWinners > 0;
    setOutcome({ ...outcome, maxWinners: isValid ? newMaxWinners : null });
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
      <div className="tw-grid md:tw-grid-cols-2 tw-gap-x-5 tw-pt-[0.5px]">
        <div>
          <div className="tw-group tw-w-full tw-relative">
            <input
              type="text"
              value={outcome.credit !== null ? outcome.credit.toString() : ""}
              onChange={setCredit}
              id="outcome-cic-credit"
              autoComplete="off"
              className={`${
                creditError
                  ? "tw-ring-error focus:tw-border-error focus:tw-ring-error tw-caret-error"
                  : "tw-ring-iron-650 focus:tw-border-blue-500 focus:tw-ring-primary-400 tw-caret-primary-400"
              } ${
                outcome.credit
                  ? "focus:tw-text-white tw-text-primary-400"
                  : "tw-text-white"
              }  tw-form-input tw-block tw-px-4 tw-pt-3 tw-pb-4 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-border-iron-600 tw-peer tw-bg-iron-900 focus:tw-bg-iron-900 tw-font-medium tw-shadow-sm tw-ring-1 tw-ring-inset placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-transition tw-duration-300 tw-ease-out`}
              placeholder=" "
            />
            <label
              htmlFor="outcome-cic-credit"
              className={`${
                creditError
                  ? "peer-focus:tw-text-error"
                  : "peer-focus:tw-text-primary-400"
              } tw-text-iron-500  tw-absolute tw-cursor-text tw-text-base tw-font-normal tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2  peer-placeholder-shown:tw-scale-100 
              peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1`}>
              NIC
            </label>
          </div>
          {creditError && (
            <div className="tw-pt-1.5 tw-flex tw-items-center tw-gap-x-2">
              <svg
                className="tw-size-5 tw-flex-shrink-0 tw-text-error"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="tw-text-error tw-text-xs tw-font-medium">
                NIC must be a positive number
              </div>
            </div>
          )}
        </div>
        <div>
          <div className="tw-group tw-w-full tw-relative">
            <input
              type="text"
              value={
                outcome.maxWinners !== null ? outcome.maxWinners.toString() : ""
              }
              onChange={setMaxWinners}
              id="outcome-cic-max-winners"
              autoComplete="off"
              className={`${
                outcome.maxWinners
                  ? "focus:tw-text-white tw-text-primary-400"
                  : "tw-text-white"
              } tw-ring-iron-650 focus:tw-border-blue-500 focus:tw-ring-primary-400 tw-caret-primary-400 tw-form-input tw-block tw-px-4 tw-pt-3 tw-pb-4 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-border-iron-600 tw-peer tw-bg-iron-900 focus:tw-bg-iron-900 tw-font-medium tw-shadow-sm tw-ring-1 tw-ring-inset placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-transition tw-duration-300 tw-ease-out`}
              placeholder=" "
            />
            <label
              htmlFor="outcome-cic-max-winners"
              className="peer-focus:tw-text-primary-400 tw-text-iron-500  tw-absolute tw-cursor-text tw-text-base tw-font-normal tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2  peer-placeholder-shown:tw-scale-100 
              peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1">
              Max Winners
            </label>
          </div>
        </div>
      </div>
      <CreateWaveOutcomeWarning
        waveType={waveType}
        dates={dates}
        maxWinners={outcome.maxWinners}
      />
      <div className="tw-flex tw-justify-end tw-gap-x-3">
        <button
          onClick={onCancel}
          type="button"
          className="tw-bg-iron-800 tw-border-iron-700 tw-text-iron-300 hover:tw-bg-iron-700 hover:tw-border-iron-700 tw-relative tw-inline-flex tw-items-center tw-justify-center tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-border tw-border-solid tw-rounded-lg tw-transition tw-duration-300 tw-ease-out">
          Cancel
        </button>
        <PrimaryButton
          onClicked={onSubmit}
          disabled={false}
          loading={false}
          padding="tw-px-4 tw-py-3">
          Save
        </PrimaryButton>
      </div>
    </div>
  );
}
