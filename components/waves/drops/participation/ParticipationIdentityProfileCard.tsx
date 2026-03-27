import DropPfp from "@/components/drops/create/utils/DropPfp";
import { DropAuthorBadges } from "@/components/waves/drops/DropAuthorBadges";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { formatStatFloor } from "@/helpers/Helpers";
import Link from "next/link";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";

interface ParticipationIdentityProfileCardProps {
  readonly profile: ApiProfileMin;
  readonly contextId?: string | number | undefined;
}

interface IdentityStatLinkProps {
  readonly href: string;
  readonly label: string;
  readonly value: number;
  readonly rate?: number | undefined;
}

function IdentityStatLink({ href, label, value, rate }: IdentityStatLinkProps) {
  return (
    <Link
      href={href}
      prefetch={false}
      onClick={(event) => event.stopPropagation()}
      className="tw-no-underline tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-underline"
    >
      <span className="tw-text-sm tw-font-semibold tw-text-iron-200">
        {formatStatFloor(value)}
      </span>{" "}
      <span className="tw-text-sm tw-font-medium tw-text-iron-500">
        {label}
      </span>
      {typeof rate === "number" && rate > 0 && (
        <>
          {" "}
          <span className="tw-text-xs tw-font-semibold tw-text-emerald-500">
            +{formatStatFloor(rate)}
          </span>
        </>
      )}
    </Link>
  );
}

export default function ParticipationIdentityProfileCard({
  profile,
  contextId,
}: ParticipationIdentityProfileCardProps) {
  const profileLabel = profile.handle ?? profile.primary_address;
  const routeIdentity = encodeURIComponent(profileLabel.toLowerCase());
  const rootHref = `/${routeIdentity}`;
  const shouldShowAddress =
    !!profile.handle &&
    profile.primary_address.toLowerCase() !== profile.handle.toLowerCase();

  return (
    <div className="tw-rounded-xl tw-border tw-border-iron-800/60 tw-bg-iron-900/50 tw-p-4">
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
        <div className="tw-flex tw-min-w-0 tw-gap-3">
          <Link
            href={rootHref}
            prefetch={false}
            onClick={(event) => event.stopPropagation()}
            className="tw-flex-shrink-0 tw-no-underline"
            aria-label={`View ${profileLabel}'s profile`}
          >
            <DropPfp pfpUrl={profile.pfp} />
          </Link>

          <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-y-1.5">
            <span className="tw-text-[11px] tw-font-medium tw-uppercase tw-tracking-[0.14em] tw-text-iron-500">
              Identity
            </span>

            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
              <Link
                href={rootHref}
                prefetch={false}
                onClick={(event) => event.stopPropagation()}
                className="tw-max-w-full tw-text-base tw-font-bold tw-leading-none tw-text-iron-50 tw-no-underline desktop-hover:hover:tw-text-iron-300"
              >
                <span className="tw-block tw-truncate">{profileLabel}</span>
              </Link>

              <UserCICAndLevel
                level={profile.level}
                size={UserCICAndLevelSize.SMALL}
              />

              <DropAuthorBadges
                profile={profile}
                tooltipIdPrefix={`identity-profile-card-${contextId ?? profile.id}`}
              />
            </div>

            {shouldShowAddress && (
              <p className="tw-mb-0 tw-break-all tw-text-xs tw-text-iron-400">
                {profile.primary_address}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="tw-mt-4 tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-1.5">
        <IdentityStatLink
          href={`${rootHref}/collected`}
          label="TDH"
          value={profile.tdh}
          rate={profile.tdh_rate}
        />
        <IdentityStatLink
          href={`${rootHref}/xtdh`}
          label="xTDH"
          value={profile.xtdh}
          rate={profile.xtdh_rate}
        />
        <IdentityStatLink href={rootHref} label="NIC" value={profile.cic} />
        <IdentityStatLink href={rootHref} label="Rep" value={profile.rep} />
      </div>
    </div>
  );
}
