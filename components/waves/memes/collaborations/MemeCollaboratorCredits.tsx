"use client";

import Link from "next/link";
import type { ApiMemeCollaboratorProfile } from "@/generated/models/ApiMemeCollaboratorProfile";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export function MemeCollaboratorCredits({
  collaborators,
}: {
  readonly collaborators?: ApiMemeCollaboratorProfile[] | undefined;
}) {
  const locale = useBrowserLocale();
  if (!collaborators?.length) return null;
  return (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-text-sm">
      <span className="tw-text-iron-300">
        {t(locale, "memes.collaborations.title")}:
      </span>
      {collaborators.map((profile) => (
        <Link
          key={profile.id}
          href={`/${encodeURIComponent(profile.handle || profile.id)}`}
          onClick={(event) => event.stopPropagation()}
          className="tw-rounded tw-font-medium tw-text-primary-300 tw-no-underline hover:tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          @{profile.handle || profile.id}
        </Link>
      ))}
    </div>
  );
}
