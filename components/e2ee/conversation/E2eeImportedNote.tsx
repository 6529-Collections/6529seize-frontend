"use client";

import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { E2eeImported } from "@/lib/e2ee/types";
import { tCount } from "../e2eeFormat";

/** The original author as the server copy named them (D146). */
export function importedAuthorName(
  locale: SupportedLocale,
  imported: E2eeImported,
  selfProfileId: string | null
): string {
  if (imported.authorProfileId === selfProfileId) {
    return t(locale, "e2ee.you");
  }
  return imported.authorHandle ?? t(locale, "e2ee.unknownMember");
}

function ImportedBadge() {
  const locale = useBrowserLocale();
  return (
    <span className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded tw-bg-iron-800 tw-px-1.5 tw-text-xs tw-text-iron-300">
      <ArrowDownTrayIcon aria-hidden="true" className="tw-size-3" />
      {t(locale, "e2ee.imported.badge")}
    </span>
  );
}

/**
 * Below an imported message: who moved it and why it is unverified, media
 * that did not come along, and the reactions the original had.
 */
export function E2eeImportedNote({
  imported,
  importerName,
  showDetail,
}: {
  readonly imported: E2eeImported;
  readonly importerName: string;
  /** The full explanation once per group of messages; the badge stays on each. */
  readonly showDetail: boolean;
}) {
  const locale = useBrowserLocale();
  const reactions = imported.reactions
    .map(([reaction, count]) => `${reaction} ${count}`)
    .join("  ");
  if (!showDetail && imported.mediaNotImported === 0 && !reactions) {
    return null;
  }
  return (
    <p className="tw-m-0 tw-mt-1 tw-text-xs tw-leading-5 tw-text-iron-400">
      {showDetail ? (
        <span className="tw-block">
          {t(locale, "e2ee.imported.detail", { name: importerName })}
        </span>
      ) : null}
      {imported.mediaNotImported > 0 ? (
        <span className="tw-block">
          {tCount(
            locale,
            {
              one: "e2ee.imported.mediaMissing.one",
              other: "e2ee.imported.mediaMissing.other",
            },
            imported.mediaNotImported
          )}
        </span>
      ) : null}
      {reactions ? (
        <span className="tw-block">
          {t(locale, "e2ee.imported.reactions", { reactions })}
        </span>
      ) : null}
    </p>
  );
}

E2eeImportedNote.Badge = ImportedBadge;
