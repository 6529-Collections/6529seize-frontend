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

export enum UserStatsRowVariant {
  INLINE = "INLINE",
  PROFILE_HEADER = "PROFILE_HEADER",
}

const SIZE_CLASSES: Record<UserStatsRowSize, { text: string; rate: string }> = {
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
  readonly variant?: UserStatsRowVariant | undefined;
  readonly onFollowersClick?: (() => void) | undefined;
  readonly locale?: SupportedLocale | undefined;
}

function StatValueAndLabel({
  value,
  label,
  valueClassName,
  labelClassName,
  isProfileHeader,
}: {
  readonly value: string;
  readonly label: string;
  readonly valueClassName: string;
  readonly labelClassName: string;
  readonly isProfileHeader: boolean;
}) {
  if (isProfileHeader) {
    return (
      <span className="tw-order-1 tw-inline-flex tw-min-w-0 tw-items-baseline tw-gap-x-1.5 tw-whitespace-nowrap">
        <span className={valueClassName}>{value}</span>
        <span className={labelClassName}>{label}</span>
      </span>
    );
  }

  return (
    <>
      <span className={valueClassName}>{value}</span>{" "}
      <span className={labelClassName}>{label}</span>
    </>
  );
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
  variant = UserStatsRowVariant.INLINE,
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
  const isProfileHeader = variant === UserStatsRowVariant.PROFILE_HEADER;
  const rowClassName = isProfileHeader
    ? "tw-grid tw-grid-cols-2 tw-gap-x-5 lg:tw-grid-cols-5 lg:tw-gap-x-7"
    : "tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-1 sm:tw-gap-y-0.5 lg:tw-gap-x-6";
  const itemClassName = isProfileHeader
    ? "tw-flex tw-min-h-14 tw-min-w-0 tw-flex-wrap tw-content-start tw-items-baseline tw-gap-x-1.5 tw-py-2 tw-text-left tw-no-underline tw-transition-colors tw-duration-200 last:tw-col-span-2 desktop-hover:hover:[&>span]:tw-text-white focus-visible:tw-rounded-md focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none lg:last:tw-col-span-1"
    : "tw-no-underline tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-underline";
  const valueClassName = isProfileHeader
    ? "tw-min-w-0 tw-text-sm tw-font-semibold tw-leading-6 tw-tabular-nums tw-text-iron-100 [overflow-wrap:anywhere] sm:tw-text-base lg:tw-text-lg"
    : `${classes.text} tw-font-semibold tw-text-iron-300`;
  const labelClassName = isProfileHeader
    ? "tw-text-sm tw-font-normal tw-leading-6 tw-text-iron-500"
    : `${classes.text} tw-font-medium tw-text-iron-500`;
  const rateClassName = isProfileHeader
    ? "tw-order-2 tw-basis-full tw-text-xs tw-font-medium tw-leading-5 tw-tabular-nums tw-text-emerald-400"
    : `${classes.rate} tw-font-semibold tw-text-emerald-500`;

  return (
    <div className={`@container ${className}`}>
      <div className={rowClassName}>
        <Link
          href={`/${routeHandle}/collected`}
          aria-label={tdhLinkLabel}
          className={itemClassName}
        >
          <StatValueAndLabel
            value={tdhValue}
            label={getUserStatsRowMessage(
              "user.statsRow.labels.tdh",
              {},
              locale
            )}
            valueClassName={valueClassName}
            labelClassName={labelClassName}
            isProfileHeader={isProfileHeader}
          />
          {tdh_rate > 0 && (
            <>
              {" "}
              <span className={rateClassName}>+{tdhRateValue}</span>
            </>
          )}
        </Link>

        <Link
          href={`/${routeHandle}/xtdh`}
          aria-label={xtdhLinkLabel}
          className={itemClassName}
        >
          <StatValueAndLabel
            value={xtdhValue}
            label={getUserStatsRowMessage(
              "user.statsRow.labels.xtdh",
              {},
              locale
            )}
            valueClassName={valueClassName}
            labelClassName={labelClassName}
            isProfileHeader={isProfileHeader}
          />
          {xtdh_rate > 0 && (
            <>
              {" "}
              <span className={rateClassName}>+{xtdhRateValue}</span>
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
          className={itemClassName}
        >
          <StatValueAndLabel
            value={nicValue}
            label={getUserStatsRowMessage(
              "user.statsRow.labels.nic",
              {},
              locale
            )}
            valueClassName={valueClassName}
            labelClassName={labelClassName}
            isProfileHeader={isProfileHeader}
          />
        </Link>

        <Link
          href={`/${routeHandle}`}
          aria-label={getUserStatsRowMessage(
            "user.statsRow.links.rep",
            { handle, value: repValue },
            locale
          )}
          className={itemClassName}
        >
          <StatValueAndLabel
            value={repValue}
            label={getUserStatsRowMessage(
              "user.statsRow.labels.rep",
              {},
              locale
            )}
            valueClassName={valueClassName}
            labelClassName={labelClassName}
            isProfileHeader={isProfileHeader}
          />
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
            className={`${itemClassName} tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0`}
          >
            <StatValueAndLabel
              value={followersValue}
              label={followerLabel}
              valueClassName={valueClassName}
              labelClassName={labelClassName}
              isProfileHeader={isProfileHeader}
            />
          </button>
        ) : (
          <Link
            href={`/${routeHandle}`}
            aria-label={getUserStatsRowMessage(
              "user.statsRow.links.followers",
              followersActionLabel,
              locale
            )}
            className={itemClassName}
          >
            <StatValueAndLabel
              value={followersValue}
              label={followerLabel}
              valueClassName={valueClassName}
              labelClassName={labelClassName}
              isProfileHeader={isProfileHeader}
            />
          </Link>
        )}
      </div>
    </div>
  );
}
