import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";

/** "2d 4h", "3h 12m" or "4m 05s" for a span of seconds. */
export function formatDuration(
  locale: SupportedLocale,
  seconds: number
): string {
  const total = Math.max(0, Math.floor(seconds));
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);
  const secs = total % 60;
  const two = (value: number) =>
    formatInteger(locale, value).padStart(2, formatInteger(locale, 0));
  if (days > 0) {
    return t(locale, "stream.time.daysHours", {
      days: formatInteger(locale, days),
      hours: formatInteger(locale, hours),
    });
  }
  if (hours > 0) {
    return t(locale, "stream.time.hoursMinutes", {
      hours: formatInteger(locale, hours),
      minutes: two(minutes),
    });
  }
  return t(locale, "stream.time.minutesSeconds", {
    minutes: formatInteger(locale, minutes),
    seconds: two(secs),
  });
}

/**
 * Time left until `endTime`, from the data source's `now` (simulated in the
 * mock). Inside an anti-snipe or soft-close window it says that a bid moves the
 * end; `extended` marks an end a late bid already moved.
 */
export default function Countdown({
  endTime,
  now,
  locale,
  closeWindow,
  extended = false,
  className = "",
}: {
  readonly endTime: number;
  readonly now: number;
  readonly locale: SupportedLocale;
  /** The anti-snipe (15 min) or soft-close (5 min) window, in seconds. */
  readonly closeWindow?: number;
  readonly extended?: boolean;
  readonly className?: string;
}) {
  const remaining = endTime - now;
  const ended = remaining <= 0;
  const windowSeconds = closeWindow ?? 0;
  const inWindow = windowSeconds > 0 && !ended && remaining <= windowSeconds;
  const text = ended
    ? t(locale, "stream.countdown.ended")
    : t(locale, "stream.countdown.endsIn", {
        time: formatDuration(locale, remaining),
      });
  return (
    <span
      className={`tw-inline-flex tw-flex-wrap tw-items-baseline tw-gap-x-2 ${className}`}
    >
      <span role="timer" className="tw-tabular-nums">
        <time dateTime={new Date(endTime * 1_000).toISOString()}>{text}</time>
      </span>
      {inWindow ? (
        <span className="tw-text-xs tw-font-medium tw-text-primary-300">
          {t(locale, "stream.countdown.window", {
            minutes: formatInteger(locale, Math.round(windowSeconds / 60)),
          })}
        </span>
      ) : null}
      {extended && !ended ? (
        <span className="tw-text-xs tw-text-iron-400">
          {t(locale, "stream.countdown.extended")}
        </span>
      ) : null}
    </span>
  );
}
