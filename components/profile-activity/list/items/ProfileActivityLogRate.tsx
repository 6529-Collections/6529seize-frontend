import {
  ProfileActivityLogRatingEdit,
  ProfileActivityLogRatingEditContentChangeReason,
  RateMatter,
} from "../../../../entities/IProfile";
import { useRouter } from "next/router";
import ProfileActivityLogItemAction from "./utils/ProfileActivityLogItemAction";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import { UserPageTabType } from "../../../user/layout/UserPageTabs";
import CommonProfileLink from "../../../user/utils/CommonProfileLink";
import Link from "next/link";

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
  [RateMatter.CIC]: "CIC",
  [RateMatter.DROP_REP]: "Drop Rep",
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
  const isSystemAdjustment =
    log.contents.change_reason ===
    ProfileActivityLogRatingEditContentChangeReason.LOST_TDH;

  const router = useRouter();

  const getRatingType = (): ProfileActivityLogRateType =>
    log.contents.new_rating < log.contents.old_rating
      ? ProfileActivityLogRateType.REMOVED
      : ProfileActivityLogRateType.ADDED;

  const ratingType = getRatingType();

  const change = log.contents.new_rating - log.contents.old_rating;
  const isChangePositive = change > 0;
  const changeStr = formatNumberWithCommas(Math.abs(change));

  const isNewRatingPositive = log.contents.new_rating > 0;
  const isNewRatingNegative = log.contents.new_rating < 0;
  const newRatingStr = formatNumberWithCommas(log.contents.new_rating);

  const getTotalRatingClass = () => {
    if (isNewRatingPositive) {
      return "tw-text-green";
    } else if (isNewRatingNegative) {
      return "tw-text-red";
    } else {
      return "tw-text-iron-400";
    }
  };

  const handleOrWallet = log.target_profile_handle ?? "";

  const isCurrentUser =
    (router.query.user as string)?.toLowerCase() ===
    handleOrWallet.toLowerCase();

  const tabTarget =
    log.contents.rating_matter === RateMatter.REP
      ? UserPageTabType.REP
      : UserPageTabType.IDENTITY;

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
          className="tw-no-underline tw-whitespace-nowrap tw-text-xs tw-text-iron-400 tw-font-medium"
        >
          (Proxy for {proxyHandle})
        </Link>
      )}
      <ProfileActivityLogItemAction action={ACTION[ratingType]} />
      <span
        className={`${
          isChangePositive ? "tw-text-green" : "tw-text-red"
        } tw-text-base tw-font-medium`}
      >
        {changeStr}
      </span>
      <span
        className={`${getTotalRatingClass()} tw-whitespace-nowrap tw-text-base tw-font-medium`}
      >
        (total {newRatingStr})
      </span>
      {log.contents.rating_matter === RateMatter.REP && (
        <span className="tw-whitespace-nowrap tw-text-base tw-font-medium tw-text-iron-100">
          {log.contents.rating_category}
        </span>
      )}
      <ProfileActivityLogItemAction
        action={LOG_MATTER_STR[log.contents.rating_matter]}
      />

      <ProfileActivityLogItemAction action={TO_FROM[ratingType]} />
      <CommonProfileLink
        handleOrWallet={handleOrWallet}
        isCurrentUser={isCurrentUser}
        tabTarget={tabTarget}
      />

      {!!proxyHandle && !isSelfProxy && (
        <Link
          href={`/${proxyHandle}`}
          className="tw-no-underline tw-whitespace-nowrap tw-text-xs tw-text-iron-400 tw-font-medium"
        >
          (Proxy: {proxyHandle})
        </Link>
      )}

      {isSystemAdjustment && (
        <span className="tw-whitespace-nowrap tw-inline-flex tw-items-center tw-gap-x-1.5 tw-rounded-md tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-700">
          <svg
            className="tw-flex-shrink-0 tw-h-1.5 tw-w-1.5 tw-fill-red"
            viewBox="0 0 6 6"
            aria-hidden="true"
          >
            <circle cx="3" cy="3" r="3" />
          </svg>
          <span>System Adjustment</span>
        </span>
      )}
    </>
  );
}
