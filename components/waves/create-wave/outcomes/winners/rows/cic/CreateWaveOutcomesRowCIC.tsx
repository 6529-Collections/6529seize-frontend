import { ApiWaveType } from "../../../../../../../generated/models/ApiWaveType";
import { CreateWaveOutcomeConfig } from "../../../../../../../types/waves.types";
import CreateWaveOutcomesRowCICApprove from "./CreateWaveOutcomesRowCICApprove";
import CreateWaveOutcomesRowCICRank from "./CreateWaveOutcomesRowCICRank";

export default function CreateWaveOutcomesRowCIC({
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
      <CreateWaveOutcomesRowCICApprove
        outcome={outcome}
        removeOutcome={removeOutcome}
      />
    ),
    [ApiWaveType.Rank]: (
      <CreateWaveOutcomesRowCICRank
        outcome={outcome}
        removeOutcome={removeOutcome}
      />
    ),
    [ApiWaveType.Chat]: <div />,
  };
  return components[waveType];
}
