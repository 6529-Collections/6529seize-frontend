"use client";

import { AuthContext } from "@/components/auth/Auth";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";
import { formatNumber } from "@/i18n/format";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";

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
  const locale = useBrowserLocale();
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
      : (proxyAvailableCredit ?? 0);
  };

  const [availableCredit, setAvailableCredit] = useState(getAvailableCredit());
  useEffect(
    () => setAvailableCredit(getAvailableCredit()),
    [heroAvailableCredit, proxyAvailableCredit]
  );

  const proxyItem = activeProfileProxy
    ? {
        label: t(locale, "user.rate.nic.proxy"),
        value: (
          <Link href={`/${activeProfileProxy.created_by.handle}`}>
            {activeProfileProxy.created_by.handle}
          </Link>
        ),
        valueColorClassName: "tw-text-primary-300",
      }
    : null;

  const creditItem = activeProfileProxy
    ? null
    : {
        label: t(locale, "user.rate.nic.available"),
        value: formatNumber(locale, availableCredit),
        valueColorClassName: "tw-text-iron-100",
      };

  const minMaxItem = activeProfileProxy
    ? null
    : {
        label: t(locale, "user.rate.nic.limits", {
          name: profile.handle ?? "",
        }),
        value: `+/- ${formatNumber(locale, minMaxValues.max)}`,
        valueColorClassName: "tw-text-iron-100",
      };

  const items = [proxyItem, creditItem, minMaxItem].filter(
    (item): item is NonNullable<typeof item> => item !== null
  );

  return (
    <div
      className={`tw-space-y-1.5 tw-leading-5 ${isTooltip ? "tw-text-xs" : "tw-text-sm"}`}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-1.5 tw-gap-y-1 tw-text-iron-400"
        >
          <span className="tw-break-words">
            {isTooltip && !item.label.endsWith(":")
              ? `${item.label}:`
              : item.label}
          </span>
          <span
            className={`tw-break-words tw-font-semibold tw-tabular-nums ${item.valueColorClassName}`}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
