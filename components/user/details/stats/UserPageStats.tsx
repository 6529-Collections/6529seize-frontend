import { useRouter } from "next/router";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { ConsolidatedTDHMetrics, TDHMetrics } from "../../../../entities/ITDH";
import { useEffect, useState } from "react";
import { commonApiFetch } from "../../../../services/api/common-api";
import { fetchAllPages } from "../../../../services/6529api";
import UserPageStatsOverview from "./UserPageStatsOverview";
import UserPageStatsTDHcharts from "./UserPageStatsTDHcharts";

export default function UserPageStats({
  profile,
  consolidatedTDH
}: {
  profile: IProfileAndConsolidations;
  consolidatedTDH: ConsolidatedTDHMetrics | null;
}) {
  const isConsolidation = profile.consolidation.wallets.length > 1;
  const router = useRouter();
  const mainAddress = profile.profile?.primary_wallet?.toLowerCase() ?? (router.query.user as string).toLowerCase();
  const [walletsTDH, setWalletsTDH] = useState<Record<string, TDHMetrics>>({});
  const [tdh, setTDH] = useState<ConsolidatedTDHMetrics | TDHMetrics | null>(
    null
  );

  const [loadingMetrics, setLoadingMetrics] = useState<string[]>([]);
  const [loading, setLoading] = useState(loadingMetrics.length > 0);

  const getAddressFromQuery = (): string | null => {
    if (!router.query.address) {
      return null;
    }
    if (typeof router.query.address === "string") {
      return router.query.address.toLowerCase();
    }

    if (router.query.address.length > 0) {
      return router.query.address[0].toLowerCase();
    }
    return null;
  };

  const [activeAddress, setActiveAddress] = useState<string | null>(
    getAddressFromQuery()
  );

  const [queryAddress, setQueryAddress] = useState<string>(
    getAddressFromQuery() ?? mainAddress
  );

  useEffect(() => {
    if (!activeAddress || !isConsolidation) {
      setTDH(consolidatedTDH);
      return;
    }

    setTDH(walletsTDH[queryAddress]);
  }, [activeAddress, queryAddress, walletsTDH]);

  useEffect(() => {
    setActiveAddress((router.query.address as string) ?? null)
  }, [router.query.address])

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

  return <>
    <UserPageStatsOverview tdh={tdh} loading={loading} />
    <UserPageStatsTDHcharts mainAddress={mainAddress} />
  </>
}