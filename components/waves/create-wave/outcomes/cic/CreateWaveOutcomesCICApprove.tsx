import { useState } from "react";
import {
  CreateWaveOutcomeConfig,
  CreateWaveOutcomeType,
} from "../../../../../types/waves.types";

export default function CreateWaveOutcomesCICApprove({
  onOutcome,
  onCancel,
}: {
  readonly onOutcome: (outcome: CreateWaveOutcomeConfig) => void;
  readonly onCancel: () => void;
}) {
  const outcomeType = CreateWaveOutcomeType.CIC;
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
              peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1`}
            >
              CIC
            </label>
          </div>
          {creditError && (
            <div className="tw-pt-1.5 tw-flex tw-items-center tw-gap-x-2">
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
              <div className="tw-text-error tw-text-xs tw-font-medium">
                CIC must be a positive number
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
              peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
            >
              Max Winners
            </label>
          </div>
        </div>
        <div className="tw-col-span-2 tw-mt-5">
          <div className="tw-text-[#fef08a] tw-text-xs tw-font-medium">
            <div className="tw-flex tw-items-center tw-gap-x-2">
              <svg
                className="tw-size-5 tw-flex-shrink-0 tw-text-[#fef08a]"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.9998 8.99999V13M11.9998 17H12.0098M10.6151 3.89171L2.39019 18.0983C1.93398 18.8863 1.70588 19.2803 1.73959 19.6037C1.769 19.8857 1.91677 20.142 2.14613 20.3088C2.40908 20.5 2.86435 20.5 3.77487 20.5H20.2246C21.1352 20.5 21.5904 20.5 21.8534 20.3088C22.0827 20.142 22.2305 19.8857 22.2599 19.6037C22.2936 19.2803 22.0655 18.8863 21.6093 18.0983L13.3844 3.89171C12.9299 3.10654 12.7026 2.71396 12.4061 2.58211C12.1474 2.4671 11.8521 2.4671 11.5935 2.58211C11.2969 2.71396 11.0696 3.10655 10.6151 3.89171Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>
                Without max winners or an end date, this wave runs indefinitely,
                awarding all who meet the threshold.
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="tw-flex tw-justify-end tw-gap-x-3">
        <button
          onClick={onCancel}
          type="button"
          className="tw-bg-iron-800 tw-border-iron-700 tw-text-iron-300 hover:tw-bg-iron-700 hover:tw-border-iron-700 tw-relative tw-inline-flex tw-items-center tw-justify-center tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-border tw-border-solid tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          type="button"
          className="tw-bg-primary-500 tw-border-primary-500 tw-text-white hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-relative tw-inline-flex tw-items-center tw-justify-center tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-border tw-border-solid tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
        >
          Save
        </button>
      </div>
    </div>
  );
}
