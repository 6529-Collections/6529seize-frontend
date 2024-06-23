import CreateWaveOutcomeTypes from "./CreateWaveOutcomeTypes";
import CreateWaveOutcomesManual from "./CreateWaveOutcomesManual";
import CreateWaveOutcomesRep from "./CreateWaveOutcomesRep";
import WavesOutcomeCIC from "../overview/WavesOutcomeCIC";
import WavesOutcomeCards from "../overview/WavesOutcomeCards";
import { useState } from "react";
import {
  CreateWaveOutcomeConfig,
  CreateWaveOutcomeType,
} from "../../../../types/waves.types";
import CommonAnimationHeight from "../../../utils/animation/CommonAnimationHeight";

export default function WavesOutcome({
  outcomes,
  setOutcomes,
}: {
  readonly outcomes: CreateWaveOutcomeConfig[];
  readonly setOutcomes: (outcomes: CreateWaveOutcomeConfig[]) => void;
}) {
  const [outcomeType, setOutcomeType] = useState<CreateWaveOutcomeType | null>(
    CreateWaveOutcomeType.REP
  );

  const onOutcome = (outcome: CreateWaveOutcomeConfig) => {
    setOutcomes([...outcomes, outcome]);
    setOutcomeType(null);
  };

  const components: Record<CreateWaveOutcomeType, JSX.Element> = {
    [CreateWaveOutcomeType.MANUAL]: (
      <CreateWaveOutcomesManual onOutcome={onOutcome} />
    ),
    [CreateWaveOutcomeType.REP]: (
      <CreateWaveOutcomesRep onOutcome={onOutcome} />
    ),
    [CreateWaveOutcomeType.CIC]: <WavesOutcomeCIC />,
  };

  return (
    <div className="tw-mx-auto tw-w-full">
      <p className="tw-mb-0 tw-text-xl tw-font-bold tw-text-iron-50">
        Choose outcome type
      </p>
      <div className="tw-mt-3 tw-space-y-6">
        <CreateWaveOutcomeTypes
          outcomeType={outcomeType}
          setOutcomeType={setOutcomeType}
        />

        <CommonAnimationHeight>
          {outcomeType ? components[outcomeType] : <WavesOutcomeCards />}
        </CommonAnimationHeight>
      </div>
    </div>
  );
}
