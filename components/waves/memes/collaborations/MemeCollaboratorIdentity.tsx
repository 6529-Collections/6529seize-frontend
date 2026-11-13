"use client";

import Link from "next/link";
import { useId } from "react";
import { useQuery } from "@tanstack/react-query";
import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import ProfileNameWithAiMarker from "@/components/common/profile/ProfileNameWithAiMarker";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { DropAuthorBadges } from "@/components/waves/drops/DropAuthorBadges";
import type { ApiMemeCollaboratorProfile } from "@/generated/models/ApiMemeCollaboratorProfile";
import { getIdentityQueryOptions } from "@/services/api/identity-query";

export function MemeCollaboratorIdentity({
  collaborator,
  size,
}: {
  readonly collaborator: ApiMemeCollaboratorProfile;
  readonly size: "default" | "compact";
}) {
  const tooltipId = useId();
  // Share the normal profile query cache across cards and details.
  // The accepted-credit payload remains visible while enrichment loads or fails.
  const { data: identity } = useQuery({
    ...getIdentityQueryOptions({ handleOrWallet: collaborator.id }),
    staleTime: 60_000,
    retry: false,
  });
  const profile = identity?.id === collaborator.id ? identity : null;
  let handle = collaborator.handle.length
    ? collaborator.handle
    : collaborator.id;
  const liveHandle = profile?.handle;
  if (typeof liveHandle === "string" && liveHandle.length > 0)
    handle = liveHandle;
  const compact = size === "compact";
  return (
    <div className="tw-flex tw-min-w-0 tw-max-w-full tw-flex-wrap tw-items-center tw-gap-2">
      <Link
        href={`/${encodeURIComponent(handle)}`}
        onClick={(event) => event.stopPropagation()}
        className="tw-flex tw-min-w-0 tw-max-w-full tw-items-center tw-gap-2.5 tw-rounded-lg tw-text-iron-50 tw-no-underline hover:tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        <ProfileAvatar
          pfpUrl={profile?.pfp ?? collaborator.pfp}
          size={compact ? ProfileBadgeSize.SMALL : ProfileBadgeSize.MEDIUM}
          alt=""
        />
        <UserProfileTooltipWrapper user={handle}>
          <span
            className={`tw-min-w-0 tw-break-all tw-font-semibold ${compact ? "tw-text-sm" : "tw-text-md"}`}
          >
            {profile ? (
              <ProfileNameWithAiMarker classification={profile.classification}>
                {handle}
              </ProfileNameWithAiMarker>
            ) : (
              handle
            )}
          </span>
        </UserProfileTooltipWrapper>
      </Link>
      {profile && (
        <>
          <UserCICAndLevel
            level={profile.level}
            size={UserCICAndLevelSize.SMALL}
          />
          <DropAuthorBadges
            profile={profile}
            size={size}
            tooltipIdPrefix={`collaborator-${tooltipId}`}
          />
        </>
      )}
    </div>
  );
}
