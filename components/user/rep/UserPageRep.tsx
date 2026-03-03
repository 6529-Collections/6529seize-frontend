"use client";

import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiRepOverview } from "@/generated/models/ApiRepOverview";
import type { ApiRepCategoriesPage } from "@/generated/models/ApiRepCategoriesPage";
import type { ApiCicOverview } from "@/generated/models/ApiCicOverview";
import { commonApiFetch } from "@/services/api/common-api";
import { RateMatter } from "@/types/enums";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";
import UserPageIdentityHeader from "../identity/header/UserPageIdentityHeader";
import UserPageIdentityHeaderCICRate from "../identity/header/cic-rate/UserPageIdentityHeaderCICRate";
import UserPageIdentityStatements from "../identity/statements/UserPageIdentityStatements";
import UserPageRateWrapper from "../utils/rate/UserPageRateWrapper";

import UserPageCombinedActivityLog from "./UserPageCombinedActivityLog";
import type { RepDirection } from "./UserPageRep.helpers";
import UserPageRepHeader from "./header/UserPageRepHeader";
import UserPageRepMobile from "./UserPageRepMobile";

export default function UserPageRep({
  profile,
  initialActivityLogParams,
}: {
  readonly profile: ApiIdentity;
  readonly initialActivityLogParams: ActivityLogParams;
}) {
  const params = useParams();
  const user = (params?.["user"] as string)?.toLowerCase();

  const [repDirection, setRepDirection] = useState<RepDirection>("received");

  // --- Incoming (received) rep ---
  const { data: repOverview, isFetching: isFetchingOverview } =
    useQuery<ApiRepOverview>({
      queryKey: [
        QueryKey.REP_OVERVIEW,
        { handleOrWallet: user, direction: "incoming" },
      ],
      queryFn: async () =>
        await commonApiFetch<ApiRepOverview>({
          endpoint: `profiles/${user}/rep/overview`,
        }),
      enabled: !!user,
    });

  const { data: repCategories, isFetching: isFetchingCategories } =
    useQuery<ApiRepCategoriesPage>({
      queryKey: [
        QueryKey.REP_CATEGORIES,
        { handleOrWallet: user, direction: "incoming" },
      ],
      queryFn: async () =>
        await commonApiFetch<ApiRepCategoriesPage>({
          endpoint: `profiles/${user}/rep/categories`,
          params: {
            page: "1",
            page_size: "20",
            top_contributors_limit: "5",
          },
        }),
      enabled: !!user,
    });

  // --- Outgoing (given) rep --- only fetch when active
  const { data: repOverviewGiven, isFetching: isFetchingOverviewGiven } =
    useQuery<ApiRepOverview>({
      queryKey: [
        QueryKey.REP_OVERVIEW,
        { handleOrWallet: user, direction: "outgoing" },
      ],
      queryFn: async () =>
        await commonApiFetch<ApiRepOverview>({
          endpoint: `profiles/${user}/rep/overview`,
          params: { direction: "outgoing" },
        }),
      enabled: !!user && repDirection === "given",
    });

  const { data: repCategoriesGiven, isFetching: isFetchingCategoriesGiven } =
    useQuery<ApiRepCategoriesPage>({
      queryKey: [
        QueryKey.REP_CATEGORIES,
        { handleOrWallet: user, direction: "outgoing" },
      ],
      queryFn: async () =>
        await commonApiFetch<ApiRepCategoriesPage>({
          endpoint: `profiles/${user}/rep/categories`,
          params: {
            direction: "outgoing",
            page: "1",
            page_size: "20",
            top_contributors_limit: "5",
          },
        }),
      enabled: !!user && repDirection === "given",
    });

  // --- CIC overview ---
  const { data: cicOverview } = useQuery<ApiCicOverview>({
    queryKey: [QueryKey.CIC_OVERVIEW, { handleOrWallet: user }],
    queryFn: async () =>
      await commonApiFetch<ApiCicOverview>({
        endpoint: `profiles/${user}/cic/overview`,
      }),
    enabled: !!user,
  });

  // Pick active direction's data
  const activeOverview =
    repDirection === "received"
      ? (repOverview ?? null)
      : (repOverviewGiven ?? null);
  const activeCategories =
    repDirection === "received"
      ? (repCategories?.data ?? [])
      : (repCategoriesGiven?.data ?? []);
  const activeLoading =
    repDirection === "received"
      ? isFetchingOverview || isFetchingCategories
      : isFetchingOverviewGiven || isFetchingCategoriesGiven;

  return (
    <div className="tailwind-scope">
      <div className="lg:tw-hidden">
        <UserPageRepMobile
          profile={profile}
          overview={activeOverview}
          categories={activeCategories}
          cicOverview={cicOverview ?? null}
          repDirection={repDirection}
          onRepDirectionChange={setRepDirection}
          initialActivityLogParams={initialActivityLogParams}
          loading={activeLoading}
        />
      </div>
      <div className="tw-hidden lg:tw-block">
        <div className="tw-grid tw-grid-cols-1 tw-gap-x-8 lg:tw-grid-cols-[minmax(0,2fr)_minmax(22rem,1fr)] xl:tw-gap-x-10">
          <div className="tw-min-w-0">
            <UserPageRepHeader
              overview={activeOverview}
              categories={activeCategories}
              profile={profile}
              repDirection={repDirection}
              onRepDirectionChange={setRepDirection}
              loading={activeLoading}
            />
            <div className="tw-mt-6 lg:tw-mt-8">
              <UserPageCombinedActivityLog
                initialActivityLogParams={initialActivityLogParams}
              />
            </div>
          </div>

          <div className="tw-min-w-0 tw-self-start">
            <div className="tw-relative tw-overflow-hidden tw-rounded-2xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-[#08090b]">
              <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-gradient-to-br tw-from-emerald-500/[0.05] tw-via-transparent tw-to-transparent" />
              <div className="tw-absolute tw-left-0 tw-right-0 tw-top-0 tw-h-px tw-bg-gradient-to-r tw-from-transparent tw-via-emerald-400/25 tw-to-transparent" />
              <div className="tw-absolute tw-bottom-0 tw-left-0 tw-right-0 tw-h-px tw-bg-gradient-to-r tw-from-transparent tw-via-emerald-400/40 tw-to-transparent" />
              <div className="tw-absolute tw-bottom-0 tw-left-0 tw-top-0 tw-w-px tw-bg-gradient-to-b tw-from-transparent tw-via-emerald-400/20 tw-to-transparent" />
              <div className="tw-absolute tw-bottom-0 tw-right-0 tw-top-0 tw-w-px tw-bg-gradient-to-b tw-from-transparent tw-via-emerald-400/20 tw-to-transparent" />
              <div className="tw-relative tw-z-10">
                <UserPageIdentityHeader
                  profile={profile}
                  cicOverview={cicOverview ?? null}
                />
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
      </div>
    </div>
  );
}
