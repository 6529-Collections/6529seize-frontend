"use client";

import Link from "next/link";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import {
  formatUserStatsRowInteger,
  formatUserStatsRowStatFloor,
  getUserStatsRowMessage,
} from "./user-stats-row.messages";

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
  readonly onFollowersClick?: (() => void) | undefined;
  readonly locale?: SupportedLocale | undefined;
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
  onFollowersClick,
  locale = DEFAULT_LOCALE,
}: UserStatsRowProps) {
  const routeHandle = encodeURIComponent(handle.toLowerCase());
  const count = followersCount ?? 0;
  const followerLabel = getUserStatsRowMessage(
    count === 1
      ? "user.statsRow.labels.followers.one"
      : "user.statsRow.labels.followers.other",
    {},
    locale
  );
  const classes = SIZE_CLASSES[size];
  const tdhValue = formatUserStatsRowStatFloor(tdh, locale);
  const tdhRateValue = formatUserStatsRowStatFloor(tdh_rate, locale);
  const xtdhValue = formatUserStatsRowStatFloor(xtdh, locale);
  const xtdhRateValue = formatUserStatsRowStatFloor(xtdh_rate, locale);
  const nicValue = formatUserStatsRowStatFloor(cic, locale);
  const repValue = formatUserStatsRowStatFloor(rep, locale);
  const followersValue = formatUserStatsRowInteger(count, locale);
  const tdhLinkLabel = getUserStatsRowMessage(
    tdh_rate > 0
      ? "user.statsRow.links.tdhWithRate"
      : "user.statsRow.links.tdh",
    { handle, value: tdhValue, rate: tdhRateValue },
    locale
  );
  const xtdhLinkLabel = getUserStatsRowMessage(
    xtdh_rate > 0
      ? "user.statsRow.links.xtdhWithRate"
      : "user.statsRow.links.xtdh",
    { handle, value: xtdhValue, rate: xtdhRateValue },
    locale
  );
  const followersActionLabel = {
    handle,
    value: followersValue,
    followersLabel: followerLabel,
  };

  return (
    <div className={`@container ${className}`}>
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-y-1 sm:tw-gap-y-0.5 tw-gap-x-4 lg:tw-gap-x-6">
        <Link
          href={`/${routeHandle}/collected`}
          aria-label={tdhLinkLabel}
          className="tw-no-underline desktop-hover:hover:tw-underline tw-transition tw-duration-300 tw-ease-out"
        >
          <span className={`${classes.text} tw-font-semibold tw-text-iron-300`}>
            {tdhValue}
          </span>{" "}
          <span className={`${classes.text} tw-font-medium tw-text-iron-500`}>
            {getUserStatsRowMessage("user.statsRow.labels.tdh", {}, locale)}
          </span>
          {tdh_rate > 0 && (
            <>
              {" "}
              <span
                className={`${classes.rate} tw-font-semibold tw-text-emerald-500`}
              >
                +{tdhRateValue}
              </span>
            </>
          )}
        </Link>

        <Link
          href={`/${routeHandle}/xtdh`}
          aria-label={xtdhLinkLabel}
          className="tw-no-underline desktop-hover:hover:tw-underline tw-transition tw-duration-300 tw-ease-out"
        >
          <span className={`${classes.text} tw-font-semibold tw-text-iron-300`}>
            {xtdhValue}
          </span>{" "}
          <span className={`${classes.text} tw-font-medium tw-text-iron-500`}>
            {getUserStatsRowMessage("user.statsRow.labels.xtdh", {}, locale)}
          </span>
          {xtdh_rate > 0 && (
            <>
              {" "}
              <span
                className={`${classes.rate} tw-font-semibold tw-text-emerald-500`}
              >
                +{xtdhRateValue}
              </span>
            </>
          )}
        </Link>

        <Link
          href={`/${routeHandle}`}
          aria-label={getUserStatsRowMessage(
            "user.statsRow.links.nic",
            { handle, value: nicValue },
            locale
          )}
          className="tw-no-underline desktop-hover:hover:tw-underline tw-transition tw-duration-300 tw-ease-out"
        >
          <span className={`${classes.text} tw-font-semibold tw-text-iron-300`}>
            {nicValue}
          </span>{" "}
          <span className={`${classes.text} tw-font-medium tw-text-iron-500`}>
            {getUserStatsRowMessage("user.statsRow.labels.nic", {}, locale)}
          </span>
        </Link>

        <Link
          href={`/${routeHandle}`}
          aria-label={getUserStatsRowMessage(
            "user.statsRow.links.rep",
            { handle, value: repValue },
            locale
          )}
          className="tw-no-underline desktop-hover:hover:tw-underline tw-transition tw-duration-300 tw-ease-out"
        >
          <span className={`${classes.text} tw-font-semibold tw-text-iron-300`}>
            {repValue}
          </span>{" "}
          <span className={`${classes.text} tw-font-medium tw-text-iron-500`}>
            {getUserStatsRowMessage("user.statsRow.labels.rep", {}, locale)}
          </span>
        </Link>

        {onFollowersClick ? (
          <button
            type="button"
            onClick={onFollowersClick}
            aria-label={getUserStatsRowMessage(
              "user.statsRow.buttons.followers",
              followersActionLabel,
              locale
            )}
            className="tw-bg-transparent tw-border-none tw-p-0 tw-cursor-pointer tw-no-underline desktop-hover:hover:tw-underline tw-transition tw-duration-300 tw-ease-out"
          >
            <span className={`${classes.text} tw-font-semibold tw-text-iron-300`}>
              {followersValue}
            </span>{" "}
            <span className={`${classes.text} tw-font-medium tw-text-iron-500`}>
              {followerLabel}
            </span>
          </button>
        ) : (
          <Link
            href={`/${routeHandle}`}
            aria-label={getUserStatsRowMessage(
              "user.statsRow.links.followers",
              followersActionLabel,
              locale
            )}
            className="tw-no-underline desktop-hover:hover:tw-underline tw-transition tw-duration-300 tw-ease-out"
          >
            <span className={`${classes.text} tw-font-semibold tw-text-iron-300`}>
              {followersValue}
            </span>{" "}
            <span className={`${classes.text} tw-font-medium tw-text-iron-500`}>
              {followerLabel}
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
