import { CreateWaveOutcomeType } from "@/types/waves.types";
import CreateWaveOutcomeTypesItem from "./CreateWaveOutcomeTypesItem";

export default function CreateWaveOutcomeTypes({
  outcomeType,
  setOutcomeType,
}: {
  readonly outcomeType: CreateWaveOutcomeType | null;
  readonly setOutcomeType: (value: CreateWaveOutcomeType | null) => void;
}) {
  const LABELS: Record<CreateWaveOutcomeType, string> = {
    [CreateWaveOutcomeType.MANUAL]: "Manual",
    [CreateWaveOutcomeType.REP]: "Rep",
    [CreateWaveOutcomeType.NIC]: "NIC",
  };
  return (
    <div className="tw-grid tw-grid-cols-3 tw-gap-x-4 tw-gap-y-4">
      {Object.values(CreateWaveOutcomeType).map((type) => (
        <CreateWaveOutcomeTypesItem
          key={type}
          outcomeType={type}
          label={LABELS[type]}
          selectedOutcomeType={outcomeType}
          setOutcomeType={setOutcomeType}
        />
      ))}
    </div>
  );
}
