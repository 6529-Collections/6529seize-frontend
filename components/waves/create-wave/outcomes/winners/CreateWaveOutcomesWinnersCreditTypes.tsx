import { CreateWaveOutcomeConfigWinnersCreditValueType } from "../../../../../types/waves.types";
import CreateWaveOutcomesWinnersCreditType from "./CreateWaveOutcomesWinnersCreditType";

export default function CreateWaveOutcomesWinnersCreditTypes({
  activeCreditType,
  setActiveCreditType,
}: {
  readonly activeCreditType: CreateWaveOutcomeConfigWinnersCreditValueType;
  readonly setActiveCreditType: (
    activeCreditType: CreateWaveOutcomeConfigWinnersCreditValueType
  ) => void;
}) {
  const LABELS: Record<CreateWaveOutcomeConfigWinnersCreditValueType, string> =
    {
      [CreateWaveOutcomeConfigWinnersCreditValueType.ABSOLUTE_VALUE]: "Number",
      [CreateWaveOutcomeConfigWinnersCreditValueType.PERCENTAGE]: "Percentage",
    };

  return (
    <div className="tw-flex">
      <span className="tw-isolate tw-inline-flex tw-rounded-lg tw-shadow-sm">
        {Object.values(CreateWaveOutcomeConfigWinnersCreditValueType).map(
          (type, i) => (
            <CreateWaveOutcomesWinnersCreditType
              key={type}
              activeCreditType={activeCreditType}
              creditType={type}
              label={LABELS[type]}
              isFirst={i === 0}
              isLast={
                i ===
                Object.values(CreateWaveOutcomeConfigWinnersCreditValueType)
                  .length -
                  1
              }
              setActiveCreditType={setActiveCreditType}
            />
          )
        )}
      </span>
    </div>
  );
}
