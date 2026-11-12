import clsx from "clsx";
import OverlappingAvatars from "@/components/common/OverlappingAvatars";
import type { ApiRepCategory } from "@/generated/models/ApiRepCategory";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
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
}: {
  readonly category: ApiRepCategory;
  readonly onOpenContributors: (category: ApiRepCategory) => void;
  readonly compact?: boolean;
  readonly direction?: RepDirection;
  readonly isOpen?: boolean;
  readonly isJoined?: boolean;
  readonly panelId?: string;
  readonly disabled?: boolean;
}) {
  const locale = useBrowserLocale();
  const avatarCount = 3;
  const avatars = buildRepAvatarItems(category.top_contributors, avatarCount, {
    omitHref: true,
  });
  const label = `${formatInteger(locale, category.contributor_count)} ${getContributorLabel(direction, category.contributor_count)}`;
  return (
    <button
      type="button"
      data-rep-tag={category.category}
      onClick={() => onOpenContributors(category)}
      aria-label={t(locale, "rep.categories.panel.open", {
        category: category.category,
      })}
      aria-expanded={isOpen}
      aria-controls={isOpen ? panelId : undefined}
      disabled={disabled}
      className={clsx(
        "tw-group/rep-category tw-relative tw-inline-flex tw-min-w-0 tw-max-w-full tw-items-center tw-gap-2.5 tw-rounded-lg tw-border-0 tw-pl-3.5 tw-pr-3 tw-text-left tw-transition-colors tw-duration-200 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50",
        compact ? "tw-h-11" : "tw-h-10",
        isOpen
          ? "tw-bg-iron-900"
          : "tw-bg-white/5 tw-shadow-[0_1px_2px_rgba(0,0,0,0.25)] desktop-hover:hover:tw-bg-white/[0.08]",
        isJoined && !compact && "tw-rounded-b-none"
      )}
    >
      <span className="tw-inline-flex tw-min-w-0 tw-items-center tw-gap-2">
        <span
          className={`tw-min-w-0 tw-truncate tw-text-sm tw-font-medium tw-text-white ${compact ? "tw-max-w-40" : "tw-max-w-60"}`}
        >
          {category.category}
        </span>
        <span className="tw-shrink-0 tw-text-sm tw-font-medium tw-text-iron-400 tw-transition-colors desktop-hover:group-hover/rep-category:tw-text-iron-300">
          {formatInteger(locale, category.total_rep)}
        </span>
      </span>
      <span
        className="tw-mx-0.5 tw-h-4 tw-w-px tw-shrink-0 tw-bg-iron-700/60"
        aria-hidden="true"
      />
      <span className="tw-inline-flex tw-shrink-0 tw-items-center tw-gap-1.5">
        {avatars.length > 0 && (
          <OverlappingAvatars
            items={avatars}
            size="sm"
            maxCount={avatarCount}
          />
        )}
        <span className="tw-inline-flex tw-shrink-0 tw-items-center tw-gap-1.5 tw-text-xs tw-text-iron-400">
          <span className="-tw-ml-0.5 tw-whitespace-nowrap tw-font-medium">
            {label}
          </span>
          <ChevronDownIcon
            aria-hidden="true"
            className={`tw-size-3 tw-shrink-0 tw-transition-transform motion-reduce:tw-transition-none ${isOpen ? "tw-rotate-180 tw-text-primary-400" : ""}`}
          />
        </span>
      </span>
    </button>
  );
}
