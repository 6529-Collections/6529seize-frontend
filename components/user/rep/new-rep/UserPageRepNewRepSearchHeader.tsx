"use client";

import { useContext, useEffect, useState } from "react";
import type { ApiProfileRepRatesState } from "@/entities/IProfile";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { AuthContext } from "@/components/auth/Auth";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";
import { useQuery } from "@tanstack/react-query";
import { commonApiFetch } from "@/services/api/common-api";
import Link from "next/link";
import CommonInfoBox from "@/components/utils/CommonInfoBox";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
export default function UserPageRepNewRepSearchHeader({
  repRates,
  profile,
}: {
  readonly repRates: ApiProfileRepRatesState | null;
  readonly profile: ApiIdentity;
}) {
  const { activeProfileProxy } = useContext(AuthContext);

  const { data: proxyGrantorRepRates } = useQuery<ApiProfileRepRatesState>({
    queryKey: [
      QueryKey.PROFILE_REP_RATINGS,
      {
        rater: activeProfileProxy?.created_by.handle,
        handleOrWallet: profile?.handle,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<ApiProfileRepRatesState>({
        endpoint: `profiles/${profile?.query}/rep/ratings/received`,
        params: activeProfileProxy?.created_by.handle
          ? { rater: activeProfileProxy.created_by.handle }
          : {},
      }),
    enabled: !!activeProfileProxy?.created_by.handle,
  });

  const getActiveRepRates = (): {
    available: number;
    rated: number;
    proxyCreditLeft: number | null;
  } => {
    const repProxy = activeProfileProxy?.actions.find(
      (a) => a.action_type === ApiProfileProxyActionType.AllocateRep
    );
    if (!repProxy) {
      return {
        available: repRates?.rep_rates_left_for_rater ?? 0,
        rated: repRates?.total_rep_rating_by_rater ?? 0,
        proxyCreditLeft: null,
      };
    }
    if (!proxyGrantorRepRates) {
      return {
        available: 0,
        rated: 0,
        proxyCreditLeft: null,
      };
    }
    const proxyGrantorAvailableRep =
      proxyGrantorRepRates.rep_rates_left_for_rater ?? 0;
    const proxyGrantorTotalRep =
      proxyGrantorRepRates.total_rep_rating_by_rater ?? 0;
    return {
      available: proxyGrantorAvailableRep,
      rated: proxyGrantorTotalRep,
      proxyCreditLeft: Math.max(
        0,
        (repProxy.credit_amount ?? 0) - (repProxy.credit_spent ?? 0)
      ),
    };
  };

  const [activeRepRates, setActiveRepRates] = useState<{
    available: number;
    rated: number;
    proxyCreditLeft: number | null;
  }>(getActiveRepRates());

  useEffect(
    () => setActiveRepRates(getActiveRepRates()),
    [activeProfileProxy, proxyGrantorRepRates, repRates]
  );

  const getAvailableCredit = (): number => {
    if (!activeProfileProxy) {
      return activeRepRates.available;
    }
    return Math.abs(activeRepRates.available) <
      Math.abs(activeRepRates.proxyCreditLeft ?? 0)
      ? activeRepRates.available
      : activeRepRates.proxyCreditLeft ?? 0;
  };

  const [availableCredit, setAvailableCredit] = useState(getAvailableCredit());
  useEffect(
    () => setAvailableCredit(getAvailableCredit()),
    [activeRepRates, activeRepRates.proxyCreditLeft]
  );
  return (
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
      {!!activeProfileProxy && !activeRepRates.available ? (
        <div className="tw-py-4">
          <CommonInfoBox message="You don't have any rep left to rate" />
        </div>
      ) : (
        <>
          <span className="tw-text-base tw-block tw-text-iron-300 tw-font-normal">
            <span>Your available Rep:</span>
            <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
              {formatNumberWithCommas(availableCredit)}
            </span>
          </span>
        </>
      )}
      <span className="tw-text-base tw-block tw-text-iron-300 tw-font-normal">
        <span>
          Your Rep assigned to{" "}
          {profile.query ?? profile.handle ?? profile.display}:
        </span>
        <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
          {repRates ? formatNumberWithCommas(activeRepRates.rated) : ""}
        </span>
      </span>
    </div>
  );
}
