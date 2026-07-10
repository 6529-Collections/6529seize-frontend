"use client";

import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import type { ProfileActivityLogRatingEdit } from "@/entities/IProfile";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { ApiWaveRepContributor } from "@/generated/models/ApiWaveRepContributor";
import { formatAddress, getTimeAgo } from "@/helpers/Helpers";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

const WAVE_REP_DETAILS_LOCALE = DEFAULT_LOCALE;
const CHANGE_REASON_MESSAGE_KEYS: Record<string, MessageKey> = {
  LOST_TDH: "waves.rep.details.activity.reason.lostTdh",
};

export function detailText(
  key: MessageKey,
  params: Record<string, string | number> = {}
): string {
  return t(WAVE_REP_DETAILS_LOCALE, key, params);
}

function formatRepNumber(value: number): string {
  return formatInteger(WAVE_REP_DETAILS_LOCALE, value);
}

export function formatSignedRep(value: number): string {
  const formatted = formatRepNumber(value);
  return value > 0
    ? detailText("waves.rep.details.rep.positive", { value: formatted })
    : formatted;
}

export function getContributorCountLabel(count: number): string {
  return detailText(
    count === 1
      ? "waves.rep.details.summary.contributors.one"
      : "waves.rep.details.summary.contributors.other",
    { count: formatInteger(WAVE_REP_DETAILS_LOCALE, count) }
  );
}

export function getRepTextClass(value: number): string {
  if (value > 0) {
    return "tw-text-emerald-400";
  }
  if (value < 0) {
    return "tw-text-rose-400";
  }
  return "tw-text-iron-300";
}

function getProfileDisplay(profile: ApiProfileMin): string {
  const handle = profile.handle?.trim() ?? "";
  if (handle.length > 0) {
    return handle;
  }
  return formatAddress(profile.primary_address);
}

function getProfileHref(profile: ApiProfileMin): string {
  const handle = profile.handle?.trim() ?? "";
  const routeValue = handle.length > 0 ? handle : profile.primary_address;
  return `/${encodeURIComponent(routeValue.toLowerCase())}`;
}

function getFallbackInitial(display: string): string {
  return display.trim().charAt(0).toUpperCase() || "?";
}

function normalizeOptionalHandle(handle: string | null | undefined): string {
  return handle?.trim() ?? "";
}

function getVisibleReason(reason: string | null | undefined): string | null {
  const normalizedReason = reason?.trim();
  if (!normalizedReason) {
    return null;
  }
  const machineReason = normalizedReason.toUpperCase().replace(/\s+/g, "_");
  if (machineReason === "USER_EDIT") {
    return null;
  }
  const reasonMessageKey = CHANGE_REASON_MESSAGE_KEYS[machineReason];
  if (reasonMessageKey) {
    return detailText(reasonMessageKey);
  }
  return detailText("waves.rep.details.activity.reason.unknown", {
    reason: normalizedReason,
  });
}

function getCreatedAtLabel(createdAt: Date): string {
  const timestamp = new Date(createdAt).getTime();
  if (Number.isNaN(timestamp)) {
    return "";
  }
  return getTimeAgo(timestamp);
}

export function SummaryStat({
  label,
  value,
  toneClassName = "tw-text-white",
}: {
  readonly label: string;
  readonly value: string;
  readonly toneClassName?: string | undefined;
}) {
  return (
    <div className="tw-min-w-0 tw-bg-iron-950 tw-px-2 tw-py-2">
      <p className="tw-mb-0.5 tw-text-[0.5625rem] tw-font-semibold tw-uppercase tw-tracking-[0.1em] tw-text-iron-500">
        {label}
      </p>
      <p
        title={value}
        className={`tw-mb-0 tw-whitespace-nowrap tw-text-[0.8125rem] tw-font-semibold tw-tabular-nums ${toneClassName}`}
      >
        {value}
      </p>
    </div>
  );
}

export function CategoryRow({
  label,
  totalRep,
  contributorCount,
  selected,
  ariaLabel,
  onClick,
}: {
  readonly label: string;
  readonly totalRep: number;
  readonly contributorCount: number;
  readonly selected: boolean;
  readonly ariaLabel: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={selected}
      title={label}
      onClick={onClick}
      className={`tw-relative tw-grid tw-min-h-11 tw-w-full tw-cursor-pointer tw-grid-cols-[minmax(0,1fr)_auto] tw-items-center tw-gap-3 tw-border-0 tw-px-2.5 tw-py-2 tw-text-left tw-transition before:tw-pointer-events-none before:tw-absolute before:tw-inset-y-0 before:tw-left-0 before:tw-w-0.5 before:tw-content-[''] focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 ${
        selected
          ? "tw-bg-white/[0.035] before:tw-bg-primary-400"
          : "tw-bg-transparent before:tw-bg-transparent hover:tw-bg-white/[0.025]"
      }`}
    >
      <span className="tw-min-w-0">
        <span className="tw-block tw-break-words tw-text-xs tw-font-semibold tw-leading-4 tw-text-iron-100">
          {label}
        </span>
        <span className="tw-mt-0.5 tw-block tw-text-[0.6875rem] tw-font-medium tw-leading-4 tw-text-iron-500">
          {getContributorCountLabel(contributorCount)}
        </span>
      </span>
      <span
        className={`tw-whitespace-nowrap tw-text-xs tw-font-semibold tw-tabular-nums ${getRepTextClass(
          totalRep
        )}`}
      >
        {formatSignedRep(totalRep)}
      </span>
    </button>
  );
}

