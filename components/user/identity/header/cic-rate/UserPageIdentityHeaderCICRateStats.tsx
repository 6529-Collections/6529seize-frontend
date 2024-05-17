import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../../auth/Auth";
import Link from "next/link";
import { formatNumberWithCommas } from "../../../../../helpers/Helpers";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import { ProfileProxyActionType } from "../../../../../generated/models/ProfileProxyActionType";

export default function UserPageIdentityHeaderCICRateStats({
  isTooltip,
  profile,
  minMaxValues,
  heroAvailableRep,
}: {
  readonly isTooltip: boolean;
  readonly profile: IProfileAndConsolidations;
  readonly minMaxValues: {
    readonly min: number;
    readonly max: number;
  };
  readonly heroAvailableRep: number;
}) {
  const { activeProfileProxy } = useContext(AuthContext);
  const getProxyAvailableCredit = (): number | null => {
    const repProxy = activeProfileProxy?.actions.find(
      (action) => action.action_type === ProfileProxyActionType.AllocateCic
    );
    if (!repProxy) {
      return null;
    }
    return Math.max(
      0,
      (repProxy.credit_amount ?? 0) - (repProxy.credit_spent ?? 0)
    );
  };
  const [proxyAvailableCredit, setProxyAvailableCredit] = useState<
    number | null
  >(getProxyAvailableCredit());

  useEffect(
    () => setProxyAvailableCredit(getProxyAvailableCredit()),
    [activeProfileProxy]
  );
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
          {formatNumberWithCommas(heroAvailableRep)}
        </span>
      </span>
      {activeProfileProxy ? (
        <>
          {typeof proxyAvailableCredit === "number" && (
            <span className="tw-block tw-text-iron-300 tw-font-normal">
              <span>Your available Credit:</span>
              <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
                {formatNumberWithCommas(proxyAvailableCredit)}
              </span>
            </span>
          )}
          <span className="tw-block tw-text-iron-300 tw-font-normal">
            <span>Your max CIC Rating to {profile.profile?.handle}:</span>
            <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
              {formatNumberWithCommas(minMaxValues.max)}
            </span>
          </span>
          <span className="tw-block tw-text-iron-300 tw-font-normal">
            <span>Your min CIC Rating to {profile.profile?.handle}:</span>
            <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
              {formatNumberWithCommas(minMaxValues.min)}
            </span>
          </span>
        </>
      ) : (
        <span className="tw-block tw-text-iron-300 tw-font-normal">
          <span>Your max/min CIC Rating to {profile.profile?.handle}:</span>
          <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
            +/- {formatNumberWithCommas(minMaxValues.max)}
          </span>
        </span>
      )}
    </div>
  );
}
