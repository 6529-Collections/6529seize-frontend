import { CreateWaveOutcomeConfig } from "../../../../../../../types/waves.types";

export default function CreateWaveOutcomesRowCICRank({
  outcome,
  removeOutcome,
}: {
  readonly outcome: CreateWaveOutcomeConfig;
  readonly removeOutcome: () => void;
}) {
  return <div>CIC Rank</div>;
}