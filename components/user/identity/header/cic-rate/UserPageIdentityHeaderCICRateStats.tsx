import { useContext } from "react";
import { AuthContext } from "../../../../auth/Auth";
import Link from "next/link";
import { formatNumberWithCommas } from "../../../../../helpers/Helpers";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";

export default function UserPageIdentityHeaderCICRateStats({
  isTooltip,
  profile,
  availableCIC,
  currentCIC,
}: {
  readonly isTooltip: boolean;
  readonly profile: IProfileAndConsolidations;
  readonly availableCIC: number;
  readonly currentCIC: number;
}) {
  const { activeProfileProxy } = useContext(AuthContext);

  return (
    <div
      className={`${
        isTooltip ? "tw-text-sm" : "tw-text-base"
      } tw-flex tw-flex-col tw-space-y-1`}
    >
      {!!activeProfileProxy && (
        <span className="tw-block tw-text-iron-300 tw-font-normal">
          <span>You are acting as proxy for:</span>
          <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
            <Link href={`/${activeProfileProxy.created_by.handle}`}>
              {activeProfileProxy.created_by.handle}
            </Link>
          </span>
        </span>
      )}
      <span className="tw-block tw-text-iron-300 tw-font-normal">
        <span>Your available CIC:</span>
        <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
          {formatNumberWithCommas(availableCIC)}
        </span>
      </span>
      {activeProfileProxy ? (
        <>
          <span className="tw-block tw-text-iron-300 tw-font-normal">
            <span>Your max CIC Rating to {profile.profile?.handle}:</span>
            <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
              {formatNumberWithCommas(currentCIC + availableCIC)}
            </span>
          </span>
          <span className="tw-block tw-text-iron-300 tw-font-normal">
            <span>Your min CIC Rating to {profile.profile?.handle}:</span>
            <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
              {formatNumberWithCommas(currentCIC - availableCIC)}
            </span>
          </span>
        </>
      ) : (
        <span className="tw-block tw-text-iron-300 tw-font-normal">
          <span>Your max/min CIC Rating to {profile.profile?.handle}:</span>
          <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
            +/- {formatNumberWithCommas(availableCIC + Math.abs(currentCIC))}
          </span>
        </span>
      )}
    </div>
  );
}
