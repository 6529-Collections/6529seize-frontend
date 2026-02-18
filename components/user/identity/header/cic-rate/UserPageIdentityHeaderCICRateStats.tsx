"use client";

import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/components/auth/Auth";
import Link from "next/link";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";

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

  if (isTooltip) {
    return (
      <div className="tw-text-xs tw-flex tw-flex-col tw-space-y-1.5">
        {!!activeProfileProxy && (
          <span className="tw-block tw-text-iron-400 tw-font-medium">
            <span>Proxy for:</span>
            <span className="tw-ml-1 tw-font-semibold tw-text-emerald-400">
              <Link href={`/${activeProfileProxy.created_by.handle}`}>
                {activeProfileProxy.created_by.handle}
              </Link>
            </span>
          </span>
        )}
        {!activeProfileProxy && (
          <span className="tw-block tw-text-iron-400 tw-font-medium">
            <span>Available NIC:</span>
            <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
              {formatNumberWithCommas(availableCredit)}
            </span>
          </span>
        )}
        {!activeProfileProxy && (
          <span className="tw-block tw-text-iron-400 tw-font-medium tw-break-all">
            <span>Max/min to {profile.handle}:</span>
            <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
              +/- {formatNumberWithCommas(minMaxValues.max)}
            </span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="tw-space-y-2">
      {!!activeProfileProxy && (
        <div className="tw-flex tw-items-center tw-justify-between tw-px-2 tw-py-1.5 tw-bg-black/20 tw-rounded tw-border tw-border-solid tw-border-white/5">
          <span className="tw-text-xs tw-text-iron-400 tw-font-medium">
            Proxy for
          </span>
          <span className="tw-text-xs tw-font-bold tw-text-emerald-400">
            <Link href={`/${activeProfileProxy.created_by.handle}`}>
              {activeProfileProxy.created_by.handle}
            </Link>
          </span>
        </div>
      )}
      {!activeProfileProxy && (
        <div className="tw-flex tw-items-center tw-justify-between tw-px-2 tw-py-1.5 tw-bg-black/20 tw-rounded tw-border tw-border-solid tw-border-white/5">
          <span className="tw-text-xs tw-text-iron-400 tw-font-medium">
            Available NIC
          </span>
          <span className="tw-text-xs tw-font-bold tw-text-iron-50">
            {formatNumberWithCommas(availableCredit)}
          </span>
        </div>
      )}
      {!activeProfileProxy && (
        <div className="tw-flex tw-items-center tw-justify-between tw-px-2 tw-py-1.5 tw-bg-black/20 tw-rounded tw-border tw-border-solid tw-border-white/5">
          <span className="tw-text-xs tw-text-iron-400 tw-font-medium tw-break-all">
            Max/min to {profile.handle}
          </span>
          <span className="tw-text-xs tw-font-bold tw-text-iron-50">
            +/- {formatNumberWithCommas(minMaxValues.max)}
          </span>
        </div>
      )}
    </div>
  );
}
