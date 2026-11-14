import clsx from "clsx";
import OverlappingAvatars from "@/components/common/OverlappingAvatars";
import type { ApiRepCategory } from "@/generated/models/ApiRepCategory";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t, tRich } from "@/i18n/messages";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useId } from "react";
import { buildRepAvatarItems } from "./buildRepAvatarItems";
import { getContributorLabel, type RepDirection } from "./UserPageRep.helpers";

export default function RepCategoryPill({
  category,
  onOpenContributors,
  compact = false,
  direction = "received",
  isOpen = false,
  isJoined = false,
  panelId,
  disabled = false,
  showPersonalContribution = false,
  linkAvatars = false,
}: {
  readonly category: ApiRepCategory;
  readonly onOpenContributors: (category: ApiRepCategory) => void;
  readonly compact?: boolean;
  readonly direction?: RepDirection;
  readonly isOpen?: boolean;
  readonly isJoined?: boolean;
  readonly panelId?: string;
  readonly disabled?: boolean;
  readonly showPersonalContribution?: boolean;
  readonly linkAvatars?: boolean;
}) {
  const locale = useBrowserLocale();
  const contributionId = useId();
  const contribution = category.authenticated_user_contribution;
  const hasContribution =
    showPersonalContribution && contribution !== null && contribution !== 0;
  const compactHeightClass = hasContribution
    ? "tw-flex-wrap tw-gap-y-1 tw-py-2"
    : "tw-h-[46px]";
  const avatarCount = 3;
  const avatars = buildRepAvatarItems(category.top_contributors, avatarCount, {
    omitHref: !linkAvatars || disabled,
  });
  const label = `${formatInteger(locale, category.contributor_count)} ${getContributorLabel(direction, category.contributor_count)}`;
  return (
    <span
      data-rep-tag={category.category}
      className={clsx(
        "tw-group/rep-category tw-pointer-events-none tw-relative tw-inline-flex tw-min-w-0 tw-max-w-full tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-pl-[13px] tw-pr-[9px] tw-text-left tw-transition-colors tw-duration-200 tw-ease-out motion-reduce:tw-transition-none [&_a]:tw-pointer-events-auto",
        disabled ? "tw-opacity-50" : "desktop-hover:hover:tw-border-white/10",
        compact
          ? `tw-min-h-[46px] tw-w-full tw-gap-x-1.5 tw-@container ${compactHeightClass}`
          : "tw-h-[38px] tw-gap-3.5",
        isOpen ? "tw-bg-[#17171B]" : "tw-bg-white/5",
        !disabled && !isOpen && "desktop-hover:hover:tw-bg-white/[0.085]",
        isJoined &&
          !compact &&
          "tw-rounded-b-none tw-border-b-transparent desktop-hover:hover:tw-border-b-transparent"
      )}
    >
      {/* Keep profile links beside the full-tag button, never nested inside it. */}
      <button
        type="button"
        onClick={() => onOpenContributors(category)}
        aria-label={t(locale, "rep.categories.panel.open", {
          category: category.category,
        })}
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        aria-describedby={hasContribution ? contributionId : undefined}
        disabled={disabled}
        className="tw-pointer-events-auto tw-absolute -tw-inset-px tw-cursor-pointer tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed"
      />
      <span
        className={clsx(
          "tw-inline-flex tw-min-w-0 tw-items-center tw-gap-2",
          compact && "tw-flex-1 @[32rem]:tw-flex-initial"
        )}
      >
        <span
          className={`tw-min-w-0 tw-truncate tw-text-sm tw-font-medium tw-text-iron-100 ${compact ? "" : "tw-max-w-60"}`}
        >
          {category.category}
        </span>
        <span className="tw-shrink-0 tw-text-sm tw-font-medium tw-text-iron-400 tw-transition-colors desktop-hover:group-hover/rep-category:tw-text-iron-300">
          {formatInteger(locale, category.total_rep)}
        </span>
      </span>
      {hasContribution && (
        <span
          id={contributionId}
          className={clsx(
            "tw-inline-flex tw-shrink-0 tw-items-center tw-gap-1.5 tw-whitespace-nowrap tw-text-xs tw-leading-4 tw-text-iron-400",
            compact &&
              "tw-order-2 tw-basis-full @[32rem]:tw-order-none @[32rem]:tw-basis-auto"
          )}
        >
          <span aria-hidden="true" className="tw-text-white/20">
            ·
          </span>
          <span>
            {tRich(
              locale,
              direction === "given"
                ? "user.profile.rep.rep.assignedToYou"
                : "user.profile.rep.rep.youAssigned",
              {
                value: (
                  <span key="value" className="tw-font-medium tw-text-iron-100">
                    {formatInteger(locale, contribution)}
                  </span>
                ),
              }
            )}
          </span>
        </span>
      )}
      <span
        className={clsx(
          "tw-inline-flex tw-shrink-0 tw-items-center tw-gap-1.5",
          compact && "tw-order-1 @[32rem]:tw-ml-auto"
        )}
      >
        {avatars.length > 0 && (
          <OverlappingAvatars
            items={avatars}
            size="sm"
            overlapClass="-tw-space-x-1.5"
            ringClassName="tw-ring-[#0d0d10]"
            maxCount={avatarCount}
          />
        )}
        <span className="tw-inline-flex tw-shrink-0 tw-items-center tw-gap-1.5 tw-text-xs tw-text-iron-400">
          <span className="-tw-ml-0.5 tw-whitespace-nowrap tw-font-medium">
            {label}
          </span>
          <ChevronDownIcon
            aria-hidden="true"
            className={`tw-size-[13px] tw-shrink-0 tw-transition-transform motion-reduce:tw-transition-none ${isOpen ? "tw-rotate-180 tw-text-iron-100" : "tw-text-iron-600 desktop-hover:group-hover/rep-category:tw-text-iron-400"}`}
          />
        </span>
      </span>
    </span>
  );
}
