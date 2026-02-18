"use client";

import Link from "next/link";
import { formatNumberWithCommas, formatStatFloor } from "@/helpers/Helpers";

export enum UserStatsRowSize {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
}

const SIZE_CLASSES: Record<
  UserStatsRowSize,
  { text: string; rate: string }
> = {
  [UserStatsRowSize.SMALL]: {
    text: "tw-text-sm",
    rate: "tw-text-xs",
  },
  [UserStatsRowSize.MEDIUM]: {
    text: "tw-text-md",
    rate: "tw-text-xs",
  },
};

interface UserStatsRowProps {
  readonly handle: string;
  readonly tdh: number;
  readonly tdh_rate: number;
  readonly xtdh: number;
  readonly xtdh_rate: number;
  readonly rep: number;
  readonly cic: number;
  readonly followersCount: number | null;
  readonly className?: string | undefined;
  readonly size?: UserStatsRowSize | undefined;
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
  size = UserStatsRowSize.MEDIUM,
}: UserStatsRowProps) {
  const routeHandle = encodeURIComponent(handle.toLowerCase());
  const count = followersCount ?? 0;
  const followerLabel = count === 1 ? "Follower" : "Followers";
  const classes = SIZE_CLASSES[size];

  return (
    <div className={`@container ${className}`}>
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-y-1 sm:tw-gap-y-0.5 tw-gap-x-4 lg:tw-gap-x-6">
        <Link
          href={`/${routeHandle}/collected`}
          className="tw-no-underline desktop-hover:hover:tw-underline tw-transition tw-duration-300 tw-ease-out"
        >
          <span className={`${classes.text} tw-font-semibold tw-text-iron-300`}>
            {formatStatFloor(tdh)}
          </span>{" "}
          <span className={`${classes.text} tw-font-medium tw-text-iron-500`}>
            TDH
          </span>
          {tdh_rate > 0 && (
            <>
              {" "}
              <span
                className={`${classes.rate} tw-font-semibold tw-text-emerald-500`}
              >
                +{formatStatFloor(tdh_rate)}
              </span>
            </>
          )}
        </Link>

        <Link
          href={`/${routeHandle}/xtdh`}
          className="tw-no-underline desktop-hover:hover:tw-underline tw-transition tw-duration-300 tw-ease-out"
        >
          <span className={`${classes.text} tw-font-semibold tw-text-iron-300`}>
            {formatStatFloor(xtdh)}
          </span>{" "}
          <span className={`${classes.text} tw-font-medium tw-text-iron-500`}>
            xTDH
          </span>
          {xtdh_rate > 0 && (
            <>
              {" "}
              <span
                className={`${classes.rate} tw-font-semibold tw-text-emerald-500`}
              >
                +{formatStatFloor(xtdh_rate)}
              </span>
            </>
          )}
        </Link>

        <Link
          href={`/${routeHandle}/rep`}
          className="tw-no-underline desktop-hover:hover:tw-underline tw-transition tw-duration-300 tw-ease-out"
        >
          <span className={`${classes.text} tw-font-semibold tw-text-iron-300`}>
            {formatStatFloor(cic)}
          </span>{" "}
          <span className={`${classes.text} tw-font-medium tw-text-iron-500`}>
            NIC
          </span>
        </Link>

        <Link
          href={`/${routeHandle}/rep`}
          className="tw-no-underline desktop-hover:hover:tw-underline tw-transition tw-duration-300 tw-ease-out"
        >
          <span className={`${classes.text} tw-font-semibold tw-text-iron-300`}>
            {formatStatFloor(rep)}
          </span>{" "}
          <span className={`${classes.text} tw-font-medium tw-text-iron-500`}>
            Rep
          </span>
        </Link>

        <Link
          href={`/${routeHandle}/followers`}
          className="tw-no-underline desktop-hover:hover:tw-underline tw-transition tw-duration-300 tw-ease-out"
        >
          <span className={`${classes.text} tw-font-semibold tw-text-iron-300`}>
            {formatNumberWithCommas(count)}
          </span>{" "}
          <span className={`${classes.text} tw-font-medium tw-text-iron-500`}>
            {followerLabel}
          </span>
        </Link>
      </div>
    </div>
  );
}
