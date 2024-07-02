import { CreateWaveOutcomeConfig } from "../../../../../types/waves.types";
import { WaveType } from "../../../../../generated/models/WaveType";
import CreateWaveOutcomesRepRank from "./CreateWaveOutcomesRepRank";
import CreateWaveOutcomesRepApprove from "./CreateWaveOutcomesRepApprove";

export default function CreateWaveOutcomesRep({
  waveType,
  onOutcome,
  onCancel,
}: {
  readonly waveType: WaveType;
  readonly onOutcome: (outcome: CreateWaveOutcomeConfig) => void;
  readonly onCancel: () => void;
}) {
  const components: Record<WaveType, JSX.Element> = {
    [WaveType.Approve]: (
      <CreateWaveOutcomesRepApprove onOutcome={onOutcome} onCancel={onCancel} />
    ),
    [WaveType.Rank]: (
      <CreateWaveOutcomesRepRank onOutcome={onOutcome} onCancel={onCancel} />
    ),
    [WaveType.Chat]: <div />,
  };

  return components[waveType];
}
