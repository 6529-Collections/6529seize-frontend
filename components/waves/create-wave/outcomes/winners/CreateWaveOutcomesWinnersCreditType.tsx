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

  const activeClasses = "tw-bg-primary-500 tw-text-white";
  const inActiveClasses =
    "hover:tw-bg-iron-800 tw-text-iron-500 hover:tw-text-iron-100";
  const classes = `${isActive ? activeClasses : inActiveClasses} ${
    isFirst && !isLast ? "tw-rounded-l-lg" : ""
  } ${isLast && !isFirst ? "tw-rounded-r-lg" : ""} ${
    isFirst && isLast ? "tw-rounded-lg" : ""
  }`;

  return (
    <button
      onClick={() => setActiveCreditType(creditType)}
      type="button"
      className={`${classes} tw-bg-iron-900 tw-whitespace-nowrap tw-flex-1 sm:tw-flex-none tw-px-3 tw-py-2 tw-text-sm tw-leading-5 tw-font-semibold tw-border-0 tw-rounded-lg tw-transition-all tw-duration-300 tw-ease-out`}
    >
      {label}
    </button>
  );
}
