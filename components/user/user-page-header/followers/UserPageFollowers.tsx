import { useQuery } from "@tanstack/react-query";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import { IncomingIdentitySubscriptionsPage } from "../../../../generated/models/IncomingIdentitySubscriptionsPage";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../services/api/common-api";
import CircleLoader, {
  CircleLoaderSize,
} from "../../../distribution-plan-tool/common/CircleLoader";

export default function UserPageFollowers({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const { data: followers, isFetching } =
    useQuery<IncomingIdentitySubscriptionsPage>({
      queryKey: [
        QueryKey.IDENTITY_FOLLOWERS,
        { external_id: profile.profile?.external_id, page_size: 1 },
      ],
      queryFn: async () =>
        await commonApiFetch<IncomingIdentitySubscriptionsPage>({
          endpoint: `identity-subscriptions/incoming/IDENTITY/${profile.profile?.external_id}`,
          params: {
            page_size: "1",
          },
        }),
      enabled: !!profile.profile?.external_id,
    });

  return (
    <div className="tw-inline-flex tw-items-center tw-gap-x-1">
      {isFetching ? (
        <CircleLoader size={CircleLoaderSize.SMALL} />
      ) : (
        <span className="tw-text-base tw-font-medium tw-text-iron-50">
          {formatNumberWithCommas(followers?.count ?? 0)}
        </span>
      )}
      <span className="tw-block tw-text-base tw-font-medium tw-text-iron-400">
        Followers
      </span>
    </div>
  );
}
