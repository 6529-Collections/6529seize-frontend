import { formatUtcDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type { UnixSeconds } from "@/lib/stream/types";

/** "3 Nov 2026, 17:15 UTC": an instant from the data source, always in UTC. */
export function formatStreamTime(
  locale: SupportedLocale,
  seconds: UnixSeconds
): string {
  return t(locale, "stream.workTime.utc", {
    time: formatUtcDate(locale, seconds * 1_000, {
      dateStyle: "medium",
      timeStyle: "short",
    }),
  });
}

/** A UTC instant in a `<time>` element. */
export default function StreamTime({
  seconds,
  locale,
}: {
  readonly seconds: UnixSeconds;
  readonly locale: SupportedLocale;
}) {
  return (
    <time
      dateTime={new Date(seconds * 1_000).toISOString()}
      className="tw-tabular-nums"
    >
      {formatStreamTime(locale, seconds)}
    </time>
  );
}
