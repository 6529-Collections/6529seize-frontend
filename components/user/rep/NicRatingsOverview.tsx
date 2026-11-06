"use client";

import Button from "@/components/utils/button/Button";

import { AuthContext } from "@/components/auth/Auth";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { useContext, useState } from "react";
import { FingerprintIcon, RateNicButton } from "../identity/header/RateNicCta";
import UserCICStatus from "../utils/user-cic-status/UserCICStatus";
import UserCICTypeIconWrapper from "../utils/user-cic-type/UserCICTypeIconWrapper";
import UserCICTypeIcon from "../utils/user-cic-type/UserCICTypeIcon";
import RatingContributorsControl from "./RatingContributorsControl";
import type { useNicRatingsOverview } from "./useNicRatingsOverview";
import ProfileRatingsDialog from "./ProfileRatingsDialog";
import { canManageGivenRatings } from "./ratingsManagement";
import RepDirectionToggle from "./RepDirectionToggle";

export default function NicRatingsOverview({
  profile,
  ratings,
  onRateClick,
  compact = false,
}: {
  readonly profile: ApiIdentity;
  readonly ratings: ReturnType<typeof useNicRatingsOverview>;
  readonly onRateClick?: (() => void) | undefined;
  readonly compact?: boolean;
}) {
  const locale = useBrowserLocale();
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const [listOpen, setListOpen] = useState(false);
  const { direction, setDirection, overview, score, isError, retry } = ratings;
  const canManage = canManageGivenRatings(
    profile,
    connectedProfile,
    activeProfileProxy
  );
  const status = direction === "received" && (
    <div
      className={`tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-semibold tw-uppercase ${compact ? "tw-mt-2" : "tw-col-start-2 tw-row-start-1 tw-justify-self-end"}`}
    >
      <span
        className={`tw-flex tw-shrink-0 tw-items-center tw-justify-center ${compact ? "tw-h-4 tw-w-4" : "tw-h-5 tw-w-5"}`}
      >
        {compact ? (
          <UserCICTypeIcon cic={score ?? profile.cic} />
        ) : (
          <UserCICTypeIconWrapper profile={profile} />
        )}
      </span>
      <UserCICStatus cic={score ?? profile.cic} />
    </div>
  );
  const directionToggle = (
    <RepDirectionToggle
      repDirection={direction}
      onRepDirectionChange={setDirection}
      matter="NIC"
    />
  );
  const contributors = (
    <RatingContributorsControl
      overview={overview}
      direction={direction}
      matter="NIC"
      canManage={direction === "given" && canManage}
      onClick={() => setListOpen(true)}
      compact={compact}
    />
  );
  const scoreValue = (
    <div
      className={`tw-text-3xl tw-font-semibold tw-tabular-nums tw-leading-none tw-tracking-tight tw-text-emerald-400 ${compact ? "" : "tw-col-start-1 tw-row-start-2"}`}
    >
      {score === undefined ? "—" : formatInteger(locale, score)}
    </div>
  );
  return (
    <section aria-label={t(locale, "user.rate.nicRegion")} className="tw-mb-6">
      {compact ? (
        <>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-3 tw-gap-y-1">
            <h2 className="tw-m-0 tw-text-[11px] tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-400">
              {t(locale, "user.rate.nicRegion")}
            </h2>
            {directionToggle}
          </div>
          {scoreValue}
          {status}
          <div className="tw-mt-2">{contributors}</div>
        </>
      ) : (
        <>
          {directionToggle}
          <div className="tw-mt-4 tw-grid tw-grid-cols-[minmax(0,1fr)_auto] tw-items-center tw-gap-x-3 tw-gap-y-1">
            <div className="tw-contents">
              <p className="tw-col-start-1 tw-row-start-1 tw-m-0 tw-text-xs tw-text-iron-400">
                {direction === "given"
                  ? t(locale, "user.rate.nicGiven")
                  : t(locale, "user.rate.nicReceived")}
              </p>
              {scoreValue}
            </div>
            {status}
            <div className="tw-col-span-2 tw-row-start-3 tw-mt-3">
              {contributors}
            </div>
          </div>
        </>
      )}
      {direction === "given" && isError && (
        <div role="alert" className="tw-text-sm tw-text-iron-300">
          {t(locale, "user.rate.loadError")}{" "}
          <Button
            variant="tertiary"
            size="sm"
            onClick={() => {
              void retry();
            }}
          >
            {t(locale, "user.rate.retry")}
          </Button>
        </div>
      )}
      {direction === "received" && onRateClick && (
        <div className="tw-mt-4 tw-flex tw-flex-wrap tw-items-center tw-gap-3">
          <RateNicButton onRateClick={onRateClick} />
          {(overview?.authenticated_user_contribution ?? 0) !== 0 && (
            <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-xs tw-text-iron-400">
              {compact && (
                <FingerprintIcon className="tw-h-4 tw-w-4 tw-shrink-0 tw-text-emerald-400" />
              )}
              {t(locale, "user.profile.rep.nic.yourRating", {
                value: formatInteger(
                  locale,
                  overview?.authenticated_user_contribution ?? 0
                ),
              })}
            </span>
          )}
        </div>
      )}
      {listOpen && (
        <ProfileRatingsDialog
          key={direction}
          profile={profile}
          matter="NIC"
          direction={direction}
          onClose={() => setListOpen(false)}
        />
      )}
    </section>
  );
}
