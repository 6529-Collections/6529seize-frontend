import type { SupportedLocale } from "@/i18n/locales";
import { kt } from "../i18n";

/**
 * A reference page not yet translated says so, in the reader's language,
 * at its top: a reader who asked for German does not switch language
 * mid-chapter without being told. English readers see nothing.
 */
export default function EnglishOnlyNote({
  requested,
}: {
  /** The language the reader asked for (`?locale=` or their browser's). */
  readonly requested: SupportedLocale;
}) {
  if (requested.startsWith("en")) {
    return null;
  }
  return (
    <p
      lang={requested}
      className="tw-m-0 tw-mt-6 tw-rounded-lg tw-border tw-border-dashed tw-border-iron-700 tw-px-4 tw-py-3 tw-text-[15px] tw-leading-6 tw-text-iron-300"
      data-english-only=""
    >
      {kt(requested, "explained.kit.englishOnly")}
    </p>
  );
}
