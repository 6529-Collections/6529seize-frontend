import Image from "next/image";
import type { ApiRepCategory } from "@/generated/models/ApiRepCategory";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { ChevronDownIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { getContributorLabel, type RepDirection } from "./UserPageRep.helpers";

const CONTROL_CLASS =
  "tw-inline-flex tw-h-9 tw-min-w-0 tw-items-center tw-gap-2 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2 tw-text-left focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50";

export default function RepCategoryPill({
  category,
  canEdit,
  onEdit,
  onOpenContributors,
  compact = false,
  direction = "received",
  isOpen = false,
  panelId,
  disabled = false,
}: {
  readonly category: ApiRepCategory;
  readonly canEdit: boolean;
  readonly onEdit: (category: string) => void;
  readonly onOpenContributors: (category: ApiRepCategory) => void;
  readonly compact?: boolean;
  readonly direction?: RepDirection;
  readonly isOpen?: boolean;
  readonly panelId?: string;
  readonly disabled?: boolean;
}) {
  const locale = useBrowserLocale();
  const label = `${formatInteger(locale, category.contributor_count)} ${getContributorLabel(direction, category.contributor_count)}`;
  return (
    <div
      className={`tw-inline-flex tw-h-9 tw-min-w-0 tw-max-w-full tw-items-center tw-rounded-lg tw-transition-colors ${isOpen ? "tw-bg-iron-800" : "tw-bg-iron-900/70 hover:tw-bg-iron-800/80"}`}
    >
      <button
        type="button"
        onClick={() => onOpenContributors(category)}
        aria-label={t(locale, "rep.categories.panel.open", {
          category: category.category,
        })}
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        disabled={disabled}
        className={CONTROL_CLASS}
      >
        <span
          className={`tw-min-w-0 tw-truncate tw-text-sm tw-font-medium tw-text-iron-100 ${compact ? "tw-max-w-40" : "tw-max-w-60"}`}
        >
          {category.category}
        </span>
        <span className="tw-shrink-0 tw-text-sm tw-tabular-nums tw-text-iron-400">
          {formatInteger(locale, category.total_rep)}
        </span>
      </button>
      {canEdit && (
        <button
          type="button"
          onClick={() => onEdit(category.category)}
          aria-label={t(locale, "rep.categories.pill.editAriaLabel", {
            category: category.category,
          })}
          disabled={disabled}
          className={`${CONTROL_CLASS} tw-w-7 tw-shrink-0 tw-justify-center !tw-px-0 tw-text-iron-400 hover:tw-text-iron-100`}
        >
          <PencilSquareIcon className="tw-size-4" aria-hidden="true" />
        </button>
      )}
      <span
        className="tw-mx-1 tw-h-4 tw-w-px tw-shrink-0 tw-bg-iron-700/60"
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => onOpenContributors(category)}
        aria-label={t(locale, "rep.categories.panel.contributors", {
          category: category.category,
          count: label,
        })}
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        disabled={disabled}
        className={`${CONTROL_CLASS} tw-shrink-0 tw-gap-1.5 tw-text-xs tw-text-iron-400`}
      >
        <span className="tw-flex -tw-space-x-1.5" aria-hidden="true">
          {category.top_contributors.slice(0, compact ? 3 : 4).map((item) => (
            <span
              key={item.profile.id}
              className="tw-flex tw-size-5 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-full tw-bg-iron-700 tw-text-[10px]"
            >
              {item.profile.pfp ? (
                <Image
                  unoptimized
                  width={24}
                  height={24}
                  src={getScaledImageUri(
                    item.profile.pfp,
                    ImageScale.W_AUTO_H_50
                  )}
                  alt=""
                  className="tw-size-full tw-object-cover"
                />
              ) : (
                (item.profile.handle ?? "?").charAt(0).toUpperCase()
              )}
            </span>
          ))}
        </span>
        <span className="tw-whitespace-nowrap">{label}</span>
        <ChevronDownIcon
          aria-hidden="true"
          className={`tw-size-3 tw-shrink-0 tw-transition-transform motion-reduce:tw-transition-none ${isOpen ? "tw-rotate-180" : ""}`}
        />
      </button>
    </div>
  );
}
