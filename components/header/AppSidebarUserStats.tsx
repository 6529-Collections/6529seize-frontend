import Link from "next/link";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { useQuery } from "@tanstack/react-query";
import { ApiIncomingIdentitySubscriptionsPage } from "@/generated/models/ApiIncomingIdentitySubscriptionsPage";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";

export default function AppSidebarUserStats({
  handle,
  tdh,
  tdh_rate,
  rep,
  profileId,
}: {
  readonly handle: string;
  readonly tdh: number;
  readonly tdh_rate: number;
  readonly rep: number;
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
  const fmt = (n: number) => formatNumberWithCommas(n);

  return (
    <div className="tw-flex tw-gap-x-3 tw-flex-wrap tw-gap-y-2">
      <Link
        href={`/${handle}/collected`}
        className="tw-no-underline tw-inline-flex tw-items-center tw-gap-x-1"
      >
        <span className="tw-text-sm tw-font-medium tw-text-iron-50">
          {fmt(tdh)}
        </span>
        <span className="tw-text-sm tw-font-medium tw-text-iron-400">TDH</span>
      </Link>
      <Link
        href={`/${handle}/collected`}
        className="tw-no-underline tw-inline-flex tw-items-center tw-gap-x-1"
      >
        <span className="tw-text-sm tw-font-medium tw-text-iron-50">
          {fmt(tdh_rate)}
        </span>
        <span className="tw-text-sm tw-font-medium tw-text-iron-400 tw-whitespace-nowrap">
          TDH Rate
        </span>
      </Link>
      <Link
        href={`/${handle}/rep`}
        className="tw-no-underline tw-inline-flex tw-items-center tw-gap-x-1"
      >
        <span className="tw-text-sm tw-font-medium tw-text-iron-50">
          {fmt(rep)}
        </span>
        <span className="tw-text-sm tw-font-medium tw-text-iron-400">Rep</span>
      </Link>
      <Link
        href={`/${handle}/followers`}
        className="tw-no-underline tw-inline-flex tw-items-center tw-gap-x-1"
      >
        <span className="tw-text-sm tw-font-medium tw-text-iron-50">
          {fmt(followers)}
        </span>
        <span className="tw-text-sm tw-font-medium tw-text-iron-400">
          {followers === 1 ? "Follower" : "Followers"}
        </span>
      </Link>
    </div>
  );
}
