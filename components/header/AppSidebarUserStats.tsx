import UserStatsRow from "../user/utils/stats/UserStatsRow";
import { useQuery } from "@tanstack/react-query";
import type { ApiIncomingIdentitySubscriptionsPage } from "@/generated/models/ApiIncomingIdentitySubscriptionsPage";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";

export default function AppSidebarUserStats({
  handle,
  tdh,
  tdh_rate,
  xtdh,
  xtdh_rate,
  rep,
  cic,
  profileId,
}: {
  readonly handle: string;
  readonly tdh: number;
  readonly tdh_rate: number;
  readonly xtdh: number;
  readonly xtdh_rate: number;
  readonly rep: number;
  readonly cic: number;
  readonly profileId: string | null | undefined;
}) {
  const { data } = useQuery<ApiIncomingIdentitySubscriptionsPage>({
    queryKey: [
      QueryKey.IDENTITY_FOLLOWERS,
      { profile_id: profileId, page_size: 1 },
    ],
    queryFn: async () =>
      await commonApiFetch<ApiIncomingIdentitySubscriptionsPage>({
        endpoint: `identity-subscriptions/incoming/IDENTITY/${profileId}`,
        params: { page_size: "1" },
      }),
    enabled: !!profileId,
  });

  const followers = data?.count ?? 0;

  return (
    <UserStatsRow
      handle={handle}
      tdh={tdh}
      tdh_rate={tdh_rate}
      xtdh={xtdh}
      xtdh_rate={xtdh_rate}
      rep={rep}
      cic={cic}
      followersCount={followers}
    />
  );
}
