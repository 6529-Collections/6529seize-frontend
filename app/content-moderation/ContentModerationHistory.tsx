"use client";

import type { ApiContentModerationAuditEntry } from "@/generated/models/ApiContentModerationAuditEntry";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { formatContentModerationEnum } from "@/services/content-moderation/content-moderation-formatters";
import Image from "next/image";
import Link from "next/link";
import {
  formatEvidence,
  formatTimestamp,
  getSafeAssetUrl,
} from "./content-moderation-page.helpers";

const getActorLabel = (
  entry: ApiContentModerationAuditEntry,
  locale: ReturnType<typeof useBrowserLocale>
): string => {
  if (entry.actor_handle) {
    return `@${entry.actor_handle}`;
  }
  if (entry.actor_profile_id) {
    return t(locale, "contentModeration.moderator.unknownActor");
  }
  return t(locale, "contentModeration.moderator.systemActor");
};

function ModerationHistoryActor({
  entry,
}: {
  readonly entry: ApiContentModerationAuditEntry;
}) {
  const locale = useBrowserLocale();
  const actorPfp = getSafeAssetUrl(entry.actor_pfp);
  const actorContent = (
    <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-font-semibold tw-text-iron-200">
      {actorPfp && (
        <Image
          src={actorPfp}
          alt=""
          width={18}
          height={18}
          className="tw-size-[18px] tw-rounded-full tw-object-cover"
        />
      )}
      <span>{getActorLabel(entry, locale)}</span>
    </span>
  );

  if (!entry.actor_handle) {
    return actorContent;
  }

  return (
    <Link
      href={`/${entry.actor_handle}`}
      className="tw-no-underline hover:tw-text-white"
    >
      {actorContent}
    </Link>
  );
}

export default function ContentModerationHistory({
  history,
  itemId,
}: {
  readonly history: ReadonlyArray<ApiContentModerationAuditEntry>;
  readonly itemId: string;
}) {
  const locale = useBrowserLocale();

  return (
    <details className="tw-mt-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/30 tw-p-4">
      <summary className="tw-cursor-pointer tw-text-sm tw-font-semibold tw-text-iron-300">
        {t(locale, "contentModeration.moderator.history", {
          count: formatInteger(locale, history.length),
        })}
      </summary>
      {history.length === 0 ? (
        <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-text-iron-500">
          {t(locale, "contentModeration.moderator.noHistory")}
        </p>
      ) : (
        <ol className="tw-mb-0 tw-mt-3 tw-space-y-3 tw-pl-5">
          {history.map((entry, index) => {
            const action = formatEvidence(
              entry.action ||
                t(locale, "contentModeration.moderator.stateChanged")
            );
            const timestamp = formatTimestamp(entry.created_at, locale);
            return (
              <li
                key={entry.id || `${itemId}-history-${index}`}
                className="tw-text-sm tw-text-iron-400"
              >
                <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
                  <span className="tw-font-semibold tw-text-iron-300">
                    {formatContentModerationEnum(action)}
                  </span>
                  <span aria-hidden="true">—</span>
                  <ModerationHistoryActor entry={entry} />
                  {entry.previous_state && entry.new_state && (
                    <>
                      <span aria-hidden="true">—</span>
                      <span>{`${formatContentModerationEnum(entry.previous_state)} → ${formatContentModerationEnum(entry.new_state)}`}</span>
                    </>
                  )}
                </div>
                {entry.reason && (
                  <p className="tw-mb-0 tw-mt-1 tw-text-iron-500">
                    {entry.reason}
                  </p>
                )}
                {timestamp !== null && (
                  <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-text-iron-600">
                    {timestamp}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </details>
  );
}
