"use client";

import Link from "next/link";
import { useContext, useEffect, useState } from "react";

import { AuthContext } from "@/components/auth/Auth";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";
import { formatNumberWithCommas } from "@/helpers/Helpers";

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

  const proxyItem = activeProfileProxy
    ? {
        label: "Proxy for",
        value: (
          <Link href={`/${activeProfileProxy.created_by.handle}`}>
            {activeProfileProxy.created_by.handle}
          </Link>
        ),
        valueColorClassName: "tw-text-emerald-400",
        labelBreakAll: false,
      }
    : null;

  const creditItem = activeProfileProxy
    ? null
    : {
        label: "Your available NIC:",
        value: formatNumberWithCommas(availableCredit),
        valueColorClassName: "tw-text-iron-300",
        labelBreakAll: false,
      };

  const minMaxItem = activeProfileProxy
    ? null
    : {
        label: `Your max/min NIC Rating to ${profile.handle}:`,
        value: `+/- ${formatNumberWithCommas(minMaxValues.max)}`,
        valueColorClassName: "tw-text-iron-300",
        labelBreakAll: true,
      };

  const items = [proxyItem, creditItem, minMaxItem].filter(
    (item): item is NonNullable<typeof item> => item !== null
  );

  if (isTooltip) {
    return (
      <div className="tw-text-xs tw-flex tw-flex-col tw-space-y-1.5">
        {items.map((item) => (
          <span
            key={item.label}
            className={`tw-block tw-text-iron-500 tw-font-medium${
              item.labelBreakAll ? " tw-break-all" : ""
            }`}>
            <span>
              {item.label.endsWith(":") ? item.label : `${item.label}:`}
            </span>
            <span className={`tw-ml-1 tw-font-semibold ${item.valueColorClassName}`}>
              {item.value}
            </span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="tw-rounded-lg tw-bg-white/[0.03] tw-border tw-border-solid tw-border-white/[0.06] tw-px-4 tw-py-3 tw-space-y-2.5">
      {items.map((item) => (
        <div
          key={item.label}
          className="tw-flex tw-items-center tw-justify-between">
          <span
            className="tw-text-xs tw-text-iron-500 tw-font-medium">
            {item.label}
          </span>
          <span
            className={`tw-whitespace-nowrap tw-text-xs tw-font-semibold ${item.valueColorClassName}`}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
