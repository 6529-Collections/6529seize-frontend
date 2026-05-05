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
  const activeClasses =
    "tw-border-primary-400 tw-bg-primary-500/5 tw-ring-primary-400 tw-ring-primary-500/30 tw-text-white";
  const inactiveClasses =
    "tw-border-white/5 tw-bg-iron-900 tw-ring-white/5 tw-text-iron-300 hover:tw-border-white/10 hover:tw-bg-iron-800 hover:tw-text-white hover:tw-ring-white/10";
  const classes = isActive ? activeClasses : inactiveClasses;
  return (
    <button
      onClick={() => setOutcomeType(outcomeType)}
      type="button"
      className={`${classes} tw-group tw-relative tw-flex tw-min-h-full tw-cursor-pointer tw-items-center tw-gap-x-3 tw-rounded-xl tw-border tw-border-solid tw-px-3 tw-py-3 tw-text-sm tw-font-semibold tw-shadow-inner tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out focus:tw-outline-none`}
    >
      <span
        aria-hidden="true"
        className={`tw-flex tw-h-4 tw-w-4 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-transition tw-duration-300 tw-ease-out ${
          isActive
            ? "tw-border-primary-400 tw-bg-primary-500/10"
            : "tw-border-iron-600 tw-bg-transparent group-hover:tw-border-iron-500"
        }`}
      >
        <span
          className={`tw-h-2 tw-w-2 tw-rounded-full tw-bg-primary-400 tw-transition tw-duration-200 ${
            isActive ? "tw-scale-100" : "tw-scale-0"
          }`}
        />
      </span>
      <span className="tw-min-w-0 tw-truncate">{label}</span>
    </button>
  );
}
