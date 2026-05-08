import type { CreateWaveOutcomeConfig } from "@/types/waves.types";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import CreateWaveOutcomesRepRank from "./CreateWaveOutcomesRepRank";
import CreateWaveOutcomesRepApprove from "./CreateWaveOutcomesRepApprove";

import type { JSX } from "react";

export default function CreateWaveOutcomesRep({
  waveType,
  onOutcome,
  onCancel,
}: {
  readonly waveType: ApiWaveType;
  readonly onOutcome: (outcome: CreateWaveOutcomeConfig) => void;
  readonly onCancel: () => void;
}) {
  const components: Record<ApiWaveType, JSX.Element> = {
    [ApiWaveType.Approve]: (
      <CreateWaveOutcomesRepApprove onOutcome={onOutcome} onCancel={onCancel} />
    ),
    [ApiWaveType.Rank]: (
      <CreateWaveOutcomesRepRank onOutcome={onOutcome} onCancel={onCancel} />
    ),
    [ApiWaveType.Chat]: <div />,
  };

  return components[waveType];
}
