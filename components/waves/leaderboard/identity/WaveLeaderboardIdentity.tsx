import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import { DropAuthorBadges } from "@/components/waves/drops/DropAuthorBadges";
import {
  getDropIdentityFallbackValue,
  getDropIdentityProfile,
} from "@/components/waves/drops/identityDisplay.helpers";
import ParticipationIdentityProfileCard from "@/components/waves/drops/participation/ParticipationIdentityProfileCard";
import type { ParticipationIdentityProfileCardVariant } from "@/components/waves/drops/participation/ParticipationIdentityProfileCard";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { shortenAddress } from "@/helpers/address.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import Link from "next/link";

type WaveLeaderboardIdentityVariant = "responsive" | "condensed";

interface WaveLeaderboardIdentityProps {
  readonly drop: ExtendedDrop;
  readonly variant: WaveLeaderboardIdentityVariant;
  readonly cardVariant?: ParticipationIdentityProfileCardVariant | undefined;
  readonly className?: string | undefined;
}

interface WaveLeaderboardIdentitySummaryProps {
  readonly profile: ApiProfileMin | null;
  readonly fallbackValue: string | null;
  readonly contextId?: string | number | undefined;
}

function WaveLeaderboardIdentitySummary({
  profile,
  fallbackValue,
  contextId,
}: WaveLeaderboardIdentitySummaryProps) {
  const displayLabel =
    profile?.handle ?? profile?.primary_address ?? fallbackValue;

  if (!displayLabel) {
    return null;
  }

  const rootHref = profile
    ? `/${encodeURIComponent(displayLabel.toLowerCase())}`
    : null;
  const primaryAddress = profile?.primary_address;
  const shouldShowAddress =
    !!profile?.handle &&
    !!primaryAddress &&
    primaryAddress.toLowerCase() !== profile.handle.toLowerCase();
  const displayAddress = shouldShowAddress
    ? shortenAddress(primaryAddress)
    : null;
  const avatarFallback = (
    <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-100">
      {displayLabel.slice(0, 1)}
    </span>
  );

  return (
    <div
      data-testid="wave-leaderboard-identity-summary"
      className="tw-rounded-lg tw-border tw-border-iron-800/60 tw-bg-iron-900/40 tw-p-3"
    >
      <div className="tw-flex tw-items-start tw-gap-3">
        {rootHref ? (
          <Link
            href={rootHref}
            prefetch={false}
            onClick={(event) => event.stopPropagation()}
            className="tw-flex-shrink-0 tw-no-underline"
            aria-label={`View ${displayLabel}'s profile`}
          >
            <ProfileAvatar
              pfpUrl={profile?.pfp ?? null}
              size={ProfileBadgeSize.SMALL}
              alt={`${displayLabel} avatar`}
              fallbackContent={avatarFallback}
            />
          </Link>
        ) : (
          <ProfileAvatar
            pfpUrl={null}
            size={ProfileBadgeSize.SMALL}
            alt={`${displayLabel} avatar`}
            fallbackContent={avatarFallback}
          />
        )}

        <div className="tw-min-w-0 tw-flex-1">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
            {rootHref ? (
              <Link
                href={rootHref}
                prefetch={false}
                onClick={(event) => event.stopPropagation()}
                className="tw-max-w-full tw-text-sm tw-font-semibold tw-leading-none tw-text-iron-50 tw-no-underline desktop-hover:hover:tw-text-iron-300"
              >
                <span className="tw-block tw-truncate">{displayLabel}</span>
              </Link>
            ) : (
              <span className="tw-break-all tw-text-sm tw-font-semibold tw-leading-none tw-text-iron-50">
                {displayLabel}
              </span>
            )}

            {profile && (
              <>
                <UserCICAndLevel
                  level={profile.level}
                  size={UserCICAndLevelSize.SMALL}
                />
                <DropAuthorBadges
                  profile={profile}
                  tooltipIdPrefix={`leaderboard-identity-${contextId ?? profile.id}`}
                />
              </>
            )}
          </div>

          {displayAddress && (
            <p
              title={primaryAddress}
              className="tw-mb-0 tw-mt-1 tw-font-mono tw-text-xs tw-tracking-[0.01em] tw-text-iron-400"
            >
              {displayAddress}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function WaveLeaderboardIdentity({
  drop,
  variant,
  cardVariant,
  className,
}: WaveLeaderboardIdentityProps) {
  const identityProfile = getDropIdentityProfile({
    wave: drop.wave,
    metadata: drop.metadata,
  });
  const fallbackValue = identityProfile
    ? null
    : getDropIdentityFallbackValue({
        wave: drop.wave,
        metadata: drop.metadata,
      });

  if (!identityProfile && !fallbackValue) {
    return null;
  }

  if (variant === "responsive" && identityProfile) {
    return (
      <div className={className}>
        <div
          data-testid="wave-leaderboard-identity-full"
          className="tw-hidden lg:tw-block"
        >
          <ParticipationIdentityProfileCard
            profile={identityProfile}
            contextId={drop.id}
            variant={cardVariant}
          />
        </div>
        <div className="lg:tw-hidden">
          <WaveLeaderboardIdentitySummary
            profile={identityProfile}
            fallbackValue={null}
            contextId={drop.id}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <WaveLeaderboardIdentitySummary
        profile={identityProfile}
        fallbackValue={fallbackValue}
        contextId={drop.id}
      />
    </div>
  );
}
