"use client";

import Link from "next/link";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { formatStatFloor } from "@/helpers/Helpers";
import UserPageFollowers from "../followers/UserPageFollowers";


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

  if (!routeHandle) {
    return null;
  }

  return (
    <div className="tw-mt-3">
      <div className="tw-flex tw-items-center tw-flex-wrap tw-gap-y-2">
        <Link
          href={`/${routeHandle}/collected`}
          className="tw-no-underline desktop-hover:hover:tw-underline tw-transition tw-duration-300 tw-ease-out"
        >
          <span className="tw-text-base tw-font-semibold tw-text-iron-50">
            {formatStatFloor(profile.tdh)}
          </span>{" "}
          <span className="tw-text-base tw-font-medium tw-text-iron-400">
            TDH
          </span>
          {profile.tdh_rate > 0 && (
            <>
              {" "}
              <span className="tw-text-sm tw-font-medium tw-text-iron-400">
                +
                <span className="tw-text-iron-50">
                  {formatStatFloor(profile.tdh_rate)}
                </span>
              </span>
            </>
          )}
        </Link>

        <div className="tw-text-iron-600 tw-mx-3">|</div>

        <Link
          href="/xtdh"
          className="tw-no-underline desktop-hover:hover:tw-underline tw-transition tw-duration-300 tw-ease-out"
        >
          <span className="tw-text-base tw-font-semibold tw-text-iron-50">
            {formatStatFloor(profile.xtdh)}
          </span>{" "}
          <span className="tw-text-base tw-font-medium tw-text-iron-400">
            xTDH
          </span>
          {profile.xtdh_rate > 0 && (
            <>
              {" "}
              <span className="tw-text-sm tw-font-medium tw-text-iron-400">
                +
                <span className="tw-text-iron-50">
                  {formatStatFloor(profile.xtdh_rate)}
                </span>
              </span>
            </>
          )}
        </Link>

        <div className="tw-text-iron-600 tw-mx-3">|</div>

        <Link
          href={`/${routeHandle}/identity`}
          className="tw-no-underline desktop-hover:hover:tw-underline tw-transition tw-duration-300 tw-ease-out"
        >
          <span className="tw-text-base tw-font-semibold tw-text-iron-50">
            {formatStatFloor(profile.cic)}
          </span>{" "}
          <span className="tw-text-base tw-font-medium tw-text-iron-400">
            NIC
          </span>
        </Link>

        <div className="tw-text-iron-600 tw-mx-3">|</div>

        <Link
          href={`/${routeHandle}/rep`}
          className="tw-no-underline desktop-hover:hover:tw-underline tw-transition tw-duration-300 tw-ease-out"
        >
          <span className="tw-text-base tw-font-semibold tw-text-iron-50">
            {formatStatFloor(profile.rep)}
          </span>{" "}
          <span className="tw-text-base tw-font-medium tw-text-iron-400">
            Rep
          </span>
        </Link>

        <div className="tw-text-iron-600 tw-mx-3">|</div>

        <UserPageFollowers
          handleOrWallet={routeHandle}
          followersCount={followersCount}
        />
      </div>
    </div>
  );
}
