import CreateWaveOutcomeTypes from "./CreateWaveOutcomeTypes";
import CreateWaveOutcomesManual from "./CreateWaveOutcomesManual";
import CreateWaveOutcomesRep from "./CreateWaveOutcomesRep";
import CreateWaveOutcomesCIC from "./CreateWaveOutcomesCIC";
import CreateWaveOutcomesRows from "./winners/CreateWaveOutcomesRows";
import {
  CreateWaveOutcomeConfig,
  CreateWaveOutcomeType,
} from "../../../../types/waves.types";
import CommonAnimationHeight from "../../../utils/animation/CommonAnimationHeight";

export default function WavesOutcome({
  outcomes,
  outcomeType,
  setOutcomeType,
  setOutcomes,
}: {
  readonly outcomes: CreateWaveOutcomeConfig[];
  readonly outcomeType: CreateWaveOutcomeType | null;
  readonly setOutcomeType: (outcomeType: CreateWaveOutcomeType | null) => void;
  readonly setOutcomes: (outcomes: CreateWaveOutcomeConfig[]) => void;
}) {
  const onOutcome = (outcome: CreateWaveOutcomeConfig) => {
    setOutcomes([...outcomes, outcome]);
    setOutcomeType(null);
  };

  const onCancel = () => {
    setOutcomeType(null);
  };

  const components: Record<CreateWaveOutcomeType, JSX.Element> = {
    [CreateWaveOutcomeType.MANUAL]: (
      <CreateWaveOutcomesManual onOutcome={onOutcome} onCancel={onCancel} />
    ),
    [CreateWaveOutcomeType.REP]: (
      <CreateWaveOutcomesRep onOutcome={onOutcome} onCancel={onCancel} />
    ),
    [CreateWaveOutcomeType.CIC]: (
      <CreateWaveOutcomesCIC onOutcome={onOutcome} onCancel={onCancel} />
    ),
  };

  return (
    <div className="tw-mx-auto tw-w-full">
      <p className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-white">
        Choose outcome type
      </p>
      <div className="tw-mt-3 tw-space-y-6">
        <CreateWaveOutcomeTypes
          outcomeType={outcomeType}
          setOutcomeType={setOutcomeType}
        />
        <div>
          {/* <h3 className="tw-mb-2 tw-text-base tw-font-semibold tw-text-white">Title for created outcome cards</h3> */}
          <CommonAnimationHeight>
            {outcomeType ? (
              components[outcomeType]
            ) : (
              <CreateWaveOutcomesRows
                outcomes={outcomes}
                setOutcomes={setOutcomes}
              />
            )}
          </CommonAnimationHeight>
        </div>
      </div>
    </div>
  );
}