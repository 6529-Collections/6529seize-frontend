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
    "tw-text-primary-400 tw-ring-primary-400 tw-bg-[#202B45] tw-shadow-xl";
  const inactiveClasses =
    "tw-text-iron-300 hover:tw-text-iron-200 tw-ring-iron-700 tw-bg-iron-800 hover:tw-ring-iron-650 tw-shadow-sm";
  const classes = isActive ? activeClasses : inactiveClasses;
  return (
    <button
      onClick={() => setOutcomeType(outcomeType)}
      type="button"
      className={`${classes} tw-text-base tw-font-semibold tw-border-0 tw-flex-1 tw-relative tw-block tw-cursor-pointer tw-rounded-lg tw-ring-1 tw-ring-inset tw-px-5 tw-py-4 focus:tw-outline-none sm:tw-flex sm:tw-items-center tw-gap-x-3 tw-transition tw-duration-300 tw-ease-out`}
    >
      {label}
    </button>
  );
}
