"use client";

import type { ApiMemeCollaboratorProfile } from "@/generated/models/ApiMemeCollaboratorProfile";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { MemeCollaboratorIdentity } from "./MemeCollaboratorIdentity";

export function MemeCollaboratorCredits({
  collaborators,
  size = "compact",
}: {
  readonly collaborators?: ApiMemeCollaboratorProfile[] | undefined;
  readonly size?: "default" | "compact";
}) {
  const locale = useBrowserLocale();
  if (!collaborators || collaborators.length === 0) return null;
  return (
    <div className="tailwind-scope tw-min-w-0 tw-space-y-2">
      <div className="tw-text-xs tw-font-medium tw-text-iron-400">
        {t(locale, "memes.collaborations.title")}:
      </div>
      <ul
        aria-label={t(locale, "memes.collaborations.title")}
        className={`tw-m-0 tw-flex tw-list-none tw-gap-x-5 tw-gap-y-3 tw-p-0 ${size === "default" ? "tw-flex-col tw-items-start" : "tw-flex-wrap"}`}
      >
        {collaborators.map((profile) => (
          <li key={profile.id} className="tw-min-w-0 tw-max-w-full">
            <MemeCollaboratorIdentity collaborator={profile} size={size} />
          </li>
        ))}
      </ul>
    </div>
  );
}
