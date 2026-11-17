import { BODY } from "@/components/validator-page/validatorStyles";
import { formatDate } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { tRich, type MessageKey } from "@/i18n/messages";
import { shortCommit } from "@/lib/validator-page/releaseFiles";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;
// The list's day, as a calendar date: the same day in every time zone.
const PUBLISHED_DATE: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

/**
 * "Release 0.1.0, published November 17, 2026, built from commit ccccccc.",
 * or the same without the commit when the list gives none.
 */
export default function ReleaseBuildLine({
  version,
  date,
  commit,
  withCommit,
  withoutCommit,
}: {
  readonly version: string;
  /** `YYYY-MM-DD`. */
  readonly date: string;
  readonly commit: string | null;
  readonly withCommit: MessageKey;
  readonly withoutCommit: MessageKey;
}) {
  const short = shortCommit(commit);
  return (
    <p className={`tw-m-0 ${BODY}`}>
      {tRich(LOCALE, short ? withCommit : withoutCommit, {
        version: (
          <span key="version" className="tw-font-mono">
            {version}
          </span>
        ),
        date: formatDate(LOCALE, date, PUBLISHED_DATE),
        commit: (
          <span key="commit" className="tw-font-mono">
            {short}
          </span>
        ),
      })}
    </p>
  );
}
