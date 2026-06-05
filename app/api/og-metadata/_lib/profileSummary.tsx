import type { ApiOgMetadataProfile } from "@/generated/models/ApiOgMetadataProfile";
import {
  getUsableText,
  shortenAddress,
} from "@/app/api/og-metadata/_lib/imageUtils";
import {
  ArtistActivityBadge,
  CicBadge,
  getActivityBadgeType,
  LevelBadge,
} from "@/app/api/og-metadata/_lib/profileBadges";

type ProfileWithOptionalBadges = ApiOgMetadataProfile & {
  readonly has_active_submissions?: boolean | null;
  readonly has_winning_submissions?: boolean | null;
};

export const getProfileDisplayName = (
  profile: ApiOgMetadataProfile | undefined,
  fallback = "6529"
): string => {
  const handle = getUsableText(profile?.handle);
  if (handle) {
    return handle.replace(/^@/, "");
  }

  const primaryAddress = getUsableText(profile?.primary_address);
  if (primaryAddress) {
    return shortenAddress(primaryAddress);
  }

  return fallback;
};

export const ProfileAvatar = ({
  avatarUrl,
  size,
  innerSize,
  borderRadius,
  innerBorderRadius,
}: {
  readonly avatarUrl: string | null;
  readonly size: number;
  readonly innerSize: number;
  readonly borderRadius: number;
  readonly innerBorderRadius: number;
}) => {
  if (!avatarUrl) {
    return null;
  }

  return (
    <div
      style={{
        alignItems: "center",
        background: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.16)",
        borderRadius,
        display: "flex",
        height: size,
        justifyContent: "center",
        overflow: "hidden",
        padding: 3,
        width: size,
      }}
    >
      <img
        alt=""
        height={innerSize}
        src={avatarUrl}
        style={{
          borderRadius: innerBorderRadius,
          height: innerSize,
          objectFit: "cover",
          width: innerSize,
        }}
        width={innerSize}
      />
    </div>
  );
};

export const ProfileBadgeRow = ({
  profile,
  badgeSize,
  cicFontSize,
  glassesSize,
  levelFontSize,
  activityBorderRadius,
  activityIconSize,
  gap = 10,
}: {
  readonly profile: ApiOgMetadataProfile | undefined;
  readonly badgeSize: number;
  readonly cicFontSize: number;
  readonly glassesSize: number;
  readonly levelFontSize: number;
  readonly activityBorderRadius: number;
  readonly activityIconSize: number;
  readonly gap?: number;
}) => {
  const profileWithBadges = profile as ProfileWithOptionalBadges | undefined;
  const activityBadgeType = getActivityBadgeType(profileWithBadges);

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        gap,
      }}
    >
      <CicBadge
        cic={profile?.cic ?? 0}
        fontSize={cicFontSize}
        glassesSize={glassesSize}
        size={badgeSize}
      />
      {profile?.level !== null && profile?.level !== undefined ? (
        <LevelBadge
          fontSize={levelFontSize}
          level={profile.level}
          size={badgeSize}
        />
      ) : null}
      {activityBadgeType ? (
        <ArtistActivityBadge
          borderRadius={activityBorderRadius}
          iconSize={activityIconSize}
          size={badgeSize}
          type={activityBadgeType}
        />
      ) : null}
    </div>
  );
};
