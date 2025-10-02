import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { CreateWaveOutcomeConfig } from "@/types/waves.types";
import CreateWaveOutcomesRowRepApprove from "./CreateWaveOutcomesRowRepApprove";
import CreateWaveOutcomesRowRepRank from "./CreateWaveOutcomesRowRepRank";

import type { JSX } from "react";

export default function CreateWaveOutcomesRowRep({
  waveType,
  outcome,
  removeOutcome,
}: {
  readonly waveType: ApiWaveType;
  readonly outcome: CreateWaveOutcomeConfig;
  readonly removeOutcome: () => void;
}) {
  const components: Record<ApiWaveType, JSX.Element> = {
    [ApiWaveType.Approve]: (
      <CreateWaveOutcomesRowRepApprove
        outcome={outcome}
        removeOutcome={removeOutcome}
      />
    ),
    [ApiWaveType.Rank]: (
      <CreateWaveOutcomesRowRepRank
        outcome={outcome}
        removeOutcome={removeOutcome}
      />
    ),
    [ApiWaveType.Chat]: <div />,
  };
  return components[waveType];
}
