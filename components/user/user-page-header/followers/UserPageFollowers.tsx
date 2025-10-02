import { useQuery } from "@tanstack/react-query";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { ApiIncomingIdentitySubscriptionsPage } from "@/generated/models/ApiIncomingIdentitySubscriptionsPage";
import { commonApiFetch } from "@/services/api/common-api";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import Link from "next/link";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

export default function UserPageFollowers({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const { data: followers, isFetching } =
    useQuery<ApiIncomingIdentitySubscriptionsPage>({
      queryKey: [
        QueryKey.IDENTITY_FOLLOWERS,
        {
          profile_id: profile.id,
          page_size: 1,
          target_type: "IDENTITY",
        },
      ],
      queryFn: async () =>
        await commonApiFetch<ApiIncomingIdentitySubscriptionsPage>({
          endpoint: `identity-subscriptions/incoming/IDENTITY/${profile.id}`,
          params: {
            page_size: "1",
          },
        }),
      enabled: !!profile.id,
    });

  return (
    <Link
      href={`/${profile.handle}/followers`}
      className="tw-no-underline tw-inline-flex tw-items-center tw-gap-x-1 desktop-hover:hover:tw-underline tw-transition tw-duration-300 tw-ease-out"
    >
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
