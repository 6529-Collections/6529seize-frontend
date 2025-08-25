"use client";

import Link from "next/link";
import { ApiIdentity } from "../../../../generated/models/ApiIdentity";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import { useRouter } from "next/router";
import UserPageFollowers from "../followers/UserPageFollowers";
import { Tooltip } from "react-tooltip";

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
          className="tw-no-underline tw-inline-flex tw-items-center tw-gap-x-1 desktop-hover:hover:tw-underline tw-transition tw-duration-300 tw-ease-out"
        >
          <span className="tw-text-base tw-font-medium tw-text-iron-50">
            {formatNumberWithCommas(profile.tdh)}
          </span>
          <span className="tw-block tw-text-base tw-font-medium tw-text-iron-400">
            TDH
          </span>
        </Link>
        <span
          className="tw-no-underline tw-inline-flex tw-items-center tw-gap-x-1"
          data-tooltip-id="tdh-rate-tooltip"
        >
          <span className="tw-text-base tw-font-medium tw-text-iron-50">
            {formatNumberWithCommas(profile.tdh_rate)}
          </span>
          <span className="tw-block tw-text-base tw-font-medium tw-text-iron-400 tw-whitespace-nowrap">
            TDH Rate
          </span>
        </span>
        <Link
          href={`/${user}/rep`}
          className="tw-no-underline tw-inline-flex tw-items-center tw-gap-x-1 desktop-hover:hover:tw-underline tw-transition tw-duration-300 tw-ease-out"
        >
          <span className="tw-text-base tw-font-medium tw-text-iron-50">
            {formatNumberWithCommas(profile.rep)}
          </span>
          <span className="tw-block tw-text-base tw-font-medium tw-text-iron-400">
            Rep
          </span>
        </Link>
        <UserPageFollowers profile={profile} />
      </div>
      <Tooltip
        id="tdh-rate-tooltip"
        place="top"
        style={{
          backgroundColor: "#1F2937",
          color: "white",
          padding: "4px 8px",
        }}
      >
        <span className="tw-text-xs">
          The TDH you gain per day from your current holdings.
        </span>
      </Tooltip>
    </div>
  );
}
