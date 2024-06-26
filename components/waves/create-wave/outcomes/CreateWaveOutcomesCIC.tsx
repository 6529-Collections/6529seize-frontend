import { useState } from "react";
import {
  CreateWaveOutcomeConfig,
  CreateWaveOutcomeConfigWinnersConfig,
  CreateWaveOutcomeConfigWinnersCreditValueType,
  CreateWaveOutcomeType,
} from "../../../../types/waves.types";
import CreateWaveOutcomesWinners from "./winners/CreateWaveOutcomesWinners";

export default function CreateWaveOutcomesCIC({
  onOutcome,
  onCancel,
}: {
  readonly onOutcome: (outcome: CreateWaveOutcomeConfig) => void;
  readonly onCancel: () => void;
}) {
  const [outcome, setOutcome] = useState<CreateWaveOutcomeConfig>({
    type: CreateWaveOutcomeType.CIC,
    title: null,
    credit: null,
    category: null,
    winnersConfig: {
      creditValueType:
        CreateWaveOutcomeConfigWinnersCreditValueType.ABSOLUTE_VALUE,
      totalAmount: 0,
      winners: [{ value: 0 }],
    },
  });

  const setWinnersConfig = (
    winnersConfig: CreateWaveOutcomeConfigWinnersConfig
  ) => {
    setOutcome({ ...outcome, winnersConfig });
  };
  return (
    <div className="tw-col-span-full tw-flex tw-flex-col tw-gap-y-2">
      <div className="tw-flex tw-flex-col tw-gap-y-6">
        {outcome.winnersConfig && (
          <CreateWaveOutcomesWinners
            winnersConfig={outcome.winnersConfig}
            setWinnersConfig={setWinnersConfig}
          />
        )}
        <div className="tw-mt-6 tw-flex tw-justify-end tw-gap-x-3">
          <button
            onClick={onCancel}
            type="button"
            className="tw-bg-iron-800 tw-border-iron-700 tw-text-iron-300 hover:tw-bg-iron-700 hover:tw-border-iron-700 tw-relative tw-inline-flex tw-items-center tw-justify-center tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-border tw-border-solid tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
          >
            Cancel
          </button>
          <button
            onClick={() => onOutcome(outcome)}
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
