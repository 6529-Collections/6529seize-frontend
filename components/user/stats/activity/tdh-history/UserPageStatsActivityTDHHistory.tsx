import { useRouter } from "next/router";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import { TDHHistory } from "../../../../../entities/ITDH";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../../services/api/common-api";
import UserPageStatsActivityTDHHistoryCharts from "./UserPageStatsActivityTDHHistoryCharts";

export default function UserPageStatsActivityTDHHistory({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const router = useRouter();
  const mainAddress =
    profile.profile?.primary_wallet?.toLowerCase() ??
    (router.query.user as string).toLowerCase();

  const { data: tdhHistory } = useQuery<TDHHistory[]>({
    queryKey: [
      QueryKey.WALLET_TDH_HISTORY,
      {
        wallet: mainAddress,
        page_size: "10",
      },
    ],
    queryFn: async () => {
      const response = await commonApiFetch<{ data: TDHHistory[] }>({
        endpoint: `tdh_history`,
        params: {
          wallet: mainAddress,
          page_size: "10",
        },
      });
      return response.data;
    },
  });

  return (
    <div className="tw-mt-4">
      <UserPageStatsActivityTDHHistoryCharts tdhHistory={tdhHistory ?? []} />
    </div>
  );
}
