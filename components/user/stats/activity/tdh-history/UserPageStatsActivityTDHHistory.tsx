import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import CommonCardSkeleton from "@/components/utils/animation/CommonCardSkeleton";
import { TDHHistory } from "@/entities/ITDH";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import UserPageStatsActivityTDHHistoryCharts from "./UserPageStatsActivityTDHHistoryCharts";

export default function UserPageStatsActivityTDHHistory({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const { isFetching, data: tdhHistory } = useQuery<TDHHistory[]>({
    queryKey: [QueryKey.WALLET_TDH_HISTORY, profile.consolidation_key],
    enabled: !!profile?.consolidation_key,
    queryFn: async () => {
      const response = await commonApiFetch<TDHHistory[]>({
        endpoint: `recent_tdh_history/${profile.consolidation_key}`,
      });
      return response;
    },
  });

  let content;

  if (isFetching) {
    content = (
      <div className="tw-mt-2 sm:tw-mt-4 tw-w-full tw-h-96">
        <CommonCardSkeleton />
      </div>
    );
  } else if (tdhHistory && tdhHistory.length > 0) {
    content = <UserPageStatsActivityTDHHistoryCharts tdhHistory={tdhHistory} />;
  } else {
    content = (
      <div className="tw-mt-2 lg:tw-mt-4 tw-bg-iron-950 tw-border tw-border-iron-700 tw-border-solid tw-rounded-lg tw-overflow-x-auto">
        <div className="tw-p-4 sm:tw-px-6 tw-text-sm tw-italic tw-text-iron-500">
          No TDH history found
        </div>
      </div>
    );
  }

  return (
    <div className="tw-mt-4 md:tw-mt-5">
      <div className="tw-flex">
        <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-100">
          TDH History
        </h3>
      </div>
      {content}
    </div>
  );
}
