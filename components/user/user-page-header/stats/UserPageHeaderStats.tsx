"use client";

import Link from "next/link";
import { ApiIdentity } from "../../../../generated/models/ApiIdentity";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import { useRouter } from "next/router";
import UserPageFollowers from "../followers/UserPageFollowers";

export default function UserPageHeaderStats({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const router = useRouter();
  const user = router.query.user as string;
  return (
    <div className="tw-mt-3">
      <div className="tw-flex tw-gap-x-4 sm:tw-gap-x-6 tw-flex-wrap tw-gap-y-2">
        <Link
          href={`/${user}/collected`}
          className="tw-no-underline tw-inline-flex tw-items-center tw-gap-x-1">
          <span className="tw-text-base tw-font-medium tw-text-iron-50">
            {formatNumberWithCommas(profile.tdh)}
          </span>
          <span className="tw-block tw-text-base tw-font-medium tw-text-iron-400">
            TDH
          </span>
        </Link>
        <Link
          href={`/${user}/collected`}
          className="tw-no-underline tw-inline-flex tw-items-center tw-gap-x-1">
          <span className="tw-text-base tw-font-medium tw-text-iron-50">
            {formatNumberWithCommas(profile.tdh_rate)}
          </span>
          <span className="tw-block tw-text-base tw-font-medium tw-text-iron-400 tw-whitespace-nowrap">
            TDH Rate
          </span>
        </Link>
        <Link
          href={`/${user}/rep`}
          className="tw-no-underline tw-inline-flex tw-items-center tw-gap-x-1">
          <span className="tw-text-base tw-font-medium tw-text-iron-50">
            {formatNumberWithCommas(profile.rep)}
          </span>
          <span className="tw-block tw-text-base tw-font-medium tw-text-iron-400">
            Rep
          </span>
        </Link>
        <UserPageFollowers profile={profile} />
      </div>
    </div>
  );
}
