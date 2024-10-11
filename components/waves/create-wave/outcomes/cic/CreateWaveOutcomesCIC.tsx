import {
  CreateWaveDatesConfig,
  CreateWaveOutcomeConfig,
} from "../../../../../types/waves.types";
import { ApiWaveType } from "../../../../../generated/models/ApiWaveType";
import CreateWaveOutcomesCICRank from "./CreateWaveOutcomesCICRank";
import CreateWaveOutcomesCICApprove from "./CreateWaveOutcomesCICApprove";

export default function CreateWaveOutcomesCIC({
  waveType,
  dates,
  onOutcome,
  onCancel,
}: {
  readonly waveType: ApiWaveType;
  readonly dates: CreateWaveDatesConfig;
  readonly onOutcome: (outcome: CreateWaveOutcomeConfig) => void;
  readonly onCancel: () => void;
}) {
  const components: Record<ApiWaveType, JSX.Element> = {
    [ApiWaveType.Approve]: (
      <CreateWaveOutcomesCICApprove
        onOutcome={onOutcome}
        onCancel={onCancel}
        dates={dates}
        waveType={waveType}
      />
    ),
    [ApiWaveType.Rank]: (
      <CreateWaveOutcomesCICRank onOutcome={onOutcome} onCancel={onCancel} />
    ),
    [ApiWaveType.Chat]: <div />,
  };
  return components[waveType];
}
