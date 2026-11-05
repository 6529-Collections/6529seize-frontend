import type { TimeLeft } from "@/helpers/waves/time.utils";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate, formatInteger } from "@/i18n/format";
import { t, type MessageKey } from "@/i18n/messages";

interface CompactPhaseStatusProps {
  readonly labelKey: MessageKey;
  readonly timestamp?: number | undefined;
  readonly timeLeft?: TimeLeft | undefined;
  readonly detailKey?: MessageKey | undefined;
}

/** Shared status and date layout for the compact competition schedule. */
export function CompactPhaseStatus({
  labelKey,
  timestamp,
  timeLeft,
  detailKey,
}: CompactPhaseStatusProps) {
  const locale = useBrowserLocale();
  const date =
    typeof timestamp === "number" && timestamp > 0 ? new Date(timestamp) : null;
  const hasDate = date !== null && Number.isFinite(date.getTime());
  const fullDate = hasDate
    ? formatDate(locale, date, { dateStyle: "full", timeStyle: "long" })
    : undefined;

  return (
    <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-baseline tw-gap-x-2 tw-gap-y-1">
      <p className="tw-m-0 tw-text-xs tw-font-normal tw-leading-5 tw-text-iron-400">
        {t(locale, labelKey)}
      </p>
      <div className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-2 tw-gap-y-1 tw-text-xs tw-leading-5 tw-text-iron-400">
        {timeLeft && (
          <span className="tw-whitespace-nowrap tw-tabular-nums">
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
        )}
        {hasDate && (
          <time
            dateTime={date.toISOString()}
            title={fullDate}
            aria-label={fullDate}
            className="tw-whitespace-nowrap"
          >
            {formatDate(locale, date, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </time>
        )}
        {detailKey && <span>{t(locale, detailKey)}</span>}
      </div>
    </div>
  );
}
