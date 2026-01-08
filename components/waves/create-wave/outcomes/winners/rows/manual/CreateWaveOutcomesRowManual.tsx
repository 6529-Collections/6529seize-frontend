import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { CreateWaveOutcomeConfig } from "@/types/waves.types";
import CreateWaveOutcomesRowManualApprove from "./CreateWaveOutcomesRowManualApprove";
import CreateWaveOutcomesRowManualRank from "./CreateWaveOutcomesRowManualRank";

import type { JSX } from "react";

export default function CreateWaveOutcomesRowManual({
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
      <CreateWaveOutcomesRowManualApprove
        outcome={outcome}
        removeOutcome={removeOutcome}
      />
    ),
    [ApiWaveType.Rank]: (
      <CreateWaveOutcomesRowManualRank
        outcome={outcome}
        removeOutcome={removeOutcome}
      />
    ),
    [ApiWaveType.Chat]: <div />,
  };
  return components[waveType];
}
