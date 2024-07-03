import { CreateWaveOutcomeConfig } from "../../../../../../../types/waves.types";

export default function CreateWaveOutcomesRowRepApprove({
  outcome,
  removeOutcome,
}: {
  readonly outcome: CreateWaveOutcomeConfig;
  readonly removeOutcome: () => void;
}) {
  return <div>Rep Approve</div>;
}