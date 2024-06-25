import { useState } from "react";
import RepCategorySearch from "../../../utils/input/rep-category/RepCategorySearch";
import {
  CreateWaveOutcomeConfig,
  CreateWaveOutcomeConfigWinner,
  CreateWaveOutcomeConfigWinnersConfig,
  CreateWaveOutcomeConfigWinnersCreditValueType,
  CreateWaveOutcomeType,
} from "../../../../types/waves.types";
import CreateWaveOutcomesWinners from "./winners/CreateWaveOutcomesWinners";

export default function CreateWaveOutcomesRep({
  onOutcome,
}: {
  readonly onOutcome: (outcome: CreateWaveOutcomeConfig) => void;
}) {
  const [outcome, setOutcome] = useState<CreateWaveOutcomeConfig>({
    type: CreateWaveOutcomeType.REP,
    title: null,
    credit: null,
    category: null,
    winnersConfig: {
      creditValueType:
        CreateWaveOutcomeConfigWinnersCreditValueType.ABSOLUTE_VALUE,
      winners: [{ value: 0 }],
    },
  });

  const setCategory = (category: string | null) => {
    setOutcome({ ...outcome, category });
  };

  const setWinnersConfig = (
    winnersConfig: CreateWaveOutcomeConfigWinnersConfig
  ) => {
    setOutcome({ ...outcome, winnersConfig });
  };

  const onCreditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCredit = parseInt(e.target.value);
    setOutcome({
      ...outcome,
      credit: typeof newCredit === "number" ? newCredit : null,
    });
  };
  return (
    <div className="tw-col-span-full tw-flex tw-flex-col tw-gap-y-2">
      <div className="tw-flex tw-flex-col tw-gap-y-6">
        <div className="tw-flex tw-flex-col sm:tw-flex-row tw-gap-4 tw-w-full">
          <RepCategorySearch
            category={outcome.category}
            setCategory={setCategory}
          />
        </div>
        {/* <div className="tw-relative tw-w-full">
          <input
            type="number"
            autoComplete="off"
            value={outcome.credit ?? undefined}
            onChange={onCreditChange}
            className="tw-form-input tw-block tw-px-4 tw-pb-3 tw-pt-4 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-600 focus:tw-border-blue-500 tw-peer
tw-bg-iron-900 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-600 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
            placeholder=" "
          />
          <label
            className="tw-absolute tw-cursor-text tw-text-base tw-font-normal tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-origin-[0] tw-bg-iron-900 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
           peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
          >
            Amount
          </label>
        </div> */}
        {outcome.winnersConfig && (
          <CreateWaveOutcomesWinners
            winnersConfig={outcome.winnersConfig}
            setWinnersConfig={setWinnersConfig}
          />
        )}
        <div className="tw-mt-6 tw-flex tw-justify-end tw-gap-x-3">
          <button
            type="button"
            className="tw-bg-iron-800 tw-border-iron-700 tw-text-white hover:tw-bg-iron-700 hover:tw-border-iron-700 tw-relative tw-inline-flex tw-items-center tw-justify-center tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-border tw-border-solid tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
          >
            Cancel
          </button>
          <button
            type="button"
            className="tw-bg-primary-500 tw-border-primary-500 tw-text-white hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-relative tw-inline-flex tw-items-center tw-justify-center tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-border tw-border-solid tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
