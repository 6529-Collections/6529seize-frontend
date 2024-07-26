import {
  CreateWaveDatesConfig,
  CreateWaveOutcomeConfig,
} from "../../../../../types/waves.types";
import { WaveType } from "../../../../../generated/models/WaveType";
import CreateWaveOutcomesCICRank from "./CreateWaveOutcomesCICRank";
import CreateWaveOutcomesCICApprove from "./CreateWaveOutcomesCICApprove";

export default function CreateWaveOutcomesCIC({
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
      <CreateWaveOutcomesCICApprove
        onOutcome={onOutcome}
        onCancel={onCancel}
        dates={dates}
        waveType={waveType}
      />
    ),
    [WaveType.Rank]: (
      <CreateWaveOutcomesCICRank onOutcome={onOutcome} onCancel={onCancel} />
    ),
    [WaveType.Chat]: <div />,
  };
  return components[waveType];
}
