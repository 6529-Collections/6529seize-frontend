import type { TimeLeft } from "@/helpers/waves/time.utils";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate, formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";

interface CompactWinnerAnnouncementProps {
  readonly timestamp: number;
  readonly timeLeft: TimeLeft;
}

export const CompactWinnerAnnouncement = ({
  timestamp,
  timeLeft,
}: CompactWinnerAnnouncementProps) => {
  const locale = useBrowserLocale();
  const fullDate = formatDate(locale, timestamp, {
    dateStyle: "full",
    timeStyle: "long",
  });

  return (
    <div className="tw-min-w-0 tw-px-2">
      <div className="tw-flex tw-flex-col tw-gap-y-1 sm:tw-flex-row sm:tw-flex-wrap sm:tw-items-center">
        <span className="tw-text-xs tw-text-iron-400">
          {t(locale, "waves.leaderboard.phase.nextWinnersIn")}
        </span>
        <span className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-y-1">
          <span className="tw-ml-1 tw-whitespace-nowrap tw-font-mono tw-text-xs tw-tracking-tight tw-text-iron-300">
            {t(
              locale,
              timeLeft.days > 0
                ? "waves.leaderboard.phase.countdownWithDays"
                : "waves.leaderboard.phase.countdown",
              {
                days: formatInteger(locale, timeLeft.days),
                hours: formatInteger(locale, timeLeft.hours),
                minutes: formatInteger(locale, timeLeft.minutes),
              }
            )}
          </span>
          <time
            dateTime={new Date(timestamp).toISOString()}
            title={fullDate}
            aria-label={fullDate}
            className="tw-ml-2 tw-whitespace-nowrap tw-px-1.5 tw-text-xs tw-text-iron-400"
          >
            {formatDate(locale, timestamp, { month: "short", day: "numeric" })}
          </time>
        </span>
      </div>
    </div>
  );
};
