import { useRouter } from "next/router";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { ConsolidatedTDHMetrics, TDHMetrics } from "../../../entities/ITDH";
import { useEffect, useState } from "react";
import { commonApiFetch } from "../../../services/api/common-api";
import UserPageStatsTDHcharts from "../to-be-removed/UserPageStatsTDHcharts";
import { NFTLite } from "../../../entities/INFT";
import UserPageHeaderAddresses from "../user-page-header/addresses/UserPageHeaderAddresses";
import UserPageStatsTags from "./tags/UserPageStatsTags";
import UserPageStatsCollected from "./UserPageStatsCollected";
import UserPageStatsActivityOverview from "./UserPageStatsActivityOverview";
import UserPageActivityWrapper from "./activity/UserPageActivityWrapper";

export type UserPageStatsTDHType = ConsolidatedTDHMetrics | TDHMetrics | null;

export default function UserPageStats({
  profile,
  consolidatedTDH,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly consolidatedTDH: ConsolidatedTDHMetrics | null;
}) {
  const router = useRouter();
  const [isConsolidation, setIsConsolidation] = useState<boolean>(
    profile.consolidation.wallets.length > 1
  );
  const [mainAddress, setMainAddress] = useState<string>(
    profile.profile?.primary_wallet?.toLowerCase() ??
      (router.query.user as string).toLowerCase()
  );

  useEffect(() => {
    setIsConsolidation(profile.consolidation.wallets.length > 1);
    setMainAddress(
      profile.profile?.primary_wallet?.toLowerCase() ??
        (router.query.user as string).toLowerCase()
    );
  }, [profile, router.query.user]);

  const [walletsTDH, setWalletsTDH] = useState<Record<string, TDHMetrics>>({});
  const [tdh, setTDH] = useState<UserPageStatsTDHType>(null);

  const [loadingMetrics, setLoadingMetrics] = useState<string[]>([]);
  const [loading, setLoading] = useState(loadingMetrics.length > 0);

  const [activeAddress, setActiveAddress] = useState<string | null>(null);
  const [queryAddress, setQueryAddress] = useState<string>(
    activeAddress ?? mainAddress
  );

  useEffect(() => {
    if (!activeAddress || !isConsolidation) {
      setTDH(consolidatedTDH);
      return;
    }

    setTDH(walletsTDH[queryAddress]);
  }, [activeAddress, queryAddress, walletsTDH, profile, isConsolidation]);

  useEffect(() => {
    setQueryAddress(activeAddress ?? mainAddress);
  }, [activeAddress, isConsolidation, mainAddress]);

  useEffect(() => {
    const loadMetrics = async (wallet: string) => {
      setLoadingMetrics((prev) => [...prev, wallet]);
      const tdhResponses = await commonApiFetch<{ data: TDHMetrics[] }>({
        endpoint: `owner_metrics/?wallet=${wallet}&profile_page=true`,
      });

      if (!tdhResponses.data.length) {
        setLoadingMetrics((prev) => prev.filter((w) => w !== wallet));
        return;
      }
      const tdhResponse = tdhResponses.data[0];
      setWalletsTDH((prev) => ({
        ...prev,
        [wallet]: tdhResponse,
      }));
      setLoadingMetrics((prev) => prev.filter((w) => w !== wallet));
    };

    if (!activeAddress) {
      return;
    }

    if (!consolidatedTDH) {
      return;
    }

    if (!isConsolidation) {
      return;
    }

    loadMetrics(activeAddress);
  }, [activeAddress]);

  useEffect(() => {
    setLoading(loadingMetrics.length > 0);
  }, [loadingMetrics]);

  return (
    <div className="tailwind-scope">
      <div className="tw-flex-col-reverse tw-flex md:tw-flex-row tw-justify-between tw-gap-6 lg:tw-space-y-0 tw-w-full tw-mt-6 lg:tw-mt-8">
        <UserPageStatsTags tdh={tdh} />
        <UserPageHeaderAddresses
          addresses={profile.consolidation.wallets}
          onActiveAddress={setActiveAddress}
        />
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
      />

      <UserPageStatsTDHcharts mainAddress={mainAddress} /> */}
    </div>
  );
}
