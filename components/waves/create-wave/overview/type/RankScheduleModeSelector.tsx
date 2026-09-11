"use client";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

type RankScheduleMode = "ANNOUNCE_WINNERS" | "PERPETUAL_RANKING";

const RANK_SCHEDULE_MODES: {
  readonly mode: RankScheduleMode;
  readonly title: string;
  readonly description: string;
}[] = [
  {
    mode: "ANNOUNCE_WINNERS",
    title: t(DEFAULT_LOCALE, "waves.create.rank.mode.announceWinners.title"),
    description: t(
      DEFAULT_LOCALE,
      "waves.create.rank.mode.announceWinners.description"
    ),
  },
  {
    mode: "PERPETUAL_RANKING",
    title: t(DEFAULT_LOCALE, "waves.create.rank.mode.perpetualRanking.title"),
    description: t(
      DEFAULT_LOCALE,
      "waves.create.rank.mode.perpetualRanking.description"
    ),
  },
];

const RANK_PREVIEW_ITEMS = [0, 1, 2] as const;

function RankScheduleModePreview({
  mode,
  isSelected,
}: {
  readonly mode: RankScheduleMode;
  readonly isSelected: boolean;
}) {
  const accentClass = isSelected ? "tw-bg-primary-400/80" : "tw-bg-iron-650";
  const timelineDotClasses = [
    "tw-bg-iron-600",
    `${accentClass} tw-ring-2 tw-ring-primary-400/15`,
    "tw-border tw-border-solid tw-border-white/15 tw-bg-iron-900",
  ] as const;
  const leaderboardLineWidthClasses = [
    "tw-w-2/3",
    "tw-w-1/2",
    "tw-w-2/5",
  ] as const;

  return (
    <div
      aria-hidden="true"
      className="tw-h-16 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950/70 tw-p-2 sm:tw-h-20 sm:tw-p-3"
    >
      {mode === "ANNOUNCE_WINNERS" ? (
        <div className="tw-flex tw-h-full tw-items-center tw-rounded-md tw-bg-iron-900 tw-px-2 sm:tw-px-3">
          <div className="tw-relative tw-grid tw-w-full tw-grid-cols-3">
            <span className="tw-absolute tw-left-[16.66%] tw-right-[16.66%] tw-top-[3px] tw-h-px tw-bg-white/10" />
            {RANK_PREVIEW_ITEMS.map((item) => (
              <span
                key={item}
                className="tw-relative tw-z-10 tw-flex tw-flex-col tw-items-center"
              >
                <span
                  className={`tw-size-2 tw-rounded-full ${timelineDotClasses[item]}`}
                />
                <span className="tw-mt-2 tw-h-1 tw-w-5 tw-rounded-full tw-bg-iron-700 sm:tw-w-7" />
                <span className="tw-mt-1 tw-h-0.5 tw-w-3 tw-rounded-full tw-bg-iron-800 sm:tw-w-4" />
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="tw-flex tw-h-full tw-flex-col tw-justify-center tw-gap-1 sm:tw-gap-1.5">
          {RANK_PREVIEW_ITEMS.map((item) => (
            <span
              key={item}
              className="tw-flex tw-h-3 tw-items-center tw-gap-1.5 tw-rounded-sm tw-bg-iron-900 tw-px-1.5 sm:tw-h-4 sm:tw-gap-2 sm:tw-px-2"
            >
              <span
                className={`tw-size-1.5 tw-flex-shrink-0 tw-rounded-full sm:tw-size-2 ${
                  item === 0 ? accentClass : "tw-bg-iron-700"
                }`}
              />
              <span
                className={`tw-h-1 tw-rounded-full tw-bg-iron-700 ${leaderboardLineWidthClasses[item]}`}
              />
              <span className="tw-ml-auto tw-h-1 tw-w-3 tw-rounded-full tw-bg-iron-800 sm:tw-w-4" />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RankScheduleModeSelector({
  ongoingRanking,
  onChange,
}: {
  readonly ongoingRanking: boolean;
  readonly onChange: (ongoingRanking: boolean) => void;
}) {
  const selectedScheduleMode: RankScheduleMode = ongoingRanking
    ? "PERPETUAL_RANKING"
    : "ANNOUNCE_WINNERS";

  const handleScheduleModeChange = (mode: RankScheduleMode) => {
    const ongoing = mode === "PERPETUAL_RANKING";
    if (ongoing !== ongoingRanking) {
      onChange(ongoing);
    }
  };

  return (
    // The dashed rule and visible label separate this Rank-only sub-choice
    // from the Wave Type cards above, which use the same radio-card styling
    // and would otherwise read as one continuous list of types.
    <fieldset className="tw-m-0 tw-min-w-0 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-dashed tw-border-iron-700/80 tw-p-0 tw-pt-4">
      <legend className="tw-sr-only">
        {t(DEFAULT_LOCALE, "waves.create.rank.mode.legend")}
      </legend>
      <p
        aria-hidden="true"
        className="tw-m-0 tw-mb-3 tw-text-base tw-font-semibold tw-text-iron-100"
      >
        {t(DEFAULT_LOCALE, "waves.create.rank.mode.legend")}
      </p>
      <div className="tw-grid tw-grid-cols-2 tw-gap-3">
        {RANK_SCHEDULE_MODES.map(({ mode, title, description }) => {
          const isSelected = selectedScheduleMode === mode;
          const titleColorClass = isSelected
            ? "tw-text-white"
            : "tw-text-iron-300 group-hover:tw-text-white";
          const descriptionColorClass = "tw-text-iron-400";

          return (
            <label
              key={mode}
              className={`tw-group tw-min-w-0 tw-cursor-pointer tw-rounded-xl tw-border tw-border-solid tw-p-2 tw-transition tw-duration-300 tw-ease-out focus-within:tw-ring-2 focus-within:tw-ring-inset focus-within:tw-ring-primary-400 sm:tw-p-3 ${
                isSelected
                  ? "tw-border-primary-500/60 tw-bg-iron-900 tw-shadow-inner"
                  : "tw-border-white/5 tw-bg-iron-900/60 hover:tw-border-white/10 hover:tw-bg-iron-900"
              }`}
            >
              <RankScheduleModePreview mode={mode} isSelected={isSelected} />
              <div className="tw-mt-2 tw-flex tw-min-w-0 tw-items-start tw-gap-2 sm:tw-mt-3 sm:tw-gap-3">
                <input
                  id={`rank-schedule-mode-${mode.toLowerCase()}`}
                  type="radio"
                  name="rank-schedule-mode"
                  checked={isSelected}
                  aria-label={title}
                  onChange={() => handleScheduleModeChange(mode)}
                  className="tw-peer tw-sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`tw-mt-0.5 tw-flex tw-size-4 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-transition tw-duration-300 tw-ease-out ${
                    isSelected
                      ? "tw-border-primary-400 tw-bg-primary-500/10"
                      : "tw-border-iron-600 tw-bg-transparent group-hover:tw-border-iron-500"
                  }`}
                >
                  <span
                    className={`tw-size-2 tw-rounded-full tw-bg-primary-400 tw-transition tw-duration-200 ${
                      isSelected ? "tw-scale-100" : "tw-scale-0"
                    }`}
                  />
                </span>
                <span className="tw-min-w-0 tw-whitespace-normal">
                  <span
                    className={`tw-flex tw-min-h-4 tw-items-center tw-text-xs tw-font-medium sm:tw-text-sm ${titleColorClass}`}
                  >
                    {title}
                  </span>
                  <span
                    className={`tw-mt-1 tw-block tw-text-xs tw-font-normal tw-leading-4 ${descriptionColorClass}`}
                  >
                    {description}
                  </span>
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
