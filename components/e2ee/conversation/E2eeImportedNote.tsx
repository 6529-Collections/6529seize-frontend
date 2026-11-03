"use client";

import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { E2eeImported, E2eeMember } from "@/lib/e2ee/types";
import { findMember, tCount } from "../e2eeFormat";

/**
 * The original author an imported message claims, accepted only when that
 * profile is in this chat: imports run between the old DM's members, so a
 * real author always is. The free-text handle in the payload is never shown.
 */
export function importedAuthor(
  members: readonly E2eeMember[],
  imported: E2eeImported,
  selfProfileId: string | null
): { readonly profileId: string; readonly member: E2eeMember | null } | null {
  if (imported.authorProfileId === selfProfileId) {
    return {
      profileId: imported.authorProfileId,
      member: findMember(members, selfProfileId),
    };
  }
  const member = findMember(members, imported.authorProfileId);
  return member ? { profileId: member.profileId, member } : null;
}

/** The original author's name, resolved from this chat's member list. */
export function importedAuthorName(
  locale: SupportedLocale,
  author: ReturnType<typeof importedAuthor>,
  selfProfileId: string | null
): string {
  if (!author) {
    return t(locale, "e2ee.imported.unknownAuthor");
  }
  if (author.profileId === selfProfileId) {
    return t(locale, "e2ee.you");
  }
  return author.member?.handle ?? t(locale, "e2ee.unknownMember");
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
 * Below every imported message: who moved it, then (once per group) why it
 * is unverified, media that did not come along, and the original reactions.
 */
export function E2eeImportedNote({
  imported,
  importerName,
  showDetail,
}: {
  readonly imported: E2eeImported;
  readonly importerName: string;
  /** The full explanation once per group of messages; "Moved by" stays on each. */
  readonly showDetail: boolean;
}) {
  const locale = useBrowserLocale();
  const reactions = imported.reactions
    .map(([reaction, count]) => `${reaction} ${count}`)
    .join("  ");
  return (
    <p className="tw-m-0 tw-mt-1 tw-text-xs tw-leading-5 tw-text-iron-400">
      <span className="tw-block">
        {t(locale, "e2ee.imported.movedBy", { name: importerName })}
      </span>
      {showDetail ? (
        <span className="tw-block">{t(locale, "e2ee.imported.detail")}</span>
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
