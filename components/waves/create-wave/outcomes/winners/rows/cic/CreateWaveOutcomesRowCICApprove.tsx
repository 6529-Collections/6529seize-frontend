import { CreateWaveOutcomeConfig } from "../../../../../../../types/waves.types";

export default function CreateWaveOutcomesRowCICApprove({
  outcome,
  removeOutcome,
}: {
  readonly outcome: CreateWaveOutcomeConfig;
  readonly removeOutcome: () => void;
}) {
  return <div>CIC Approve</div>;
}