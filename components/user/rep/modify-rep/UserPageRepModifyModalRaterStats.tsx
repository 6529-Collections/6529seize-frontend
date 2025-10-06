"use client";

import { useContext, useEffect, useState } from "react";
import { RatingStats } from "@/entities/IProfile";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { AuthContext } from "@/components/auth/Auth";
import Link from "next/link";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";

export default function UserPageRepModifyModalRaterStats({
  repState,
  minMaxValues,
  heroAvailableCredit,
}: {
  readonly repState: RatingStats;
  readonly minMaxValues: {
    readonly min: number;
    readonly max: number;
  };
  readonly heroAvailableCredit: number;
}) {
  const { activeProfileProxy } = useContext(AuthContext);
  const getProxyAvailableCredit = (): number | null => {
    const repProxy = activeProfileProxy?.actions.find(
      (action) => action.action_type === ApiProfileProxyActionType.AllocateRep
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
    <div className="tw-mt-6 sm:tw-mt-8">
      <div className="tw-flex tw-flex-col tw-space-y-1">
        {!!activeProfileProxy && (
          <span className="tw-text-base tw-block tw-text-iron-300 tw-font-normal">
            <span>You are acting as proxy for:</span>
            <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
              <Link href={`/${activeProfileProxy.created_by.handle}`}>
                {activeProfileProxy.created_by.handle}
              </Link>
            </span>
          </span>
        )}
        <span className="tw-text-sm tw-block tw-text-iron-300 tw-font-normal">
          <span>Your available Rep:</span>
          <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
            {formatNumberWithCommas(availableCredit)}
          </span>
        </span>
        {activeProfileProxy ? (
          <>
            <span className="tw-text-sm tw-block tw-text-iron-300 tw-font-normal">
              <span>Your max Rep Rating to {repState.category}:</span>
              <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
                {formatNumberWithCommas(minMaxValues.max)}
              </span>
            </span>
            <span className="tw-text-sm tw-block tw-text-iron-300 tw-font-normal">
              <span>Your min Rep Rating to {repState.category}:</span>
              <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
                {formatNumberWithCommas(minMaxValues.min)}
              </span>
            </span>
          </>
        ) : (
          <span className="tw-text-sm tw-block tw-text-iron-300 tw-font-normal">
            <span>Your max/min Rep Rating to {repState.category}:</span>
            <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
              +/- {formatNumberWithCommas(minMaxValues.max)}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
