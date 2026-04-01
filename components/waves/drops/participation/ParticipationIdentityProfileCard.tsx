import DropPfp from "@/components/drops/create/utils/DropPfp";
import { DropAuthorBadges } from "@/components/waves/drops/DropAuthorBadges";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { formatStatFloor } from "@/helpers/Helpers";
import { shortenAddress } from "@/helpers/address.helpers";
import { ProfileBadgeSize } from "@/components/common/profile/ProfileAvatar";
import Link from "next/link";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";

export type ParticipationIdentityProfileCardVariant = "default" | "chat";

interface ParticipationIdentityProfileCardProps {
  readonly profile: ApiProfileMin;
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
    ? "tw-text-[13px] tw-font-semibold tw-leading-none tw-text-iron-200"
    : "tw-text-sm tw-font-semibold tw-text-iron-200";
  const labelClass = compact
    ? "tw-text-[13px] tw-font-medium tw-leading-none tw-tracking-wide tw-text-iron-500 tw-uppercase"
    : "tw-text-sm tw-font-medium tw-tracking-wide tw-text-iron-500 tw-uppercase";
  const rateClass = compact
    ? "tw-text-[13px] tw-font-semibold tw-leading-none tw-text-emerald-500"
    : "tw-text-xs tw-font-semibold tw-leading-4 tw-text-emerald-500";

  return (
    <Link
      href={href}
      prefetch={false}
      onClick={(event) => event.stopPropagation()}
      className="tw-no-underline tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-underline"
    >
      <span className={valueClass}>{formatStatFloor(value)}</span>{" "}
      <span className={labelClass}>{label}</span>
      {typeof rate === "number" && rate > 0 && (
        <>
          {" "}
          <span className={rateClass}>+{formatStatFloor(rate)}</span>
        </>
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
  const containerClassName = isChat
    ? "tw-mt-4 tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800/80 tw-bg-iron-900/60 tw-px-3 tw-py-2.5"
    : "tw-mt-3 tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800/80 tw-bg-iron-900/60 tw-p-4";
  const headerGapClassName = isChat ? "tw-gap-2.5" : "tw-gap-3";
  const metaGapClassName = isChat ? "tw-gap-y-0.5" : "tw-gap-y-1";
  const nameClassName = "tw-text-sm tw-font-semibold tw-leading-none";
  const levelSize = isChat
    ? UserCICAndLevelSize.COMPACT
    : UserCICAndLevelSize.SMALL;
  const badgeContainerClassName = isChat
    ? "tw-inline-flex tw-items-center tw-gap-x-1"
    : undefined;
  const statsClassName = isChat
    ? "tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-1.5 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-pt-1.5"
    : "tw-mt-4 tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-1.5 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-pt-2";

  return (
    <div className={containerClassName}>
      <div
        aria-hidden="true"
        className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-0 tw-w-[6px] tw-bg-primary-400/10 tw-blur-[4px]"
      />
      <div
        aria-hidden="true"
        className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-0 tw-w-[2px] tw-bg-primary-400/75"
      />

      <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
        <div className={`tw-flex tw-min-w-0 ${headerGapClassName}`}>
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

          <div className={`tw-flex tw-min-w-0 tw-flex-col ${metaGapClassName}`}>
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
              <Link
                href={rootHref}
                prefetch={false}
                onClick={(event) => event.stopPropagation()}
                className="tw-mb-0 tw-text-iron-200 tw-no-underline tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-opacity-80 desktop-hover:hover:tw-underline"
              >
                <span className={nameClassName}>{profileLabel}</span>
              </Link>

              <UserCICAndLevel level={profile.level} size={levelSize} />

              <DropAuthorBadges
                profile={profile}
                tooltipIdPrefix={`identity-profile-card-${contextId ?? profile.id}`}
                className={badgeContainerClassName}
                size={isChat ? "compact" : "default"}
              />
            </div>

            {displayAddress && (
              <p
                title={profile.primary_address}
                className="tw-mb-0 tw-text-xs tw-text-white/40"
              >
                {displayAddress}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={statsClassName}>
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
