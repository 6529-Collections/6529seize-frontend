import { WaveType } from "../../../../../../../generated/models/WaveType";
import { CreateWaveOutcomeConfig } from "../../../../../../../types/waves.types";
import CreateWaveOutcomesRowRepApprove from "./CreateWaveOutcomesRowRepApprove";
import CreateWaveOutcomesRowRepRank from "./CreateWaveOutcomesRowRepRank";

export default function CreateWaveOutcomesRowRep({
  waveType,
  outcome,
  removeOutcome,
}: {
  readonly waveType: WaveType;
  readonly outcome: CreateWaveOutcomeConfig;
  readonly removeOutcome: () => void;
}) {
  const components: Record<WaveType, JSX.Element> = {
    [WaveType.Approve]: (
      <CreateWaveOutcomesRowRepApprove
        outcome={outcome}
        removeOutcome={removeOutcome}
      />
    ),
    [WaveType.Rank]: (
      <CreateWaveOutcomesRowRepRank
        outcome={outcome}
        removeOutcome={removeOutcome}
      />
    ),
    [WaveType.Chat]: <div />,
  };
  return components[waveType];
}
