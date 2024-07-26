import { useEffect, useState } from "react";
import {
  CreateWaveDatesConfig,
  CreateWaveOutcomeConfig,
  CreateWaveOutcomeType,
} from "../../../../../types/waves.types";
import { WaveType } from "../../../../../generated/models/WaveType";
import CreateWaveOutcomeWarning from "../CreateWaveOutcomeWarning";

export default function CreateWaveOutcomesManual({
  waveType,
  dates,
  onOutcome,
  onCancel,
}: {
  readonly waveType: WaveType;
  readonly dates: CreateWaveDatesConfig;
  readonly onOutcome: (outcome: CreateWaveOutcomeConfig) => void;
  readonly onCancel: () => void;
}) {
  const [value, setValue] = useState<string>("");
  const [maxWinners, setMaxWinners] = useState<number | null>(null);
  const onValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const onMaxWinnersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMaxWinners = parseInt(e.target.value);
    const isValid = !isNaN(newMaxWinners) && newMaxWinners > 0;
    setMaxWinners(isValid ? newMaxWinners : null);
  };

  const [isInputEmptyError, setIsInputEmptyError] = useState<boolean>(false);

  useEffect(() => setIsInputEmptyError(false), [value]);

  const isApproveWave = waveType === WaveType.Approve;

  const onSubmit = () => {
    if (!value) {
      setIsInputEmptyError(!value);
      return;
    }
    onOutcome({
      title: value,
      type: CreateWaveOutcomeType.MANUAL,
      credit: null,
      category: null,
      winnersConfig: null,
      maxWinners,
    });
  };

  return (
    <div className="tw-col-span-full">
      <div className="tw-flex tw-flex-col tw-pt-[0.5px] tw-gap-y-5">
        <div
          className={`${
            isApproveWave ? "md:tw-grid-cols-2" : ""
          } tw-grid tw-gap-x-5`}
        >
          <div>
            <div className="tw-group tw-w-full tw-relative">
              <input
                type="text"
                value={value}
                onChange={onValueChange}
                id="outcome-manual"
                autoComplete="off"
                className={`${
                  isInputEmptyError
                    ? "tw-ring-error focus:tw-border-error focus:tw-ring-error tw-caret-error"
                    : "tw-ring-iron-650 focus:tw-border-blue-500 focus:tw-ring-primary-400 tw-caret-primary-400"
                } ${
                  value
                    ? "focus:tw-text-white tw-text-primary-400"
                    : "tw-text-white"
                }  tw-form-input tw-block tw-px-4 tw-pt-4 tw-pb-3 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-border-iron-600 tw-peer tw-bg-iron-900 focus:tw-bg-iron-900 tw-font-medium tw-shadow-sm tw-ring-1 tw-ring-inset placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-transition tw-duration-300 tw-ease-out`}
                placeholder=" "
              />
              <label
                htmlFor="outcome-manual"
                className={`${
                  isInputEmptyError ? "" : "peer-focus:tw-text-primary-400"
                }  tw-text-iron-500 tw-absolute tw-cursor-text tw-text-base tw-font-normal tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-placeholder-shown:tw-scale-100 
              peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1`}
              >
                Manual action
              </label>
            </div>
            {isInputEmptyError && (
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
                  Please enter your manual action
                </div>
              </div>
            )}
          </div>
          {isApproveWave && (
            <div>
              <div className="tw-group tw-w-full tw-relative">
                <input
                  type="text"
                  value={maxWinners !== null ? maxWinners.toString() : ""}
                  onChange={onMaxWinnersChange}
                  id="outcome-manual-max-winners"
                  autoComplete="off"
                  className={`${
                    maxWinners
                      ? "focus:tw-text-white tw-text-primary-400"
                      : "tw-text-white"
                  } tw-ring-iron-650 focus:tw-border-blue-500 focus:tw-ring-primary-400 tw-caret-primary-400 tw-form-input tw-block tw-px-4 tw-pt-4 tw-pb-3 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-border-iron-600 tw-peer tw-bg-iron-900 focus:tw-bg-iron-900 tw-font-medium tw-shadow-sm tw-ring-1 tw-ring-inset placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-transition tw-duration-300 tw-ease-out`}
                  placeholder=" "
                />
                <label
                  htmlFor="outcome-manual-max-winners"
                  className="peer-focus:tw-text-primary-400 tw-text-iron-500 tw-absolute tw-cursor-text tw-text-base tw-font-normal tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2  peer-placeholder-shown:tw-scale-100 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
                >
                  Max Winners
                </label>
              </div>
            </div>
          )}
        </div>
        <CreateWaveOutcomeWarning
          waveType={waveType}
          dates={dates}
          maxWinners={maxWinners}
        />
        <div className="tw-mt-6 tw-flex tw-justify-end tw-gap-x-3 tw-relative tw-z-50">
          <button
            onClick={onCancel}
            type="button"
            className="tw-bg-iron-800 tw-border-iron-700 tw-text-iron-300 hover:tw-bg-iron-700 hover:tw-border-iron-700 tw-relative tw-inline-flex tw-items-center tw-justify-center tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-border tw-border-solid tw-rounded-lg focus:!tw-outline focus-visible:!tw-outline-2 focus-visible:!tw-outline-offset-2 focus-visible:!tw-outline-primary-400 tw-transition tw-duration-300 tw-ease-out"
          >
            Cancel
          </button>
          <button
            type="button"
            className="tw-bg-primary-500 tw-border-primary-500 tw-text-white hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-relative tw-inline-flex tw-items-center tw-justify-center tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-border tw-border-solid tw-rounded-lg focus:!tw-outline focus-visible:!tw-outline-2 focus-visible:!tw-outline-offset-2 focus-visible:!tw-outline-primary-400 tw-transition tw-duration-300 tw-ease-out"
            onClick={onSubmit}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
