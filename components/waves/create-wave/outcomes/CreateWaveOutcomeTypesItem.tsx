import type { CreateWaveOutcomeType } from "@/types/waves.types";

export default function CreateWaveOutcomeTypesItem({
  outcomeType,
  label,
  description,
  selectedOutcomeType,
  setOutcomeType,
}: {
  readonly outcomeType: CreateWaveOutcomeType;
  readonly label: string;
  readonly description: string;
  readonly selectedOutcomeType: CreateWaveOutcomeType | null;
  readonly setOutcomeType: (value: CreateWaveOutcomeType | null) => void;
}) {
  const isActive = selectedOutcomeType === outcomeType;
  const descriptionId = `create-wave-outcome-type-${outcomeType.toLowerCase()}-description`;
  const activeClasses =
    "tw-border-primary-400 tw-bg-primary-500/5 tw-ring-primary-400 tw-ring-primary-500/30 tw-text-white";
  const inactiveClasses =
    "tw-border-white/5 tw-bg-iron-900 tw-ring-white/5 tw-text-iron-300 hover:tw-border-white/10 hover:tw-bg-iron-800 hover:tw-text-white hover:tw-ring-white/10";
  const classes = isActive ? activeClasses : inactiveClasses;
  return (
    <button
      onClick={() => setOutcomeType(outcomeType)}
      type="button"
      aria-pressed={isActive}
      aria-describedby={descriptionId}
      className={`${classes} tw-group tw-relative tw-flex tw-min-h-20 tw-cursor-pointer tw-items-start tw-gap-x-3 tw-rounded-xl tw-border tw-border-solid tw-px-3 tw-py-3 tw-text-left tw-shadow-inner tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950`}
    >
      <span
        aria-hidden="true"
        className={`tw-mt-0.5 tw-flex tw-h-4 tw-w-4 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-transition tw-duration-300 tw-ease-out ${
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
      <span className="tw-min-w-0">
        <span className="tw-block tw-text-sm tw-font-semibold">{label}</span>
        <span
          id={descriptionId}
          className="tw-mt-1 tw-block tw-text-xs tw-font-normal tw-leading-5 tw-text-iron-400"
        >
          {description}
        </span>
      </span>
    </button>
  );
}
