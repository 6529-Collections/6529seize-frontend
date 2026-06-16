import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import CommonCardSkeleton from "@/components/utils/animation/CommonCardSkeleton";
import type { TDHHistory } from "@/entities/ITDH";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import { getTdhHistoryMessage } from "./tdh-history.messages";
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
      <div className="tw-mt-2 tw-h-96 tw-w-full sm:tw-mt-4">
        <span className="tw-sr-only">
          {getTdhHistoryMessage("user.collected.stats.tdhHistory.loading")}
        </span>
        <CommonCardSkeleton />
      </div>
    );
  } else if (tdhHistory && tdhHistory.length > 0) {
    content = <UserPageStatsActivityTDHHistoryCharts tdhHistory={tdhHistory} />;
  } else {
    content = (
      <div className="tw-mt-2 tw-overflow-x-auto tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 lg:tw-mt-4">
        <output className="tw-block tw-p-4 tw-text-sm tw-italic tw-text-iron-500 sm:tw-px-6">
          {getTdhHistoryMessage("user.collected.stats.tdhHistory.empty")}
        </output>
      </div>
    );
  }

  return (
    <div className="tw-mt-4 md:tw-mt-5">
      <div className="tw-flex">
        <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-100">
          {getTdhHistoryMessage("user.collected.stats.tdhHistory.title")}
        </h3>
      </div>
      {content}
    </div>
  );
}
