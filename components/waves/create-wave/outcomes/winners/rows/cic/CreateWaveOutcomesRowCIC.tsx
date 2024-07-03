import { WaveType } from "../../../../../../../generated/models/WaveType";
import { CreateWaveOutcomeConfig } from "../../../../../../../types/waves.types";
import CreateWaveOutcomesRowCICApprove from "./CreateWaveOutcomesRowCICApprove";
import CreateWaveOutcomesRowCICRank from "./CreateWaveOutcomesRowCICRank";

export default function CreateWaveOutcomesRowCIC({
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
      <CreateWaveOutcomesRowCICApprove
        outcome={outcome}
        removeOutcome={removeOutcome}
      />
    ),
    [WaveType.Rank]: (
      <CreateWaveOutcomesRowCICRank
        outcome={outcome}
        removeOutcome={removeOutcome}
      />
    ),
    [WaveType.Chat]: <div />,
  };
  return components[waveType];
}
