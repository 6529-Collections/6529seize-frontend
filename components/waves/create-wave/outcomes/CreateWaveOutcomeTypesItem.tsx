import type { CreateWaveOutcomeType } from "@/types/waves.types";
import CommonBorderedRadioButton from "@/components/utils/radio/CommonBorderedRadioButton";

const NO_SELECTION = "" as CreateWaveOutcomeType;

export default function CreateWaveOutcomeTypesItem({
  outcomeType,
  label,
  selectedOutcomeType,
  setOutcomeType,
}: {
  readonly outcomeType: CreateWaveOutcomeType;
  readonly label: string;
  readonly selectedOutcomeType: CreateWaveOutcomeType | null;
  readonly setOutcomeType: (value: CreateWaveOutcomeType | null) => void;
}) {
  const isActive = selectedOutcomeType === outcomeType;
  const labelClasses = isActive
    ? "tw-text-white"
    : "tw-text-iron-300 group-hover:tw-text-white";

  return (
    <CommonBorderedRadioButton
      type={outcomeType}
      selected={selectedOutcomeType ?? NO_SELECTION}
      variant="subtle"
      name="create-wave-outcome-type"
      ariaLabel={label}
      onChange={setOutcomeType}
    >
      <span
        className={`tw-flex tw-min-h-4 tw-min-w-0 tw-items-center tw-truncate tw-text-sm tw-font-medium ${labelClasses}`}
      >
        {label}
      </span>
    </CommonBorderedRadioButton>
  );
}
