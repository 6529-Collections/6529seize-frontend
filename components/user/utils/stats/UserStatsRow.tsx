"use client";

import Link from "next/link";
import { formatNumberWithCommas, formatStatFloor } from "@/helpers/Helpers";

interface UserStatsRowProps {
  readonly handle: string;
  readonly tdh: number;
  readonly tdh_rate: number;
  readonly xtdh: number;
  readonly xtdh_rate: number;
  readonly rep: number;
  readonly cic: number;
  readonly followersCount: number | null;
  readonly className?: string;
}

export default function UserStatsRow({
  handle,
  tdh,
  tdh_rate,
  xtdh,
  xtdh_rate,
  rep,
  cic,
  followersCount,
  className = "",
}: UserStatsRowProps) {
  const routeHandle = encodeURIComponent(handle.toLowerCase());
  const count = followersCount ?? 0;
  const followerLabel = count === 1 ? "Follower" : "Followers";

  return (
    <div className={`@container ${className}`}>
      <div className="tw-flex tw-items-center tw-flex-wrap tw-gap-y-2">
        <Link
          href={`/${routeHandle}/collected`}
          className="tw-no-underline desktop-hover:hover:tw-underline tw-transition tw-duration-300 tw-ease-out"
        >
          <span className="tw-text-base tw-font-semibold tw-text-iron-50">
            {formatStatFloor(tdh)}
          </span>{" "}
          <span className="tw-text-base tw-font-medium tw-text-iron-400">
            TDH
          </span>
          {tdh_rate > 0 && (
            <>
              {" "}
              <span className="tw-text-sm tw-font-medium tw-text-iron-400">
                +
                <span className="tw-text-iron-50">
                  {formatStatFloor(tdh_rate)}
                </span>
              </span>
            </>
          )}
        </Link>

        <div className="tw-text-iron-600 tw-mx-3">|</div>

        <Link
          href={`/${routeHandle}/xtdh`}
          className="tw-no-underline desktop-hover:hover:tw-underline tw-transition tw-duration-300 tw-ease-out"
        >
          <span className="tw-text-base tw-font-semibold tw-text-iron-50">
            {formatStatFloor(xtdh)}
          </span>{" "}
          <span className="tw-text-base tw-font-medium tw-text-iron-400">
            xTDH
          </span>
          {xtdh_rate > 0 && (
            <>
              {" "}
              <span className="tw-text-sm tw-font-medium tw-text-iron-400">
                +
                <span className="tw-text-iron-50">
                  {formatStatFloor(xtdh_rate)}
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
            {formatStatFloor(cic)}
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
            {formatStatFloor(rep)}
          </span>{" "}
          <span className="tw-text-base tw-font-medium tw-text-iron-400">
            Rep
          </span>
        </Link>

        <div className="tw-text-iron-600 tw-mx-3">|</div>

        <Link
          href={`/${routeHandle}/followers`}
          className="tw-no-underline desktop-hover:hover:tw-underline tw-transition tw-duration-300 tw-ease-out"
        >
          <span className="tw-text-base tw-font-semibold tw-text-iron-50">
            {formatNumberWithCommas(count)}
          </span>{" "}
          <span className="tw-text-base tw-font-medium tw-text-iron-400">
            {followerLabel}
          </span>
        </Link>
      </div>
    </div>
  );
}