export function CategorySearch({
  value,
  onChange,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <div className="tw-relative">
      <MagnifyingGlassIcon
        aria-hidden="true"
        className="tw-pointer-events-none tw-absolute tw-left-3 tw-top-1/2 tw-size-4 tw--translate-y-1/2 tw-text-iron-500"
      />
      <input
        type="search"
        aria-label={detailText("waves.rep.details.categories.searchAriaLabel")}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={detailText(
          "waves.rep.details.categories.searchPlaceholder"
        )}
        className="tw-w-full tw-rounded-md tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.015] tw-py-2 tw-pl-9 tw-pr-3 tw-text-sm tw-font-medium tw-text-iron-100 tw-outline-none tw-transition placeholder:tw-text-iron-500 focus:tw-border-primary-400 focus:tw-ring-1 focus:tw-ring-primary-400/30"
      />
    </div>
  );
}

export function ContributorRow({
  contributor,
}: {
  readonly contributor: ApiWaveRepContributor;
}) {
  const display = getProfileDisplay(contributor.profile);
  const contributionClass = getRepTextClass(contributor.contribution);

  return (
    <Link
      href={getProfileHref(contributor.profile)}
      className="tw-flex tw-min-w-0 tw-items-center tw-justify-between tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/5 tw-px-1 tw-py-2.5 tw-no-underline tw-transition hover:tw-bg-white/[0.025] focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400"
    >
      <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-3">
        <ProfileAvatar
          pfpUrl={contributor.profile.pfp}
          size={ProfileBadgeSize.COMPACT}
          alt={detailText("waves.rep.details.profileAvatarAlt", {
            profile: display,
          })}
          fallbackContent={
            <span className="tw-text-[0.6875rem] tw-font-semibold tw-text-iron-300">
              {getFallbackInitial(display)}
            </span>
          }
        />
        <p className="tw-mb-0 tw-min-w-0 tw-truncate tw-text-sm tw-font-medium tw-text-white">
          {display}
        </p>
      </div>
      <span
        className={`tw-flex-shrink-0 tw-text-sm tw-font-semibold ${contributionClass}`}
      >
        {formatSignedRep(contributor.contribution)}
      </span>
    </Link>
  );
}

export function LogRow({
  log,
}: {
  readonly log: ProfileActivityLogRatingEdit;
}) {
  const change = log.contents.new_rating - log.contents.old_rating;
  const changeClass = getRepTextClass(change);
  const oldRatingClass = getRepTextClass(log.contents.old_rating);
  const newRatingClass = getRepTextClass(log.contents.new_rating);
  const raterHandle = normalizeOptionalHandle(log.profile_handle);
  const rater =
    raterHandle || detailText("waves.rep.details.activity.unknownRater");
  const raterHref = raterHandle
    ? `/${encodeURIComponent(raterHandle.toLowerCase())}`
    : null;
  const createdAtLabel = getCreatedAtLabel(log.created_at);
  const visibleReason = getVisibleReason(log.contents.change_reason);

  return (
    <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/5 tw-px-1 tw-py-2.5">
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
        <div className="tw-min-w-0">
          {raterHref ? (
            <Link
              href={raterHref}
              className="tw-block tw-truncate tw-text-sm tw-font-semibold tw-text-white tw-no-underline hover:tw-text-iron-300"
            >
              {rater}
            </Link>
          ) : (
            <span className="tw-block tw-truncate tw-text-sm tw-font-semibold tw-text-iron-400">
              {rater}
            </span>
          )}
          <p className="tw-mb-0 tw-mt-1 tw-flex tw-flex-wrap tw-gap-x-2 tw-gap-y-1 tw-text-xs tw-text-iron-400">
            <span className={oldRatingClass}>
              {formatSignedRep(log.contents.old_rating)}
            </span>
            <span aria-hidden="true">-&gt;</span>
            <span className={newRatingClass}>
              {formatSignedRep(log.contents.new_rating)}
            </span>
            <span className={changeClass}>({formatSignedRep(change)})</span>
            {log.contents.rating_category && (
              <span>{log.contents.rating_category}</span>
            )}
          </p>
        </div>
        {createdAtLabel && (
          <span className="tw-flex-shrink-0 tw-whitespace-nowrap tw-text-xs tw-font-medium tw-text-iron-500">
            {createdAtLabel}
          </span>
        )}
      </div>
      {visibleReason && (
        <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-text-iron-500">
          {visibleReason}
        </p>
      )}
    </div>
  );
}
