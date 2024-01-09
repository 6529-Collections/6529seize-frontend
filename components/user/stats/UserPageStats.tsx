import { useRouter } from "next/router";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { ConsolidatedTDHMetrics, TDHMetrics } from "../../../entities/ITDH";
import { useEffect, useState } from "react";
import { commonApiFetch } from "../../../services/api/common-api";
import UserPageStatsOverview from "./UserPageStatsOverview";
import UserPageStatsTDHcharts from "./UserPageStatsTDHcharts";
import { NFTLite } from "../../../entities/INFT";
import UserPageActivity from "../to-be-removed/UserPageActivity";
import UserPageDistributions from "../to-be-removed/UserPageDistributions";
import UserPageHeaderAddresses from "../user-page-header/addresses/UserPageHeaderAddresses";
import UserPageStatsTags from "./UserPageStatsTags";

export default function UserPageStats({
  profile,
  consolidatedTDH,
  memesLite,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly consolidatedTDH: ConsolidatedTDHMetrics | null;
  readonly memesLite: NFTLite[];
}) {
  const router = useRouter();
  const isConsolidation = profile.consolidation.wallets.length > 1;

  const mainAddress =
    profile.profile?.primary_wallet?.toLowerCase() ??
    (router.query.user as string).toLowerCase();
  const [walletsTDH, setWalletsTDH] = useState<Record<string, TDHMetrics>>({});
  const [tdh, setTDH] = useState<ConsolidatedTDHMetrics | TDHMetrics | null>(
    null
  );

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
  }, [activeAddress, queryAddress, walletsTDH]);

  useEffect(() => {
    setQueryAddress(activeAddress ?? mainAddress);
  }, [activeAddress]);

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
    <>
      <UserPageStatsTags tdh={tdh} />
      <div className="tailwind-scope tw-inline-flex tw-justify-between tw-w-full tw-mt-8">
        <h2 className="tw-text-xl tw-font-semibold tw-text-white tw-sm:truncate sm:tw-text-2xl sm:tw-tracking-tight tw-text-right">
          Under construction
        </h2>
        <div>
          <UserPageHeaderAddresses
            addresses={profile.consolidation.wallets}
            onActiveAddress={setActiveAddress}
          />
        </div>
      </div>
      <UserPageStatsOverview tdh={tdh} loading={loading} />
      <UserPageActivity
        show={true}
        activeAddress={activeAddress}
        memesLite={memesLite}
        profile={profile}
      />
      <UserPageDistributions
        show={true}
        activeAddress={activeAddress}
        profile={profile}
      />

      <UserPageStatsTDHcharts mainAddress={mainAddress} />
    </>
  );
}
