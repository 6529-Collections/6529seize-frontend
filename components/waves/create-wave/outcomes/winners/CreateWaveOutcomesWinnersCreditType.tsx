import { CreateWaveOutcomeConfigWinnersCreditValueType } from "../../../../../types/waves.types";

export default function CreateWaveOutcomesWinnersCreditType({
  activeCreditType,
  creditType,
  label,
  isFirst,
  isLast,
  setActiveCreditType,
}: {
  readonly activeCreditType: CreateWaveOutcomeConfigWinnersCreditValueType;
  readonly creditType: CreateWaveOutcomeConfigWinnersCreditValueType;
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly label: string;
  readonly setActiveCreditType: (
    activeCreditType: CreateWaveOutcomeConfigWinnersCreditValueType
  ) => void;
}) {
  const isActive = activeCreditType === creditType;

  const activeClasses = "tw-bg-primary-500";
  const inActiveClasses = "tw-bg-iron-800";
  const classes = `${isActive ? activeClasses : inActiveClasses} ${
    isFirst && !isLast ? "tw-rounded-l-lg" : ""
  } ${isLast && !isFirst ? "tw-rounded-r-lg" : ""} ${
    isFirst && isLast ? "tw-rounded-lg" : ""
  }`;

  return (
    <button
      onClick={() => setActiveCreditType(creditType)}
      type="button"
      className={`${classes} tw-border-0 tw-relative tw-inline-flex tw-items-center  tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-700 focus:tw-z-10`}
    >
      {label}
    </button>
  );
}
