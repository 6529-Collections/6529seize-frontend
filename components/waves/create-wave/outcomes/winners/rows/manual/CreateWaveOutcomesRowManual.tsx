import { WaveType } from "../../../../../../../generated/models/WaveType";
import { CreateWaveOutcomeConfig } from "../../../../../../../types/waves.types";
import CreateWaveOutcomesRowManualApprove from "./CreateWaveOutcomesRowManualApprove";
import CreateWaveOutcomesRowManualRank from "./CreateWaveOutcomesRowManualRank";

export default function CreateWaveOutcomesRowManual({
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
      <CreateWaveOutcomesRowManualApprove
        outcome={outcome}
        removeOutcome={removeOutcome}
      />
    ),
    [WaveType.Rank]: (
      <CreateWaveOutcomesRowManualRank
        outcome={outcome}
        removeOutcome={removeOutcome}
      />
    ),
    [WaveType.Chat]: <div />,
  };
  return components[waveType];
}
