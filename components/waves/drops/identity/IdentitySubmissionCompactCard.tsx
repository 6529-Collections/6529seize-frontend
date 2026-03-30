import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { DropAuthorBadges } from "@/components/waves/drops/DropAuthorBadges";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { formatStatFloor } from "@/helpers/Helpers";
import Link from "next/link";

import {
  getIdentityCardGradientStyle,
  getIdentityDisplayLabel,
  getIdentityHref,
} from "./identitySubmissionCard.helpers";

interface IdentitySubmissionCompactCardProps {
  readonly profile: ApiProfileMin | null;
  readonly fallbackValue: string | null;
  readonly contextId?: string | number | undefined;
  readonly testId: string;
  readonly className?: string | undefined;
}

function IdentityCompactStatPill({
  label,
  value,
}: {
  readonly label: string;
  readonly value: number;
}) {
  return (
    <div className="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-white/10 tw-bg-white/[0.04] tw-px-2.5 tw-py-1">
      <span className="tw-text-xs tw-font-semibold tw-text-iron-100">
        {formatStatFloor(value)}
      </span>
      <span className="tw-text-[11px] tw-font-medium tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
        {label}
      </span>
    </div>
  );
}

export function IdentitySubmissionCompactCard({
  profile,
  fallbackValue,
  contextId,
  testId,
  className,
}: IdentitySubmissionCompactCardProps) {
  const displayLabel = getIdentityDisplayLabel({ profile, fallbackValue });

  if (!displayLabel) {
    return null;
  }

  const rootHref = profile ? getIdentityHref(displayLabel) : null;
  const avatarAlt = `${displayLabel} avatar`;
  const avatarFallback = (
    <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-100">
      {displayLabel.slice(0, 1)}
    </span>
  );

  const summaryContent = rootHref ? (
    <UserProfileTooltipWrapper user={displayLabel}>
      <Link
        href={rootHref}
        prefetch={false}
        onClick={(event) => event.stopPropagation()}
        aria-label={`View ${displayLabel}'s profile`}
        className="tw-flex tw-min-w-0 tw-items-center tw-gap-3 tw-no-underline"
      >
        <ProfileAvatar
          pfpUrl={profile?.pfp ?? null}
          size={ProfileBadgeSize.SMALL}
          alt={avatarAlt}
          fallbackContent={avatarFallback}
        />
        <div className="tw-min-w-0 tw-flex-1">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
            <span className="tw-block tw-max-w-full tw-truncate tw-text-sm tw-font-semibold tw-leading-none tw-text-iron-50 tw-transition-colors desktop-hover:hover:tw-text-white">
              {displayLabel}
            </span>
            <UserCICAndLevel
              level={profile.level}
              size={UserCICAndLevelSize.SMALL}
            />
          </div>
        </div>
      </Link>
    </UserProfileTooltipWrapper>
  ) : (
    <p className="tw-mb-0 tw-break-all tw-text-sm tw-font-semibold tw-leading-snug tw-text-iron-50">
      {displayLabel}
    </p>
  );

  return (
    <div
      data-testid={testId}
      className={`${className ?? ""} tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-iron-800/60 tw-bg-iron-950/70 tw-p-3`}
    >
      {profile && (
        <>
          <div
            aria-hidden="true"
            className="tw-pointer-events-none tw-absolute tw-inset-0 tw-opacity-[0.14]"
            style={getIdentityCardGradientStyle(profile)}
          />
          <div
            aria-hidden="true"
            className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.05),transparent_55%)]"
          />
        </>
      )}

      <div className="tw-relative tw-flex tw-flex-col tw-gap-3">
        <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
          <div className="tw-min-w-0 tw-flex-1">
            <p className="tw-mb-2 tw-text-[10px] tw-font-medium tw-uppercase tw-tracking-[0.16em] tw-text-iron-500">
              Identity
            </p>
            {summaryContent}
          </div>

          {profile && (
            <DropAuthorBadges
              profile={profile}
              tooltipIdPrefix={`compact-identity-${contextId ?? profile.id}`}
              className="tw-inline-flex tw-items-center tw-gap-1.5 tw-pt-0.5"
            />
          )}
        </div>

        {profile && (
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
            <IdentityCompactStatPill label="Rep" value={profile.rep} />
            <IdentityCompactStatPill label="NIC" value={profile.cic} />
          </div>
        )}
      </div>
    </div>
  );
}
