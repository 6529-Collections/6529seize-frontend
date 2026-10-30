"use client";

import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import ProfileNameWithAiMarker from "@/components/common/profile/ProfileNameWithAiMarker";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatNumber } from "@/i18n/format";
import { t, tRich } from "@/i18n/messages";
import { getIdentityQueryOptions } from "@/services/api/identity-query";
import { useQueries } from "@tanstack/react-query";
import Link from "next/link";

const CREDIT_LINK_CLASS =
  "tw-min-w-0 tw-rounded-sm tw-no-underline tw-transition-colors tw-duration-200 tw-ease-out focus-visible:tw-text-white focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 motion-reduce:tw-transition-none";

const CREDIT_AVATAR_CLASS =
  "tw-relative tw-block tw-size-7 tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 tw-ring-2 tw-ring-iron-950 tw-transition-[margin,transform] tw-duration-200 tw-ease-out after:tw-pointer-events-none after:tw-absolute after:tw-inset-0 after:tw-rounded-lg after:tw-shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] after:tw-content-[''] motion-safe:desktop-hover:hover:-tw-translate-y-px motion-reduce:tw-transition-none";

// Credits are optional while API environments roll out collaboration support.
export type ComingUpCreditSource = Pick<ApiDrop, "collaborators">;

const EMPTY_COLLABORATORS: NonNullable<
  ComingUpCreditSource["collaborators"]
> = [];

export function ComingUpArtistCredits({
  author,
  collaborators = EMPTY_COLLABORATORS,
  dropHref,
}: {
  readonly author: ApiDrop["author"];
  readonly dropHref: string;
} & ComingUpCreditSource) {
  const locale = useBrowserLocale();
  // Four avatars total, including the artist. Reuse the profile cache so
  // renamed collaborators keep the same live identity as their detail credits.
  const visibleCollaborators = collaborators.slice(0, 3);
  const identities = useQueries({
    queries: visibleCollaborators.map((collaborator) => ({
      ...getIdentityQueryOptions({ handleOrWallet: collaborator.id }),
      staleTime: 60_000,
      retry: false,
    })),
  });
  const credits = visibleCollaborators.map((collaborator, index) => {
    const identity = identities[index]?.data;
    const profile = identity?.id === collaborator.id ? identity : null;
    let handle =
      collaborator.handle.length > 0 ? collaborator.handle : collaborator.id;
    if (typeof profile?.handle === "string" && profile.handle.length > 0) {
      handle = profile.handle;
    }
    return {
      id: collaborator.id,
      handle,
      pfp: profile?.pfp ?? collaborator.pfp,
      classification: profile?.classification,
    };
  });
  const artistName =
    author.handle ?? t(locale, "home.comingUp.credits.anonymousArtist");
  const artistHref = `/${author.handle ?? author.primary_address}`;

  if (collaborators.length === 0) {
    return (
      <Link
        data-home-action="Open artist profile"
        href={artistHref}
        className={`tw-group/artist tw-flex tw-min-h-6 tw-items-center tw-gap-2 desktop-hover:hover:tw-text-white ${CREDIT_LINK_CLASS}`}
      >
        <ProfileAvatar
          pfpUrl={author.pfp}
          alt=""
          size={ProfileBadgeSize.SMALL}
        />
        <span className="tw-min-w-0 tw-truncate tw-text-sm tw-font-medium tw-text-iron-400 tw-transition-colors tw-duration-200 tw-ease-out group-focus-visible/artist:tw-text-white desktop-hover:group-hover/artist:tw-text-white motion-reduce:tw-transition-none">
          {artistName}
        </span>
      </Link>
    );
  }

  const extraAvatars = collaborators.length - visibleCollaborators.length;
  const extraNames = collaborators.length - 2;

  return (
    <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-3">
      <div
        aria-hidden="true"
        className="tw-group/stack tw-isolate tw-flex tw-shrink-0 tw-items-center"
      >
        <div className={`tw-z-30 ${CREDIT_AVATAR_CLASS}`}>
          <ProfileAvatar
            pfpUrl={author.pfp}
            alt=""
            size={ProfileBadgeSize.SMALL}
          />
        </div>
        {credits.map((credit, index) => (
          <div
            key={credit.id}
            className={`-tw-ml-1.5 motion-safe:desktop-hover:group-hover/stack:-tw-ml-1 ${CREDIT_AVATAR_CLASS} ${["tw-z-20", "tw-z-10", "tw-z-0"][index] ?? "tw-z-0"}`}
          >
            <ProfileAvatar
              pfpUrl={credit.pfp}
              alt=""
              size={ProfileBadgeSize.SMALL}
            />
          </div>
        ))}
        {extraAvatars > 0 && (
          <span className="tw-relative -tw-ml-1.5 tw-flex tw-size-7 tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 tw-text-[10px] tw-font-semibold tw-text-iron-300 tw-ring-2 tw-ring-iron-950">
            +{formatNumber(locale, extraAvatars)}
          </span>
        )}
      </div>
      <div className="tw-min-w-0 tw-flex-1">
        <Link
          data-home-action="Open artist profile"
          href={artistHref}
          title={artistName}
          className={`tw-block tw-truncate tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-400 desktop-hover:hover:tw-text-iron-300 ${CREDIT_LINK_CLASS}`}
        >
          {artistName}
        </Link>
        <div className="tw-flex tw-min-w-0 tw-items-baseline tw-gap-1 tw-whitespace-nowrap tw-text-xs tw-leading-4 tw-text-iron-500">
          {tRich(locale, "home.comingUp.credits.withNames", {
            names: (
              <span
                key="names"
                className="tw-flex tw-min-w-0 tw-items-baseline tw-gap-1"
              >
                {credits.slice(0, 2).map((credit, index) => (
                  <span
                    key={credit.id}
                    className="tw-flex tw-min-w-0 tw-items-baseline"
                  >
                    <Link
                      href={`/${encodeURIComponent(credit.handle)}`}
                      title={credit.handle}
                      className={`tw-truncate tw-font-medium tw-text-iron-400 desktop-hover:hover:tw-text-white ${CREDIT_LINK_CLASS}`}
                    >
                      {credit.classification !== undefined ? (
                        <ProfileNameWithAiMarker
                          classification={credit.classification}
                          className="tw-inline"
                        >
                          {credit.handle}
                        </ProfileNameWithAiMarker>
                      ) : (
                        credit.handle
                      )}
                    </Link>
                    {index === 0 && credits.length > 1 && ","}
                  </span>
                ))}
              </span>
            ),
          })}
          {extraNames > 0 && (
            <Link
              href={dropHref}
              className={`tw-shrink-0 tw-text-iron-500 desktop-hover:hover:tw-text-white ${CREDIT_LINK_CLASS}`}
            >
              {t(locale, "home.comingUp.credits.moreNames", {
                count: formatNumber(locale, extraNames),
              })}
              <span className="tw-sr-only">
                {" "}
                {t(locale, "home.comingUp.credits.viewAllCredits")}
              </span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
