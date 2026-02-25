"use client";

import { AuthContext } from "@/components/auth/Auth";
import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiProfileRepRatesState } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { commonApiFetch } from "@/services/api/common-api";
import { RateMatter } from "@/types/enums";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import UserPageIdentityHeader from "../identity/header/UserPageIdentityHeader";
import UserPageIdentityHeaderCICRate from "../identity/header/cic-rate/UserPageIdentityHeaderCICRate";
import UserPageIdentityStatements from "../identity/statements/UserPageIdentityStatements";
import UserPageRateWrapper from "../utils/rate/UserPageRateWrapper";

import UserPageCombinedActivityLog from "./UserPageCombinedActivityLog";
import UserPageRepHeader from "./header/UserPageRepHeader";
import UserPageRepMobile from "./UserPageRepMobile";
export default function UserPageRep({
  profile,
  initialActivityLogParams,
}: {
  readonly profile: ApiIdentity;
  readonly initialActivityLogParams: ActivityLogParams;
}) {
  const { connectedProfile } = useContext(AuthContext);

  const params = useParams();
  const user = (params?.["user"] as string)?.toLowerCase();

  const [rater, setRater] = useState<string | undefined>(undefined);
  useEffect(
    () => setRater(connectedProfile?.handle?.toLowerCase()),
    [connectedProfile]
  );

  const { data: repRates } = useQuery<ApiProfileRepRatesState>({
    queryKey: [
      QueryKey.PROFILE_REP_RATINGS,
      { rater: rater, handleOrWallet: user },
    ],
    queryFn: async () =>
      await commonApiFetch<ApiProfileRepRatesState>({
        endpoint: `profiles/${user}/rep/ratings/received`,
        params: rater ? { rater } : {},
      }),
    enabled: !!user,
  });

  return (
    <div className="tailwind-scope">
      {/* Mobile layout (<1024px) */}
      <UserPageRepMobile
        profile={profile}
        repRates={repRates ?? null}
        initialActivityLogParams={initialActivityLogParams}
      />

      {/* Desktop layout (>=1024px) */}
      <div className="tw-hidden lg:tw-block">
        <div className="tw-grid tw-grid-cols-1 tw-gap-x-8 lg:tw-grid-cols-[minmax(0,2fr)_minmax(22rem,1fr)] xl:tw-gap-x-10">
          {/* Left Column - Rep Content */}
          <div className="tw-min-w-0">
            <UserPageRepHeader repRates={repRates ?? null} profile={profile} />
            {/* <UserPageRepReps repRates={repRates ?? null} profile={profile} /> */}
            <div className="tw-mt-6 lg:tw-mt-8">
              <UserPageCombinedActivityLog
                initialActivityLogParams={initialActivityLogParams}
              />
            </div>

            {/* Rep raters tables - commented out for now
            <div className="tw-mt-6 tw-grid tw-grid-cols-1 tw-gap-x-8 tw-gap-y-6 lg:tw-mt-8 lg:tw-gap-x-10 lg:tw-gap-y-10 xl:tw-grid-cols-2">
              <div>
                <ProfileRatersTableWrapper
                  initialParams={initialRepGivenParams}
                />
              </div>
              <div>
                <ProfileRatersTableWrapper
                  initialParams={initialRepReceivedParams}
                />
              </div>
            </div>
            */}
          </div>

          {/* Right Sidebar - Identity Card */}
          <div className="tw-min-w-0 tw-self-start">
            <div className="tw-relative tw-overflow-hidden tw-rounded-2xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-[#08090b]">
              <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-gradient-to-br tw-from-emerald-500/[0.05] tw-via-transparent tw-to-transparent" />
              <div className="tw-absolute tw-left-0 tw-right-0 tw-top-0 tw-h-px tw-bg-gradient-to-r tw-from-transparent tw-via-emerald-400/25 tw-to-transparent" />
              <div className="tw-absolute tw-bottom-0 tw-left-0 tw-right-0 tw-h-px tw-bg-gradient-to-r tw-from-transparent tw-via-emerald-400/40 tw-to-transparent" />
              <div className="tw-absolute tw-bottom-0 tw-left-0 tw-top-0 tw-w-px tw-bg-gradient-to-b tw-from-transparent tw-via-emerald-400/20 tw-to-transparent" />
              <div className="tw-absolute tw-bottom-0 tw-right-0 tw-top-0 tw-w-px tw-bg-gradient-to-b tw-from-transparent tw-via-emerald-400/20 tw-to-transparent" />
              <div className="tw-relative tw-z-10">
                <UserPageIdentityHeader profile={profile} />
                <UserPageIdentityStatements profile={profile} />
                <div className="tw-px-6 tw-pb-8">
                  <UserPageRateWrapper
                    profile={profile}
                    type={RateMatter.NIC}
                    hideOwnProfileMessage
                  >
                    <UserPageIdentityHeaderCICRate
                      profile={profile}
                      isTooltip={false}
                    />
                  </UserPageRateWrapper>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CIC raters tables - commented out for now
        <div className="tw-mt-6 tw-grid tw-grid-cols-1 tw-gap-x-8 tw-gap-y-6 lg:tw-mt-8 lg:tw-gap-x-10 lg:tw-gap-y-10 xl:tw-grid-cols-2">
          <div>
            <ProfileRatersTableWrapper initialParams={initialCICGivenParams} />
          </div>
          <div>
            <ProfileRatersTableWrapper
              initialParams={initialCICReceivedParams}
            />
          </div>
        </div>
        */}
      </div>
    </div>
  );
}
