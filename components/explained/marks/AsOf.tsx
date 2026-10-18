import type { SupportedLocale } from "@/i18n/locales";
import type { FactEntry } from "@/lib/explained/facts";
import { formatUtcClock } from "@/lib/explained/format";
import { kt } from "../i18n";

/**
 * "Since when?" (EXPLAINED.md §3): when a value was read or written, as
 * text. A fact read by this page says "read 09:40 UTC"; a file that states
 * its own time says "written 00:49 UTC".
 */
export default function AsOf({
  fact,
  locale,
  prefer = "written",
}: {
  readonly fact: FactEntry;
  readonly locale: SupportedLocale;
  /** Which time to show when the source states both. */
  readonly prefer?: "read" | "written";
}) {
  const { readAt, writtenAt } = fact.source;
  const useWritten =
    writtenAt !== undefined && (prefer === "written" || readAt === undefined);
  const at = useWritten ? writtenAt : readAt;
  if (at === undefined) {
    return null;
  }
  return (
    <span
      className="tw-whitespace-nowrap tw-text-[13px] tw-font-medium tw-leading-5 tw-text-iron-400"
      data-asof={useWritten ? "written" : "read"}
    >
      {kt(
        locale,
        useWritten ? "explained.kit.asOf.written" : "explained.kit.asOf.read",
        {
          time: formatUtcClock(locale, at),
        }
      )}
    </span>
  );
}
