import DropPfp from "@/components/drops/create/utils/DropPfp";
import { DropAuthorBadges } from "@/components/waves/drops/DropAuthorBadges";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { ApiProfileRepCategorySummary } from "@/generated/models/ApiProfileRepCategorySummary";
import { formatStatFloor } from "@/helpers/Helpers";
import { shortenAddress } from "@/helpers/address.helpers";
import { ProfileBadgeSize } from "@/components/common/profile/ProfileAvatar";
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
}

interface IdentityStatLinkProps {
  readonly href: string;
  readonly label: string;
  readonly value: number;
  readonly rate?: number | undefined;
  readonly compact?: boolean | undefined;
}

function IdentityStatLink({
  href,
  label,
  value,
  rate,
  compact = false,
}: IdentityStatLinkProps) {
  const valueClass = compact
    ? "tw-text-xs tw-font-semibold tw-leading-none tw-text-iron-100"
    : "tw-text-sm tw-font-semibold tw-leading-none tw-text-iron-100";
  const labelClass =
    "tw-text-xs tw-font-medium tw-leading-none tw-tracking-wide tw-text-iron-500 tw-uppercase";
  const rateClass =
    "tw-ml-0.5 tw-text-xs tw-font-medium tw-leading-none tw-text-emerald-400";

  return (
    <Link
      href={href}
      prefetch={false}
      onClick={(event) => event.stopPropagation()}
      className="tw-inline-flex tw-items-baseline tw-gap-1.5 tw-no-underline tw-transition-colors tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-white"
    >
      <span className={valueClass}>{formatStatFloor(value)}</span>
      <span className={labelClass}>{label}</span>
      {typeof rate === "number" && rate > 0 && (
        <span className={rateClass}>+{formatStatFloor(rate)}</span>
      )}
    </Link>
  );
}

export default function ParticipationIdentityProfileCard({
  profile,
  contextId,
  variant = "default",
}: ParticipationIdentityProfileCardProps) {
  const isChat = variant === "chat";
  const profileLabel = profile.handle ?? profile.primary_address;
  const routeIdentity = encodeURIComponent(profileLabel.toLowerCase());
  const rootHref = `/${routeIdentity}`;
  const shouldShowAddress =
    !!profile.handle &&
    profile.primary_address.toLowerCase() !== profile.handle.toLowerCase();
  const displayAddress = shouldShowAddress
    ? shortenAddress(profile.primary_address)
    : null;

  return (
    <div
      className={`tw-group tw-relative tw-overflow-hidden tw-rounded-2xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950 tw-shadow-2xl tw-shadow-black/40 tw-transition-all tw-duration-300 tw-ease-out desktop-hover:hover:tw-border-white/10 desktop-hover:hover:tw-bg-iron-900 ${
        isChat ? "tw-mt-4 tw-px-3 tw-py-3" : "tw-mt-3 tw-p-4"
      }`}
    >
      <div className="tw-absolute tw-left-0 tw-right-0 tw-top-0 tw-h-px tw-bg-gradient-to-r tw-from-transparent tw-via-white/15 tw-to-transparent tw-opacity-0 tw-transition-opacity tw-duration-500 group-hover:desktop-hover:tw-opacity-100" />
      <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-gradient-to-b tw-from-white/5 tw-to-transparent" />

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
            className="tw-flex-shrink-0 tw-no-underline"
            aria-label={`View ${profileLabel}'s profile`}
          >
            <DropPfp
              pfpUrl={profile.pfp}
              profileSize={
                isChat ? ProfileBadgeSize.COMPACT : ProfileBadgeSize.MEDIUM
              }
            />
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

      <div className={isChat ? "tw-mt-3" : "tw-mt-4"}>
        <IdentityProfileSupplement
          profile={profile}
          variant={isChat ? "chat" : "default"}
        />
      </div>

      <div
        className={`tw-flex tw-flex-wrap tw-items-center tw-gap-y-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 ${
          isChat ? "tw-mt-3 tw-gap-x-4 tw-pt-2.5" : "tw-mt-4 tw-gap-x-5 tw-pt-3"
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
  );
}
