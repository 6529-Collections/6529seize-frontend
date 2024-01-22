import { useRouter } from "next/router";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { ConsolidatedTDHMetrics, TDHMetrics } from "../../../entities/ITDH";
import { useEffect, useState } from "react";
import { commonApiFetch } from "../../../services/api/common-api";
import UserPageHeaderAddresses from "../user-page-header/addresses/UserPageHeaderAddresses";
import UserPageStatsTags from "./tags/UserPageStatsTags";
import UserPageStatsCollected from "./UserPageStatsCollected";
import UserPageStatsActivityOverview from "./UserPageStatsActivityOverview";
import UserPageActivityWrapper from "./activity/UserPageActivityWrapper";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import CommonSkeletonLoader from "../../utils/animation/CommonSkeletonLoader";
import CommonCardSkeleton from "../../utils/animation/CommonCardSkeleton";

export type UserPageStatsTDHType = ConsolidatedTDHMetrics | TDHMetrics | null;

export default function UserPageStats({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const router = useRouter();
  const [activeAddress, setActiveAddress] = useState<string | null>(null);
  const [isConsolidation, setIsConsolidation] = useState<boolean>(
    profile.consolidation.wallets.length > 1
  );

  useEffect(() => {
    setIsConsolidation(profile.consolidation.wallets.length > 1);
  }, [profile, router.query.user]);

  const { isFetching: isFetchingConsolidatedTDH, data: consolidatedTDH } =
    useQuery<ConsolidatedTDHMetrics>({
      queryKey: [
        QueryKey.PROFILE_CONSOLIDATED_TDH,
        profile.consolidation.consolidation_key,
      ],
      queryFn: async () =>
        await commonApiFetch<ConsolidatedTDHMetrics>({
          endpoint: `consolidated_owner_metrics/${profile.consolidation.consolidation_key}/`,
        }),
      enabled: !!profile.consolidation.consolidation_key,
    });

  const { isFetching: isFetchingWalletTDH, data: walletTDH } =
    useQuery<TDHMetrics | null>({
      queryKey: [QueryKey.WALLET_TDH, activeAddress?.toLowerCase()],
      queryFn: async () => {
        const response = await commonApiFetch<{ data: TDHMetrics[] }>({
          endpoint: `owner_metrics`,
          params: {
            wallet: activeAddress!,
            profile_page: "true",
          },
        });
        return response.data?.at(0) ?? null;
      },
      enabled: !!activeAddress,
    });

  const [tdh, setTDH] = useState<UserPageStatsTDHType>(consolidatedTDH ?? null);

  useEffect(() => {
    if (!activeAddress || !isConsolidation) {
      setTDH(consolidatedTDH ?? null);
      return;
    }

    setTDH(walletTDH ?? null);
  }, [activeAddress, isConsolidation, consolidatedTDH, walletTDH]);

  const [isLoading, setIsLoading] = useState<boolean>(
    isFetchingConsolidatedTDH || isFetchingWalletTDH
  );

  useEffect(() => {
    setIsLoading(isFetchingConsolidatedTDH || isFetchingWalletTDH);
  }, [isFetchingConsolidatedTDH, isFetchingWalletTDH]);

  return (
    <div className="tailwind-scope">
      <div className="tw-flex-col-reverse tw-flex md:tw-flex-row tw-justify-between tw-gap-6 lg:tw-space-y-0 tw-w-full tw-mt-6 lg:tw-mt-8">
        {isLoading ? (
          <div className="tw-w-full">
            <CommonSkeletonLoader />
            <CommonSkeletonLoader />
          </div>
        ) : (
          <UserPageStatsTags tdh={tdh} />
        )}

        <UserPageHeaderAddresses
          addresses={profile.consolidation.wallets}
          onActiveAddress={setActiveAddress}
        />
      </div>

      <div className="tw-w-full tw-pt-8 tw-h-92">
        <CommonCardSkeleton />
      </div>

      <UserPageStatsCollected tdh={tdh} />
      <UserPageStatsActivityOverview tdh={tdh} />
      <UserPageActivityWrapper
        profile={profile}
        activeAddress={activeAddress}
      />

      {/* 
      <UserPageDistributions
        show={true}
        activeAddress={activeAddress}
        profile={profile}
      /> */}
    </div>
  );
}
