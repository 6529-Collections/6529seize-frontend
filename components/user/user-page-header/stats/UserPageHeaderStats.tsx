"use client";

import Link from "next/link";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import UserPageFollowers from "../followers/UserPageFollowers";
import { Tooltip } from "react-tooltip";

const SAFE_ROUTE_SEGMENT_PATTERN = /^[a-zA-Z0-9._-]+$/;

function sanitizeRouteSegment(value: string): string | null {
  if (!value) {
    return null;
  }
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }
  const normalizedValue = trimmedValue.toLowerCase();
  if (!SAFE_ROUTE_SEGMENT_PATTERN.test(normalizedValue)) {
    return null;
  }
  return encodeURIComponent(normalizedValue);
}

export default function UserPageHeaderStats({
  profile,
  handleOrWallet,
  followersCount,
}: {
  readonly profile: ApiIdentity;
  readonly handleOrWallet: string;
  readonly followersCount: number | null;
}) {
  const routeHandle = sanitizeRouteSegment(handleOrWallet);
  const formatWholeStat = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return "-";
    }
    return formatNumberWithCommas(Math.floor(value));
  };

  if (!routeHandle) {
    return null;
  }

  return (
    <div className="tw-mt-3">
      <div className="tw-flex tw-gap-x-4 sm:tw-gap-x-6 tw-flex-wrap tw-gap-y-2">
        <Link
          href={`/${routeHandle}/collected`}
          className="tw-no-underline tw-inline-flex tw-items-center tw-gap-x-1 desktop-hover:hover:tw-underline tw-transition tw-duration-300 tw-ease-out"
        >
          <span className="tw-text-base tw-font-semibold tw-text-iron-50">
            {formatWholeStat(profile.tdh)}
          </span>
          <span className="tw-block tw-text-base tw-font-medium tw-text-iron-400">
            TDH
          </span>
        </Link>
        <Link
          href={`/${routeHandle}/stats?activity=tdh-history`}
          className="tw-no-underline tw-inline-flex tw-items-center tw-gap-x-1 desktop-hover:hover:tw-underline tw-transition tw-duration-300 tw-ease-out"
          data-tooltip-id="tdh-rate-tooltip"
        >
          <span className="tw-text-base tw-font-semibold tw-text-iron-50">
            {formatWholeStat(profile.tdh_rate)}
          </span>
          <span className="tw-block tw-text-base tw-font-medium tw-text-iron-400 tw-whitespace-nowrap">
            TDH Rate
          </span>
        </Link>
        <Link
          href={`/${routeHandle}/rep`}
          className="tw-no-underline tw-inline-flex tw-items-center tw-gap-x-1 desktop-hover:hover:tw-underline tw-transition tw-duration-300 tw-ease-out"
        >
          <span className="tw-text-base tw-font-semibold tw-text-iron-50">
            {formatWholeStat(profile.rep)}
          </span>
          <span className="tw-block tw-text-base tw-font-medium tw-text-iron-400">
            Rep
          </span>
        </Link>
        <UserPageFollowers
          handleOrWallet={routeHandle}
          followersCount={followersCount}
        />
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
        <span className="tw-text-xs">How much TDH you earn each day</span>
      </Tooltip>
    </div>
  );
}
