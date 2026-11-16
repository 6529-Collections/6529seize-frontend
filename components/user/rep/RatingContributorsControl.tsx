import OverlappingAvatars from "@/components/common/OverlappingAvatars";
import type { ApiRepContributor } from "@/generated/models/ApiRepContributor";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import { useMemo } from "react";
import { buildRepAvatarItems } from "./buildRepAvatarItems";
import type { RepDirection } from "./UserPageRep.helpers";

export default function RatingContributorsControl({
  overview,
  direction,
  matter,
  canManage,
  onClick,
  compact = false,
}: {
  readonly overview: {
    readonly contributor_count: number;
    readonly contributors: { readonly data: readonly ApiRepContributor[] };
  } | null;
  readonly direction: RepDirection;
  readonly matter: "REP" | "NIC";
  readonly canManage: boolean;
  readonly onClick: () => void;
  readonly compact?: boolean;
}) {
  const locale = useBrowserLocale();
  const maxCount = compact ? 3 : 5;
  const avatars = useMemo(
    () => buildRepAvatarItems(overview?.contributors.data ?? [], maxCount),
    [overview?.contributors.data, maxCount]
  );
  if (!overview) return null;

  const count = formatInteger(locale, overview.contributor_count);
  const plural = new Intl.PluralRules(locale).select(
    overview.contributor_count
  );
  const suffix = plural === "one" ? "one" : "other";
  const countKey = direction === "given" ? "receivers" : "raters";
  const viewKey = direction === "given" ? "viewReceivers" : "viewRaters";
  const countLabel = t(
    locale,
    `user.profile.rep.contributors.${countKey}.${suffix}`,
    { count }
  );
  const avatarGroup = avatars.length > 0 && (
    <OverlappingAvatars items={avatars} size="sm" maxCount={maxCount} />
  );
  const content = (
    <span className="tw-text-xs tw-font-medium">{countLabel}</span>
  );
  if (matter === "REP" && overview.contributor_count <= 0) {
    return (
      <span className="tw-flex tw-min-h-11 tw-items-center tw-text-iron-400">
        {content}
      </span>
    );
  }
  let accessibleName = t(
    locale,
    `user.profile.rep.contributors.${viewKey}.${suffix}`,
    { count }
  );
  if (canManage) {
    accessibleName = t(locale, "user.rate.manageRatingContributors", {
      matter,
      count,
    });
  } else if (matter === "NIC") {
    accessibleName = t(locale, "user.rate.viewRatingContributors", {
      matter,
      direction: t(locale, `user.rate.${direction}`),
      contributors: countLabel,
    });
  }
  const buttonClassName =
    "tw-group tw-flex tw-min-h-11 tw-min-w-0 tw-cursor-pointer tw-items-center tw-gap-2 tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-text-iron-300 tw-transition-colors tw-duration-200 hover:tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none";
  const chevron = (
    <ChevronRightIcon
      aria-hidden="true"
      className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-500 tw-transition-colors group-hover:tw-text-iron-300 motion-reduce:tw-transition-none"
    />
  );
  return (
    <div className="tw-flex tw-min-h-11 tw-min-w-0 tw-items-center tw-gap-2">
      {avatarGroup}
      <button
        type="button"
        aria-label={accessibleName}
        aria-haspopup="dialog"
        onClick={onClick}
        className={buttonClassName}
      >
        {content}
        {chevron}
      </button>
    </div>
  );
}
