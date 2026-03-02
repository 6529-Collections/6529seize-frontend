import type { ApiRepCategory } from "@/generated/models/ApiRepCategory";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import type { MouseEvent } from "react";
import { useMemo } from "react";
import OverlappingAvatars from "@/components/common/OverlappingAvatars";
import { getContributorLabel, type RepDirection } from "./UserPageRep.helpers";

const stopPropagation = (e: MouseEvent) => e.stopPropagation();

export default function RepCategoryPill({
  category,
  canEdit,
  onEdit,
  compact = false,
  direction = "received",
}: {
  readonly category: ApiRepCategory;
  readonly canEdit: boolean;
  readonly onEdit: (category: string) => void;
  readonly compact?: boolean;
  readonly direction?: RepDirection;
}) {
  const paddingClass = compact ? "tw-px-3 tw-py-2" : "tw-px-4 tw-py-2.5";

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

  const content = (
    <>
      <span className="tw-inline-flex tw-items-center tw-gap-1.5">
        <span className="tw-text-left tw-text-sm tw-font-medium tw-text-white">
          {category.category}
        </span>
        <span className="tw-text-sm tw-font-medium tw-text-iron-400 tw-transition-colors group-hover:tw-text-iron-300">
          {formatNumberWithCommas(category.total_rep)}
        </span>
      </span>
      <span className="tw-text-xs tw-text-white/20">&middot;</span>
      <span className="tw-inline-flex tw-items-center tw-gap-1.5">
        {avatarItems.length > 0 && (
          <span
            role="presentation"
            className="tw-pointer-events-none desktop-hover:tw-pointer-events-auto"
            onClick={stopPropagation}
          >
            <OverlappingAvatars
              items={avatarItems}
              size="sm"
              maxCount={5}
              onItemClick={(e) => stopPropagation(e)}
            />
          </span>
        )}
        <span className="tw-whitespace-nowrap tw-text-xs tw-font-medium tw-text-iron-400">
          {formatNumberWithCommas(category.contributor_count)}{" "}
          {getContributorLabel(direction, category.contributor_count)}
        </span>
      </span>
      {!!category.authenticated_user_contribution && (
        <>
          <span className="tw-text-xs tw-text-white/20">&middot;</span>
          <span className="tw-whitespace-nowrap tw-text-xs tw-font-medium tw-text-iron-400">
            {direction === "given" ? "To Me:" : "My Rate:"}{" "}
            <span className="tw-font-medium tw-text-primary-400">
              {formatNumberWithCommas(category.authenticated_user_contribution)}
            </span>
          </span>
        </>
      )}
    </>
  );

  const baseClasses = `group tw-inline-flex tw-items-center tw-gap-2.5 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/5 tw-backdrop-blur-md tw-transition-all tw-duration-300 tw-ease-out ${paddingClass}`;

  if (canEdit) {
    return (
      <button
        type="button"
        onClick={() => onEdit(category.category)}
        className={`${baseClasses} tw-cursor-pointer hover:tw-border-white/20 hover:tw-bg-white/10 hover:tw-shadow-md`}
      >
        {content}
      </button>
    );
  }

  return <div className={`${baseClasses} tw-cursor-default`}>{content}</div>;
}
