import type { CreateWaveOutcomeType } from "@/types/waves.types";

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
    <label
      className={`tw-group tw-flex tw-min-h-14 tw-min-w-0 tw-cursor-pointer tw-items-center tw-gap-2 tw-rounded-xl tw-border tw-border-solid tw-px-2.5 tw-py-2 tw-transition tw-duration-300 tw-ease-out focus-within:tw-ring-2 focus-within:tw-ring-inset focus-within:tw-ring-primary-400 sm:tw-min-h-12 sm:tw-gap-3 sm:tw-px-3 ${
        isActive
          ? "tw-border-primary-500/60 tw-bg-iron-900 tw-shadow-inner"
          : "tw-border-white/5 tw-bg-iron-900/60 hover:tw-border-white/10 hover:tw-bg-iron-900"
      }`}
    >
      <input
        id={`create-wave-outcome-type-${outcomeType.toLowerCase()}`}
        type="radio"
        name="create-wave-outcome-type"
        checked={isActive}
        aria-label={label}
        onChange={() => setOutcomeType(outcomeType)}
        className="tw-peer tw-sr-only"
      />
      <span
        aria-hidden="true"
        className={`tw-flex tw-size-4 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-transition tw-duration-300 tw-ease-out ${
          isActive
            ? "tw-border-primary-400 tw-bg-primary-500/10"
            : "tw-border-iron-600 tw-bg-transparent group-hover:tw-border-iron-500"
        }`}
      >
        <span
          className={`tw-size-2 tw-rounded-full tw-bg-primary-400 tw-transition tw-duration-200 ${
            isActive ? "tw-scale-100" : "tw-scale-0"
          }`}
        />
      </span>
      <span
        className={`tw-min-w-0 tw-flex-1 tw-whitespace-normal tw-text-xs tw-font-medium sm:tw-text-sm ${labelClasses}`}
      >
        {label}
      </span>
    </label>
  );
}
