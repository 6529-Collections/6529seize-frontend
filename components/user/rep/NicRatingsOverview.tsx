"use client";

import { AuthContext } from "@/components/auth/Auth";
import OverlappingAvatars from "@/components/common/OverlappingAvatars";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiCicOverview } from "@/generated/models/ApiCicOverview";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo, useState } from "react";
import { RateNicButton } from "../identity/header/RateNicCta";
import UserCICStatus from "../utils/user-cic-status/UserCICStatus";
import UserCICTypeIconWrapper from "../utils/user-cic-type/UserCICTypeIconWrapper";
import UserCICTypeIcon from "../utils/user-cic-type/UserCICTypeIcon";
import { buildRepAvatarItems } from "./buildRepAvatarItems";
import ProfileRatingsDialog from "./ProfileRatingsDialog";
import { canManageGivenRatings } from "./ratingsManagement";
import RepDirectionToggle from "./RepDirectionToggle";
import type { RepDirection } from "./UserPageRep.helpers";

export default function NicRatingsOverview({
  profile,
  cicOverview,
  onRateClick,
  compact = false,
}: {
  readonly profile: ApiIdentity;
  readonly cicOverview: ApiCicOverview | null;
  readonly onRateClick?: (() => void) | undefined;
  readonly compact?: boolean;
}) {
  const locale = useBrowserLocale();
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const [direction, setDirection] = useState<RepDirection>("received");
  const [listOpen, setListOpen] = useState(false);
  const identity = profile.query ?? profile.handle ?? profile.display;
  const given = useQuery({
    queryKey: [
      QueryKey.CIC_OVERVIEW,
      { handleOrWallet: identity.toLowerCase(), direction: "outgoing" },
    ],
    queryFn: () =>
      commonApiFetch<ApiCicOverview>({
        endpoint: `profiles/${encodeURIComponent(identity)}/cic/overview`,
        params: { direction: "outgoing" },
      }),
    enabled: direction === "given",
  });
  const overview = direction === "received" ? cicOverview : given.data;
  const score =
    direction === "received"
      ? (cicOverview?.total_cic ?? profile.cic)
      : given.data?.total_cic;
  const count = overview?.contributor_count ?? 0;
  const countKey = direction === "given" ? "receivers" : "raters";
  const countLabel = t(
    locale,
    `user.profile.rep.contributors.${countKey}.${count === 1 ? "one" : "other"}`,
    { count: formatInteger(locale, count) }
  );
  const canManage = canManageGivenRatings(
    profile,
    connectedProfile,
    activeProfileProxy
  );
  const avatars = useMemo(
    () =>
      buildRepAvatarItems(overview?.contributors.data ?? [], compact ? 3 : 5),
    [overview?.contributors.data, compact]
  );
  const directionLabel = t(
    locale,
    direction === "given" ? "user.rate.given" : "user.rate.received"
  );
  return (
    <section aria-label="NIC" className="tw-mb-6">
      <RepDirectionToggle
        repDirection={direction}
        onRepDirectionChange={setDirection}
        matter="NIC"
      />
      <div className="tw-mt-4 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
        <div>
          {(!compact || direction === "given") && (
            <>
              {(direction === "given" || !compact) && (
                <p className="tw-mb-1 tw-text-xs tw-text-iron-400">
                  {direction === "given"
                    ? t(locale, "user.rate.nicGiven")
                    : "NIC"}
                </p>
              )}
              <div className="tw-text-3xl tw-font-semibold tw-tabular-nums tw-text-iron-50">
                {score === undefined ? "—" : formatInteger(locale, score)}
              </div>
            </>
          )}
          {direction === "received" && (
            <div className="tw-mt-2 tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-semibold tw-uppercase">
              <span className="tw-h-4 tw-w-4">
                {compact ? (
                  <UserCICTypeIcon cic={score ?? profile.cic} />
                ) : (
                  <UserCICTypeIconWrapper profile={profile} />
                )}
              </span>
              <UserCICStatus cic={score ?? profile.cic} />
            </div>
          )}
        </div>
        <div className="tw-flex tw-flex-col tw-items-end tw-gap-2">
          {avatars.length > 0 && (
            <OverlappingAvatars
              items={avatars}
              size={compact ? "sm" : "md"}
              maxCount={compact ? 3 : 5}
            />
          )}
          <button
            type="button"
            onClick={() => setListOpen(true)}
            aria-label={t(locale, "user.rate.viewRatings", {
              matter: "NIC",
              direction: directionLabel,
            })}
            className="tw-min-h-11 tw-cursor-pointer tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-1 tw-text-sm tw-text-iron-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            {direction === "given" && canManage && (
              <>{t(locale, "user.rate.manageGiven")} · </>
            )}
            {countLabel}
          </button>
        </div>
      </div>
      {direction === "given" && given.isError && (
        <div role="alert" className="tw-text-sm tw-text-iron-300">
          {t(locale, "user.rate.loadError")}{" "}
          <button
            type="button"
            onClick={() => {
              void given.refetch();
            }}
            className="tw-min-h-11 tw-border-0 tw-bg-transparent tw-px-3 tw-text-iron-100"
          >
            {t(locale, "user.rate.retry")}
          </button>
        </div>
      )}
      {direction === "received" && onRateClick && (
        <div className="tw-mt-4 tw-flex tw-flex-wrap tw-items-center tw-gap-3">
          <RateNicButton onRateClick={onRateClick} />
          {(cicOverview?.authenticated_user_contribution ?? 0) !== 0 && (
            <span className="tw-text-xs tw-text-iron-400">
              {t(locale, "user.profile.rep.nic.yourRating", {
                value: formatInteger(
                  locale,
                  cicOverview?.authenticated_user_contribution ?? 0
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
