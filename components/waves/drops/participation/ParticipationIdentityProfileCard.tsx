"use client";

import DropPfp from "@/components/drops/create/utils/DropPfp";
import { DropAuthorBadges } from "@/components/waves/drops/DropAuthorBadges";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { ApiProfileRepCategorySummary } from "@/generated/models/ApiProfileRepCategorySummary";
import { formatStatFloor } from "@/helpers/Helpers";
import { shortenAddress } from "@/helpers/address.helpers";
import { ProfileBadgeSize } from "@/components/common/profile/ProfileAvatar";
import { useCompactMode } from "@/contexts/CompactModeContext";
import Link from "next/link";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import IdentityProfileSupplement from "@/components/waves/drops/identity/IdentityProfileSupplement";

export type ParticipationIdentityProfileCardVariant = "default" | "chat";

type ParticipationIdentityProfileCardProfile = ApiProfileMin & {
  readonly bio?: string | null | undefined;
  readonly top_rep_categories?:
    | readonly ApiProfileRepCategorySummary[]
    | null
    | undefined;
};

interface ParticipationIdentityProfileCardProps {
  readonly profile: ParticipationIdentityProfileCardProfile;
  readonly contextId?: string | number | undefined;
  readonly variant?: ParticipationIdentityProfileCardVariant | undefined;
  readonly showIdentityHeader?: boolean | undefined;
  readonly supplementFullWidth?: boolean | undefined;
}

interface IdentityStatLinkProps {
  readonly href: string;
  readonly label: string;
  readonly value: number;
  readonly rate?: number | undefined;
  readonly compact?: boolean | undefined;
}

const IDENTITY_STAT_LINK_CLASS =
  "tw-inline-flex tw-items-baseline tw-gap-1.5 tw-no-underline tw-transition-colors tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-white";
const IDENTITY_STAT_VALUE_CLASS =
  "tw-font-semibold tw-leading-none tw-text-iron-100";
const IDENTITY_STAT_LABEL_CLASS =
  "tw-text-xs tw-font-medium tw-leading-none tw-tracking-wide tw-text-iron-500 tw-uppercase";
const IDENTITY_STAT_RATE_CLASS =
  "tw-text-xs tw-font-medium tw-leading-none tw-text-emerald-400";

function IdentityStatLink({
  href,
  label,
  value,
  rate,
  compact = false,
}: IdentityStatLinkProps) {
  const valueClass = `${compact ? "tw-text-xs" : "tw-text-sm"} ${IDENTITY_STAT_VALUE_CLASS}`;

  return (
    <Link
      href={href}
      prefetch={false}
      onClick={(event) => event.stopPropagation()}
      className={IDENTITY_STAT_LINK_CLASS}
    >
      <span className={valueClass}>{formatStatFloor(value)}</span>
      <span className={IDENTITY_STAT_LABEL_CLASS}>{label}</span>
      {typeof rate === "number" && rate > 0 && (
        <span className={IDENTITY_STAT_RATE_CLASS}>
          +{formatStatFloor(rate)}
        </span>
      )}
    </Link>
  );
}

