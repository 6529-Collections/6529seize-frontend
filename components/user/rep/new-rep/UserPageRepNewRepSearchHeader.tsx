import { useContext, useEffect, useState } from "react";
import {
  ApiProfileRepRatesState,
  IProfileAndConsolidations,
} from "../../../../entities/IProfile";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import { AuthContext } from "../../../auth/Auth";
import { ProfileProxyActionType } from "../../../../generated/models/ProfileProxyActionType";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../services/api/common-api";

export default function UserPageRepNewRepSearchHeader({
  repRates,
  profile,
}: {
  readonly repRates: ApiProfileRepRatesState | null;
  readonly profile: IProfileAndConsolidations;
}) {
  const { activeProfileProxy } = useContext(AuthContext);

  const { data: proxyGrantorRepRates } = useQuery<ApiProfileRepRatesState>({
    queryKey: [
      QueryKey.PROFILE_REP_RATINGS,
      {
        rater: activeProfileProxy?.created_by.handle,
        handleOrWallet: profile.profile?.handle,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<ApiProfileRepRatesState>({
        endpoint: `profiles/${profile.profile?.handle}/rep/ratings/received`,
        params: activeProfileProxy?.created_by.handle
          ? { rater: activeProfileProxy.created_by.handle }
          : {},
      }),
    enabled:
      !!activeProfileProxy?.created_by.handle && !!profile.profile?.handle,
  });

  const getActiveRepRates = (): { available: number; rated: number } => {
    const repProxy = activeProfileProxy?.actions.find(
      (a) => a.action_type === ProfileProxyActionType.AllocateRep
    );
    if (!repProxy) {
      return {
        available: repRates?.rep_rates_left_for_rater ?? 0,
        rated: repRates?.total_rep_rating_by_rater ?? 0,
      };
    }
    if (!proxyGrantorRepRates) {
      return {
        available: 0,
        rated: 0,
      };
    }
    const proxyGrantorAvailableRep =
      proxyGrantorRepRates.rep_rates_left_for_rater ?? 0;
    const proxyGrantorTotalRep =
      proxyGrantorRepRates.total_rep_rating_by_rater ?? 0;
    const repProxyAvailableRep =
      (repProxy.credit_amount ?? 0) - (repProxy.credit_spent ?? 0);
    if (repProxyAvailableRep <= 0) {
      return {
        available: 0,
        rated: proxyGrantorTotalRep,
      };
    }
    return {
      available: Math.min(repProxyAvailableRep, proxyGrantorAvailableRep),
      rated: proxyGrantorTotalRep,
    };
  };

  const [activeRepRates, setActiveRepRates] = useState<{
    available: number;
    rated: number;
  }>(getActiveRepRates());
  useEffect(
    () => setActiveRepRates(getActiveRepRates()),
    [activeProfileProxy, proxyGrantorRepRates, repRates]
  );
  return (
    <div className="tw-flex tw-flex-col tw-space-y-1">
      <span className="tw-text-base tw-block tw-text-iron-300 tw-font-normal">
        <span>Your available Rep:</span>
        <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
          {repRates ? formatNumberWithCommas(activeRepRates.available) : ""}
        </span>
      </span>
      <span className="tw-text-base tw-block tw-text-iron-300 tw-font-normal">
        <span>Your Rep assigned to {profile.profile?.handle}:</span>
        <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
          {repRates ? formatNumberWithCommas(activeRepRates.rated) : ""}
        </span>
      </span>
    </div>
  );
}
