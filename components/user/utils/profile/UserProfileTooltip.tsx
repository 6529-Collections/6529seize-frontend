import { useQuery } from "@tanstack/react-query";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../services/api/common-api";
import DropPfp from "../../../drops/create/utils/DropPfp";
import { formatNumberWithCommasOrDash } from "../../../../helpers/Helpers";

export default function UserProfileTooltip({
  user,
}: {
  readonly user: string;
}) {
  const { data: profile } = useQuery<IProfileAndConsolidations>({
    queryKey: [QueryKey.PROFILE, user],
    queryFn: async () =>
      await commonApiFetch<IProfileAndConsolidations>({
        endpoint: `profiles/${user}`,
      }),
    enabled: !!user,
  });
  return (
    <div className="tw-p-3">
      <DropPfp pfpUrl={profile?.profile?.pfp_url} />
      <div>{profile?.profile?.handle}</div>
      <div>
        TDH: {formatNumberWithCommasOrDash(profile?.consolidation.tdh ?? 0)}
      </div>
      <div>Level: {formatNumberWithCommasOrDash(profile?.level ?? 0)}</div>
      <div>
        CIC: {formatNumberWithCommasOrDash(profile?.cic?.cic_rating ?? 0)}
      </div>
      <div>REP: {formatNumberWithCommasOrDash(profile?.rep ?? 0)}</div>
      <div>Balance: {formatNumberWithCommasOrDash(profile?.balance ?? 0)}</div>
    </div>
  );
}