export default function ParticipationIdentityProfileCard({
  profile,
  contextId,
  variant = "default",
  showIdentityHeader = true,
  supplementFullWidth: _supplementFullWidth = false,
}: ParticipationIdentityProfileCardProps) {
  const compact = useCompactMode();
  const isChat = variant === "chat";
  const avatarSize =
    isChat && compact ? ProfileBadgeSize.COMPACT : ProfileBadgeSize.MEDIUM;
  const profileLabel = profile.handle ?? profile.primary_address;
  const routeIdentity = encodeURIComponent(profileLabel.toLowerCase());
  const rootHref = `/${routeIdentity}`;
  const shouldShowAddress =
    !!profile.handle &&
    profile.primary_address.toLowerCase() !== profile.handle.toLowerCase();
  const displayAddress = shouldShowAddress
    ? shortenAddress(profile.primary_address)
    : null;
  const hasSupplementContent =
    !!profile.bio?.trim() ||
    (profile.top_rep_categories ?? []).some(
      (category) => category.category.trim().length > 0
    );
  const shouldShowStatsDivider = showIdentityHeader || hasSupplementContent;
  const showBelowHeaderSupplement = hasSupplementContent;
  const belowHeaderSupplementClassName = (() => {
    if (!showIdentityHeader) {
      return undefined;
    }

    return isChat ? "tw-mt-3" : "tw-mt-4";
  })();

  return (
    <div className="tw-mt-3 tw-w-full tw-@container">
      <div className="tw-group tw-relative tw-flex tw-w-full tw-cursor-pointer tw-flex-col tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-[#18181b] tw-p-3 tw-shadow-2xl tw-shadow-black/40 tw-transition-all tw-duration-300 @sm:tw-p-5">
        {/* Subtle top glare for premium feel */}
        <div className="tw-group-hover:tw-opacity-100 tw-absolute tw-left-0 tw-right-0 tw-top-0 tw-h-px tw-bg-gradient-to-r tw-from-transparent tw-via-white/[0.15] tw-to-transparent tw-opacity-0 tw-transition-opacity tw-duration-500" />
        <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-gradient-to-b tw-from-white/[0.03] tw-to-transparent" />

        {showIdentityHeader && (
          <div className="tw-relative tw-z-10 tw-flex tw-items-start tw-justify-between tw-gap-3">
            <div
              className={`tw-flex tw-min-w-0 ${
                isChat ? "tw-items-center tw-gap-3" : "tw-items-start tw-gap-4"
              }`}
            >
              <Link
                href={rootHref}
                prefetch={false}
                onClick={(event) => event.stopPropagation()}
                className="tw-block tw-flex-shrink-0 tw-self-start tw-no-underline"
                aria-label={`View ${profileLabel}'s profile`}
              >
                <DropPfp pfpUrl={profile.pfp} profileSize={avatarSize} />
              </Link>

              <div
                className={`tw-flex tw-min-w-0 tw-flex-col ${
                  isChat ? "tw-justify-center tw-gap-y-1" : "tw-gap-y-1.5"
                }`}
              >
                <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
                  <Link
                    href={rootHref}
                    prefetch={false}
                    onClick={(event) => event.stopPropagation()}
                    className="tw-mb-0 tw-text-iron-200 tw-no-underline tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-opacity-80 desktop-hover:hover:tw-underline"
                  >
                    <span className="tw-text-sm tw-font-semibold tw-leading-none">
                      {profileLabel}
                    </span>
                  </Link>

                  <UserCICAndLevel
                    level={profile.level}
                    size={
                      isChat
                        ? UserCICAndLevelSize.COMPACT
                        : UserCICAndLevelSize.SMALL
                    }
                  />

                  <DropAuthorBadges
                    profile={profile}
                    tooltipIdPrefix={`identity-profile-card-${contextId ?? profile.id}`}
                    className={
                      isChat
                        ? "tw-inline-flex tw-items-center tw-gap-x-1"
                        : undefined
                    }
                    size={isChat ? "compact" : "default"}
                  />
                </div>

                {displayAddress && (
                  <p
                    title={profile.primary_address}
                    className="tw-mb-0 tw-font-mono tw-text-xs tw-tracking-tight tw-text-iron-500"
                  >
                    {displayAddress}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {showBelowHeaderSupplement && (
          <div className={belowHeaderSupplementClassName}>
            <IdentityProfileSupplement
              profile={profile}
              variant={isChat ? "chat" : "default"}
              maxRepCategories={2}
            />
          </div>
        )}

        <div
          className={`tw-flex tw-flex-wrap tw-items-center tw-gap-x-5 tw-gap-y-2 ${
            shouldShowStatsDivider
              ? "tw-mt-4 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-pt-3.5"
              : ""
          }`}
        >
          <IdentityStatLink
            href={`${rootHref}/collected`}
            label="TDH"
            value={profile.tdh}
            rate={profile.tdh_rate}
            compact={isChat}
          />
          <IdentityStatLink
            href={`${rootHref}/xtdh`}
            label="xTDH"
            value={profile.xtdh}
            rate={profile.xtdh_rate}
            compact={isChat}
          />
          <IdentityStatLink
            href={rootHref}
            label="NIC"
            value={profile.cic}
            compact={isChat}
          />
          <IdentityStatLink
            href={rootHref}
            label="Rep"
            value={profile.rep}
            compact={isChat}
          />
        </div>
      </div>
    </div>
  );
}
