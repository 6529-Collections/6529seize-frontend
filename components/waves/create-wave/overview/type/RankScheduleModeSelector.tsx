"use client";

import CommonBorderedRadioButton from "@/components/utils/radio/CommonBorderedRadioButton";
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
        className="tw-mb-2 tw-text-sm tw-font-medium tw-text-iron-400"
      >
        {t(DEFAULT_LOCALE, "waves.create.rank.mode.legend")}
      </p>
      <div className="tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-2 [&>div]:tw-rounded-xl [&>div]:tw-px-3 [&>div]:tw-py-3 [&>div]:tw-shadow-none">
        {RANK_SCHEDULE_MODES.map(({ mode, title, description }) => {
          const isSelected = selectedScheduleMode === mode;
          const titleColorClass = isSelected
            ? "tw-text-white"
            : "tw-text-iron-300 group-hover:tw-text-white";
          const descriptionColorClass = isSelected
            ? "tw-text-iron-300"
            : "tw-text-iron-500";

          return (
            <CommonBorderedRadioButton
              key={mode}
              type={mode}
              selected={selectedScheduleMode}
              variant="subtle"
              name="rank-schedule-mode"
              ariaLabel={title}
              onChange={handleScheduleModeChange}
            >
              <div className="tw-min-w-0 tw-whitespace-normal">
                <span
                  className={`tw-flex tw-min-h-4 tw-items-center tw-text-sm tw-font-semibold ${titleColorClass}`}
                >
                  {title}
                </span>
                <p
                  className={`tw-mb-0 tw-mt-1 tw-text-xs tw-font-medium tw-leading-4 ${descriptionColorClass}`}
                >
                  {description}
                </p>
              </div>
            </CommonBorderedRadioButton>
          );
        })}
      </div>
    </fieldset>
  );
}
