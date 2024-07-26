import {
  CreateWaveDatesConfig,
  CreateWaveOutcomeConfig,
} from "../../../../../types/waves.types";
import { WaveType } from "../../../../../generated/models/WaveType";
import CreateWaveOutcomesRepRank from "./CreateWaveOutcomesRepRank";
import CreateWaveOutcomesRepApprove from "./CreateWaveOutcomesRepApprove";

export default function CreateWaveOutcomesRep({
  waveType,
  dates,
  onOutcome,
  onCancel,
}: {
  readonly waveType: WaveType;
  readonly dates: CreateWaveDatesConfig;
  readonly onOutcome: (outcome: CreateWaveOutcomeConfig) => void;
  readonly onCancel: () => void;
}) {
  const components: Record<WaveType, JSX.Element> = {
    [WaveType.Approve]: (
      <CreateWaveOutcomesRepApprove
        onOutcome={onOutcome}
        onCancel={onCancel}
        dates={dates}
        waveType={waveType}
      />
    ),
    [WaveType.Rank]: (
      <CreateWaveOutcomesRepRank onOutcome={onOutcome} onCancel={onCancel} />
    ),
    [WaveType.Chat]: <div />,
  };

  return components[waveType];
}
