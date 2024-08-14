import { useQuery } from "@tanstack/react-query";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import { IncomingIdentitySubscriptionsPage } from "../../../../generated/models/IncomingIdentitySubscriptionsPage";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../services/api/common-api";
import CircleLoader, {
  CircleLoaderSize,
} from "../../../distribution-plan-tool/common/CircleLoader";
import Link from "next/link";

export default function UserPageFollowers({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const { data: followers, isFetching } =
    useQuery<IncomingIdentitySubscriptionsPage>({
      queryKey: [
        QueryKey.IDENTITY_FOLLOWERS,
        { profile_id: profile.profile?.external_id, page_size: 1,  target_type: "IDENTITY", },
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
    <Link href={`/${profile.profile?.handle}/followers`} className="tw-no-underline tw-inline-flex tw-items-center tw-gap-x-1 hover:tw-underline tw-transition tw-duration-300 tw-ease-out">
      {isFetching ? (
        <CircleLoader size={CircleLoaderSize.SMALL} />
      ) : (
        <span className="tw-text-base tw-font-medium tw-text-iron-50">
          {formatNumberWithCommas(followers?.count ?? 0)}
        </span>
      )}
      <span className="tw-block tw-text-base tw-font-medium tw-text-iron-400">
        {followers?.count === 1 ? "Follower" : "Followers"}
      </span>
    </Link>
  );
}
