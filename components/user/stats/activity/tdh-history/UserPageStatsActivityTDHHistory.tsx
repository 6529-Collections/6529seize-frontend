import { useRouter } from "next/router";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import { TDHHistory } from "../../../../../entities/ITDH";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../../services/api/common-api";
import UserPageStatsActivityTDHHistoryCharts from "./UserPageStatsActivityTDHHistoryCharts";
import CommonCardSkeleton from "../../../../utils/animation/CommonCardSkeleton";

const PAGE_SIZE = 30;

export default function UserPageStatsActivityTDHHistory({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const router = useRouter();
  const mainAddress =
    profile.profile?.primary_wallet?.toLowerCase() ??
    (router.query.user as string).toLowerCase();

  const { isFetching, data: tdhHistory } = useQuery<TDHHistory[]>({
    queryKey: [
      QueryKey.WALLET_TDH_HISTORY,
      {
        wallet: mainAddress,
        page_size: `${PAGE_SIZE}`,
      },
    ],
    queryFn: async () => {
      const response = await commonApiFetch<{ data: TDHHistory[] }>({
        endpoint: `tdh_history`,
        params: {
          wallet: mainAddress,
          page_size: `${PAGE_SIZE}`,
        },
      });
      return response.data;
    },
  });

  return (
    <div className="tw-mt-4 md:tw-mt-5">
      <div className="tw-flex">
        <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
          TDH History
        </h3>
      </div>
      {isFetching ? (
        <div className="tw-mt-2 sm:tw-mt-4 tw-w-full tw-h-96">
          <CommonCardSkeleton />
        </div>
      ) : (
        <UserPageStatsActivityTDHHistoryCharts tdhHistory={tdhHistory ?? []} />
      )}
    </div>
  );
}
