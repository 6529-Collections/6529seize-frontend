import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { CreateWaveOutcomeConfig } from "@/types/waves.types";
import CreateWaveOutcomesRowCICApprove from "./CreateWaveOutcomesRowCICApprove";
import CreateWaveOutcomesRowCICRank from "./CreateWaveOutcomesRowCICRank";

import type { JSX } from "react";

export default function CreateWaveOutcomesRowCIC({
  waveType,
  outcome,
}: {
  readonly waveType: ApiWaveType;
  readonly outcome: CreateWaveOutcomeConfig;
}) {
  const components: Record<ApiWaveType, JSX.Element> = {
    [ApiWaveType.Approve]: (
      <CreateWaveOutcomesRowCICApprove outcome={outcome} />
    ),
    [ApiWaveType.Rank]: <CreateWaveOutcomesRowCICRank outcome={outcome} />,
    [ApiWaveType.Chat]: <div />,
  };
  return components[waveType];
}
