"use client";

import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../../auth/Auth";
import Link from "next/link";
import { formatNumberWithCommas } from "../../../../../helpers/Helpers";
import { ApiIdentity } from "../../../../../generated/models/ApiIdentity";
import { ApiProfileProxyActionType } from "../../../../../generated/models/ApiProfileProxyActionType";

export default function UserPageIdentityHeaderCICRateStats({
  isTooltip,
  profile,
  minMaxValues,
  heroAvailableCredit,
}: {
  readonly isTooltip: boolean;
  readonly profile: ApiIdentity;
  readonly minMaxValues: {
    readonly min: number;
    readonly max: number;
  };
  readonly heroAvailableCredit: number;
}) {
  const { activeProfileProxy } = useContext(AuthContext);
  const getProxyAvailableCredit = (): number | null => {
    const proxy = activeProfileProxy?.actions.find(
      (action) => action.action_type === ApiProfileProxyActionType.AllocateCic
    );
    if (!proxy) {
      return null;
    }
    return Math.max(0, (proxy.credit_amount ?? 0) - (proxy.credit_spent ?? 0));
  };
  const [proxyAvailableCredit, setProxyAvailableCredit] = useState<
    number | null
  >(getProxyAvailableCredit());

  useEffect(
    () => setProxyAvailableCredit(getProxyAvailableCredit()),
    [activeProfileProxy]
  );

  const getAvailableCredit = (): number => {
    if (!activeProfileProxy) {
      return heroAvailableCredit;
    }
    return Math.abs(heroAvailableCredit) < Math.abs(proxyAvailableCredit ?? 0)
      ? heroAvailableCredit
      : proxyAvailableCredit ?? 0;
  };

  const [availableCredit, setAvailableCredit] = useState(getAvailableCredit());
  useEffect(
    () => setAvailableCredit(getAvailableCredit()),
    [heroAvailableCredit, proxyAvailableCredit]
  );
  return (
    <div
      className={`${
        isTooltip ? "tw-text-sm" : "tw-text-base"
      } tw-flex tw-flex-col tw-space-y-1`}>
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
        <span>Your available NIC:</span>
        <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
          {formatNumberWithCommas(availableCredit)}
        </span>
      </span>
      {activeProfileProxy ? (
        <>
          <span className="tw-block tw-text-iron-300 tw-font-normal">
            <span>Your max NIC Rating to {profile.handle}:</span>
            <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
              {formatNumberWithCommas(minMaxValues.max)}
            </span>
          </span>
          <span className="tw-block tw-text-iron-300 tw-font-normal">
            <span>Your min NIC Rating to {profile.handle}:</span>
            <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
              {formatNumberWithCommas(minMaxValues.min)}
            </span>
          </span>
        </>
      ) : (
        <span className="tw-block tw-text-iron-300 tw-font-normal tw-break-all">
          <span>Your max/min NIC Rating to {profile.handle}:</span>
          <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
            +/- {formatNumberWithCommas(minMaxValues.max)}
          </span>
        </span>
      )}
    </div>
  );
}
