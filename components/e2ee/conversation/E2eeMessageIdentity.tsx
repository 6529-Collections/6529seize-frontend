"use client";

import { useQuery } from "@tanstack/react-query";
import ProfileNameWithAiMarker from "@/components/common/profile/ProfileNameWithAiMarker";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import { DropAuthorBadges } from "@/components/waves/drops/DropAuthorBadges";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useWaveById } from "@/hooks/useWaveById";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import type { E2eeMember } from "@/lib/e2ee/types";
import { getE2eeProfileQueryOptions, toResolvedProfile } from "../e2eeProfiles";
import { E2eeAvatar } from "../ui/E2eeAvatar";
import { E2eeProfileLink } from "../ui/E2eeProfileLink";

interface E2eeMessageIdentityProps {
  readonly member: E2eeMember | null;
  readonly fallbackName: string;
  readonly messageId: string;
}

function useMemberProfile(member: E2eeMember | null) {
  const { data } = useQuery({
    ...getE2eeProfileQueryOptions(member?.profileId ?? ""),
    enabled: member !== null,
  });
  const profile =
    member && data?.id === member.profileId && !data.is_anonymous ? data : null;
  return {
    profile,
    displayMember:
      member && profile
        ? { ...member, ...toResolvedProfile(member.profileId, profile) }
        : member,
  };
}

export function E2eeMessageAvatar({
  member,
  fallbackName,
}: Omit<E2eeMessageIdentityProps, "messageId">) {
  const { displayMember } = useMemberProfile(member);
  return (
    <E2eeProfileLink member={displayMember} avatar className="tw-inline-flex">
      <E2eeAvatar
        pfp={displayMember?.pfp ?? null}
        name={displayMember?.handle ?? fallbackName}
        size="md"
        rounded
      />
    </E2eeProfileLink>
  );
}

/** Public profile decoration stays in the UI, outside encrypted payloads. */
export function E2eeMessageIdentity({
  member,
  fallbackName,
  messageId,
}: E2eeMessageIdentityProps) {
  const locale = useBrowserLocale();
  const { profile, displayMember } = useMemberProfile(member);
  const { wave } = useWaveById(profile?.profile_wave_id ?? null);
  const profileWave = wave?.id === profile?.profile_wave_id ? wave : null;
  const name = profile?.handle ?? member?.handle ?? fallbackName;

  return (
    <>
      <E2eeProfileLink
        member={displayMember}
        className="tw-min-w-0 tw-max-w-full tw-font-semibold tw-text-iron-200 [overflow-wrap:anywhere] desktop-hover:hover:tw-underline"
      >
        {profile ? (
          <ProfileNameWithAiMarker classification={profile.classification}>
            {name}
          </ProfileNameWithAiMarker>
        ) : (
          name
        )}
      </E2eeProfileLink>
      {profile && (
        <>
          <span
            role="img"
            aria-label={t(locale, "e2ee.profile.level", {
              level: formatInteger(locale, profile.level),
            })}
          >
            <UserCICAndLevel
              level={profile.level}
              size={UserCICAndLevelSize.SMALL}
            />
          </span>
          <DropAuthorBadges
            profile={{
              ...profile,
              profile_wave_name: profileWave?.name ?? null,
              profile_wave_pfp: profileWave?.picture ?? null,
            }}
            tooltipIdPrefix={`e2ee-author-${messageId}`}
          />
        </>
      )}
    </>
  );
}
