import React from "react";
import { TrophyIcon } from "@heroicons/react/24/outline";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export const WaveWinnersEmpty: React.FC = () => {
  const locale = useBrowserLocale();

  return (
    <div className="tw-flex tw-items-center tw-justify-center tw-rounded-xl tw-bg-iron-950/60 tw-px-4 tw-py-16">
      <div className="tw-flex tw-max-w-xs tw-flex-col tw-items-center tw-gap-4 tw-text-center">
        <TrophyIcon
          aria-hidden="true"
          className="tw-size-10 tw-text-iron-600"
        />
        <div className="tw-space-y-1.5">
          <p className="tw-text-base tw-font-medium tw-text-iron-300">
            {t(locale, "waves.leaderboard.podium.empty.title")}
          </p>
          <p className="tw-text-sm tw-text-iron-500">
            {t(locale, "waves.leaderboard.podium.empty.description")}
          </p>
        </div>
      </div>
    </div>
  );
};
