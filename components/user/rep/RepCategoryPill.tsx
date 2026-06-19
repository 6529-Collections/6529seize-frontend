import type { ApiRepCategory } from "@/generated/models/ApiRepCategory";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { useMemo } from "react";
import OverlappingAvatars from "@/components/common/OverlappingAvatars";
import { getContributorLabel, type RepDirection } from "./UserPageRep.helpers";
import { PencilSquareIcon } from "@heroicons/react/24/outline";

export default function RepCategoryPill({
  category,
  canEdit,
  onEdit,
  onOpenGlobalCategory,
  onOpenContributors,
  compact = false,
  direction = "received",
}: {
  readonly category: ApiRepCategory;
  readonly canEdit: boolean;
  readonly onEdit: (category: string) => void;
  readonly onOpenGlobalCategory: (category: string) => void;
  readonly onOpenContributors?:
    | ((category: ApiRepCategory) => void)
    | undefined;
  readonly compact?: boolean;
  readonly direction?: RepDirection;
}) {
  const paddingClass = compact ? "tw-px-3 tw-py-2" : "tw-px-4 tw-py-2.5";
  const layoutClass = compact
    ? "tw-inline-flex tw-flex-wrap tw-items-center tw-gap-x-2.5 tw-gap-y-1.5"
    : "tw-inline-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2";

  const avatarItems = useMemo(
    () =>
      category.top_contributors.map((c) => ({
        key: c.profile.handle ?? c.profile.primary_address,
        pfpUrl: c.profile.pfp ?? null,
        href: `/${c.profile.handle ?? c.profile.primary_address}`,
        ariaLabel: c.profile.handle ?? c.profile.primary_address,
        fallback: c.profile.handle
          ? c.profile.handle.charAt(0).toUpperCase()
          : "?",
        title: c.profile.handle ?? c.profile.primary_address,
        tooltipContent: (
          <span>
            {c.profile.handle ?? c.profile.primary_address} &middot;{" "}
            {formatNumberWithCommas(c.contribution)}
          </span>
        ),
      })),
    [category.top_contributors]
  );

  const contributorText = `${formatNumberWithCommas(
    category.contributor_count
  )} ${getContributorLabel(direction, category.contributor_count)}`;
  const canOpenContributors =
    category.contributor_count > 0 && !!onOpenContributors;
  const openGlobalAriaLabel = t(
    DEFAULT_LOCALE,
    "rep.categories.pill.openGlobalAriaLabel",
    {
      category: category.category,
    }
  );
  const editAriaLabel = t(DEFAULT_LOCALE, "rep.categories.pill.editAriaLabel", {
    category: category.category,
  });
  const detailClasses =
    "tw-inline-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-2.5 tw-gap-y-1.5";
  const contributorButtonClasses = compact
    ? "tw-cursor-pointer tw-whitespace-nowrap tw-border-none tw-bg-transparent tw-p-0 tw-text-xs tw-font-medium tw-text-iron-400 tw-underline tw-decoration-white/20 tw-underline-offset-4 tw-transition-colors hover:tw-text-iron-200"
    : "tw-cursor-pointer tw-whitespace-nowrap tw-border-none tw-bg-transparent tw-p-0 tw-text-xs tw-font-medium tw-text-iron-400 tw-underline tw-decoration-white/10 tw-underline-offset-4 tw-transition-[text-decoration-color] tw-transition-colors hover:tw-text-iron-200 hover:tw-decoration-white/50";

  const details = (
    <>
      <span className="tw-inline-flex tw-items-center tw-gap-1.5">
        <span className="tw-whitespace-nowrap tw-text-left tw-text-sm tw-font-medium tw-text-white">
          {category.category}
        </span>
        <span className="tw-text-sm tw-font-medium tw-text-iron-400 tw-transition-colors group-hover:tw-text-iron-300">
          {formatNumberWithCommas(category.total_rep)}
        </span>
      </span>
      {category.authenticated_user_contribution !== null &&
        category.authenticated_user_contribution !== 0 && (
          <>
            <span className="tw-text-xs tw-text-white/20">&middot;</span>
            <span className="tw-whitespace-nowrap tw-text-xs tw-font-medium tw-text-iron-400">
              {direction === "given" ? "Assigned To You:" : "You Assigned:"}{" "}
              <span className="tw-font-medium tw-text-primary-400">
                {category.authenticated_user_contribution > 0 && "+"}
                {formatNumberWithCommas(
                  category.authenticated_user_contribution
                )}
              </span>
            </span>
          </>
        )}
    </>
  );

  const baseClasses = `group ${layoutClass} tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-[#18191B] tw-transition-all tw-duration-300 tw-ease-out ${paddingClass}`;

  return (
    <div
      className={`${baseClasses} hover:tw-border-white/20 hover:tw-bg-white/10 hover:tw-shadow-md`}
    >
      <div className="tw-inline-flex tw-min-w-0 tw-items-center tw-gap-2">
        <button
          type="button"
          onClick={() => onOpenGlobalCategory(category.category)}
          aria-label={openGlobalAriaLabel}
          className={`${detailClasses} tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-left`}
        >
          {details}
        </button>
        {canEdit && (
          <button
            type="button"
            onClick={() => onEdit(category.category)}
            aria-label={editAriaLabel}
            className="tw-inline-flex tw-h-7 tw-w-7 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.03] tw-p-0 tw-text-iron-400 tw-transition-colors hover:tw-border-white/20 hover:tw-bg-white/[0.07] hover:tw-text-white"
          >
            <PencilSquareIcon className="tw-h-4 tw-w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="tw-inline-flex tw-items-center tw-gap-1.5">
        {avatarItems.length > 0 && (
          <OverlappingAvatars items={avatarItems} size="sm" maxCount={5} />
        )}
        {canOpenContributors ? (
          <button
            type="button"
            onClick={() => onOpenContributors(category)}
            aria-label={`View all ${getContributorLabel(
              direction,
              category.contributor_count
            )} for ${category.category}`}
            className={contributorButtonClasses}
          >
            {contributorText}
          </button>
        ) : (
          <span className="tw-whitespace-nowrap tw-text-xs tw-font-medium tw-text-iron-400">
            {contributorText}
          </span>
        )}
      </div>
    </div>
  );
}
