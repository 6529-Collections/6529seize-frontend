import {
  CreateWaveDatesConfig,
  CreateWaveOutcomeConfig,
} from "../../../../../types/waves.types";
import { ApiWaveType } from "../../../../../generated/models/ApiWaveType";
import CreateWaveOutcomesRepRank from "./CreateWaveOutcomesRepRank";
import CreateWaveOutcomesRepApprove from "./CreateWaveOutcomesRepApprove";

import type { JSX } from "react";

export default function CreateWaveOutcomesRep({
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
      <CreateWaveOutcomesRepApprove
        onOutcome={onOutcome}
        onCancel={onCancel}
        dates={dates}
        waveType={waveType}
      />
    ),
    [ApiWaveType.Rank]: (
      <CreateWaveOutcomesRepRank onOutcome={onOutcome} onCancel={onCancel} />
    ),
    [ApiWaveType.Chat]: <div />,
  };

  return components[waveType];
}
