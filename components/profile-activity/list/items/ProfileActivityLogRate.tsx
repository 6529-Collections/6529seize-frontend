"use client";

import {
  PROFILE_ACTIVITY_BODY,
  PROFILE_ACTIVITY_EMPHASIS,
} from "@/components/profile-activity/profileActivityTypography";

import { SystemAdjustmentPill } from "@/components/common/SystemAdjustmentPill";
import { USER_PAGE_TAB_IDS } from "@/components/user/layout/userTabs.config";
import CommonProfileLink from "@/components/user/utils/CommonProfileLink";
import type { ProfileActivityLogRatingEdit } from "@/entities/IProfile";
import { ProfileActivityLogRatingEditContentChangeReason } from "@/entities/IProfile";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { RateMatter } from "@/types/enums";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useContext } from "react";
import { IdentityActivityContext } from "../../IdentityActivityContext";
import ProfileActivityLogItemAction from "./utils/ProfileActivityLogItemAction";

enum ProfileActivityLogRateType {
  ADDED = "ADDED",
  REMOVED = "REMOVED",
}

const ACTION: Record<ProfileActivityLogRateType, string> = {
  [ProfileActivityLogRateType.ADDED]: "added",
  [ProfileActivityLogRateType.REMOVED]: "reduced",
};

const LOG_MATTER_STR: Record<RateMatter, string> = {
  [RateMatter.REP]: "Rep",
  [RateMatter.NIC]: "NIC",
  [RateMatter.DROP_REP]: "Drop Rep",
  [RateMatter.WAVE_REP]: t(
    DEFAULT_LOCALE,
    "profileActivity.rate.matter.waveRep"
  ),
};

const TO_FROM: Record<ProfileActivityLogRateType, string> = {
  [ProfileActivityLogRateType.ADDED]: "to",
  [ProfileActivityLogRateType.REMOVED]: "from",
};

export default function ProfileActivityLogRate({
  log,
  user,
}: {
  readonly log: ProfileActivityLogRatingEdit;
  readonly user: string | null;
}) {
  const locale = useBrowserLocale();
  const compact = useContext(IdentityActivityContext);
  const isSystemAdjustment =
    log.contents.change_reason ===
    ProfileActivityLogRatingEditContentChangeReason.LOST_TDH;

  const searchParams = useSearchParams();

  const getRatingType = (): ProfileActivityLogRateType =>
    log.contents.new_rating < log.contents.old_rating
      ? ProfileActivityLogRateType.REMOVED
      : ProfileActivityLogRateType.ADDED;

  const ratingType = getRatingType();

  const change = log.contents.new_rating - log.contents.old_rating;
  const isChangePositive = change > 0;
  const changeStr = compact
    ? formatInteger(locale, Math.abs(change))
    : formatNumberWithCommas(Math.abs(change));

  const isNewRatingPositive = log.contents.new_rating > 0;
  const isNewRatingNegative = log.contents.new_rating < 0;
  const newRatingStr = compact
    ? formatInteger(locale, log.contents.new_rating)
    : formatNumberWithCommas(log.contents.new_rating);

  const getTotalRatingClass = () => {
    if (isNewRatingPositive) {
      return "tw-text-emerald-400";
    } else if (isNewRatingNegative) {
      return "tw-text-rose-400";
    } else {
      return "tw-text-iron-500";
    }
  };

  // Historical activity payloads still name NIC as CIC.
  const matterLabel =
    compact && String(log.contents.rating_matter) === "CIC"
      ? LOG_MATTER_STR[RateMatter.NIC]
      : LOG_MATTER_STR[log.contents.rating_matter];

  const handleOrWallet = log.target_profile_handle ?? "";

  const isCurrentUser =
    (searchParams?.get("user") as string)?.toLowerCase() ===
    handleOrWallet.toLowerCase();

  const tabTarget = USER_PAGE_TAB_IDS.REP;

  const getProxyHandle = (): string | null => {
    if (!log.proxy_handle) return null;
    if (!user) return log.proxy_handle;
    if (user.toLowerCase() === log.proxy_handle.toLowerCase()) {
      return log.profile_handle;
    }
    return log.proxy_handle;
  };

  const proxyHandle = getProxyHandle();
  const isSelfProxy = user?.toLowerCase() === log.proxy_handle?.toLowerCase();

  return (
    <>
      {!!proxyHandle && isSelfProxy && (
        <Link
          href={`/${proxyHandle}`}
          className={`tw-whitespace-nowrap tw-text-sm tw-font-normal tw-text-iron-500 tw-no-underline sm:tw-text-base ${PROFILE_ACTIVITY_BODY}`}
        >
          (Proxy for {proxyHandle})
        </Link>
      )}
      <ProfileActivityLogItemAction action={ACTION[ratingType]} />
      <span
        className={`${
          isChangePositive ? "tw-text-emerald-400" : "tw-text-rose-400"
        } tw-text-sm tw-font-semibold sm:tw-text-base ${PROFILE_ACTIVITY_EMPHASIS}`}
      >
        {changeStr}
      </span>
      {!compact && (
        <span
          className={`${getTotalRatingClass()} tw-whitespace-nowrap tw-text-sm tw-font-semibold sm:tw-text-base ${PROFILE_ACTIVITY_EMPHASIS}`}
        >
          {t(DEFAULT_LOCALE, "profileActivity.rate.runningTotal", {
            total: newRatingStr,
          })}
        </span>
      )}
      {(log.contents.rating_matter === RateMatter.REP ||
        log.contents.rating_matter === RateMatter.WAVE_REP) && (
        <span
          className={`${compact ? "tw-break-words" : "tw-whitespace-nowrap"} tw-text-sm tw-font-medium tw-text-iron-300 sm:tw-text-base ${PROFILE_ACTIVITY_BODY}`}
        >
          {log.contents.rating_category}
        </span>
      )}
      <span
        className={`tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-iron-300 empty:tw-hidden sm:tw-text-base ${PROFILE_ACTIVITY_BODY}`}
      >
        {matterLabel}
      </span>

      <ProfileActivityLogItemAction action={TO_FROM[ratingType]} />
      <CommonProfileLink
        handleOrWallet={handleOrWallet}
        isCurrentUser={isCurrentUser}
        tabTarget={tabTarget}
        textClassName={`tw-text-sm sm:tw-text-base tw-font-semibold tw-text-iron-100 ${PROFILE_ACTIVITY_EMPHASIS}`}
      />

      {compact && (
        <span className="tw-whitespace-nowrap tw-text-sm tw-font-normal tw-tabular-nums tw-text-iron-400">
          {t(locale, "profileActivity.rate.runningTotal", {
            total: newRatingStr,
          })}
        </span>
      )}

      {!!proxyHandle && !isSelfProxy && (
        <Link
          href={`/${proxyHandle}`}
          className={`tw-whitespace-nowrap tw-text-sm tw-font-normal tw-text-iron-500 tw-no-underline sm:tw-text-base ${PROFILE_ACTIVITY_BODY}`}
        >
          (Proxy: {proxyHandle})
        </Link>
      )}

      {isSystemAdjustment && <SystemAdjustmentPill />}
    </>
  );
}
