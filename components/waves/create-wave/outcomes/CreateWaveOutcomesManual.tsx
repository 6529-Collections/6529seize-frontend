import { useState } from "react";
import {
  CreateWaveOutcomeConfig,
  CreateWaveOutcomeType,
} from "../../../../types/waves.types";

export default function CreateWaveOutcomesManual({
  onOutcome,
  onCancel,
}: {
  readonly onOutcome: (outcome: CreateWaveOutcomeConfig) => void;
  readonly onCancel: () => void;
}) {
  const [value, setValue] = useState<string>("");
  const onValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };
  return (
    <div className="tw-col-span-full tw-flex tw-flex-col tw-gap-y-2">
      <div className="tw-flex tw-flex-col">
        <div className="tw-flex">
          <div className="tw-group tw-w-full tw-relative">
            <input
              type="text"
              value={value}
              onChange={onValueChange}
              autoComplete="off"
              className="tw-ring-iron-650 focus:tw-border-blue-500 focus:tw-ring-primary-400 tw-caret-primary-400 tw-form-input tw-block tw-px-4 tw-py-4 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-600 tw-peer
              tw-bg-iron-900 focus:tw-bg-iron-900 tw-font-medium tw-shadow-sm tw-ring-1 tw-ring-inset placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-transition tw-duration-300 tw-ease-out"
              placeholder=" "
            />
            <label
              className="peer-focus:tw-text-primary-400 tw-absolute tw-cursor-text tw-text-base tw-font-normal tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2  peer-placeholder-shown:tw-scale-100 
              peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
            >
              Manual action
            </label>
          </div>
        </div>
        <div className="tw-mt-6 tw-flex tw-justify-end tw-gap-x-3">
          <button
            onClick={onCancel}
            type="button"
            className="tw-bg-iron-800 tw-border-iron-700 tw-text-iron-300 hover:tw-bg-iron-700 hover:tw-border-iron-700 tw-relative tw-inline-flex tw-items-center tw-justify-center tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-border tw-border-solid tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
          >
            Cancel
          </button>
          <button
            type="button"
            className="tw-bg-primary-500 tw-border-primary-500 tw-text-white hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-relative tw-inline-flex tw-items-center tw-justify-center tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-border tw-border-solid tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
            disabled={!value}
            onClick={() =>
              onOutcome({
                title: value,
                type: CreateWaveOutcomeType.MANUAL,
                credit: null,
                category: null,
                winnersConfig: null,
              })
            }
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
