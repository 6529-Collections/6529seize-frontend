import { ChartBarIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import type { CollectedCollectionType } from "@/entities/IProfile";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t as translate } from "@/i18n/messages";
import type { CollectedHeaderMetric } from "../types";

interface CollectedStatsHeaderProps {
  readonly metrics: CollectedHeaderMetric[];
  readonly activeCollection: CollectedCollectionType | null;
  readonly onCollectionShortcut?:
    | ((collection: CollectedCollectionType) => void)
    | undefined;
}

const METRIC_CLASSES =
  "tw-group tw-flex tw-items-baseline tw-gap-1 tw-rounded-md tw-border-0 tw-bg-transparent tw-p-0 tw-text-left focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500";

export function CollectedStatsHeader({
  metrics,
  activeCollection,
  onCollectionShortcut,
}: Readonly<CollectedStatsHeaderProps>) {
  return (
    <div className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-4 tw-gap-y-1 md:tw-gap-x-6">
      {metrics.map((metric) => {
        const collection = metric.collection;
        const isInteractive =
          collection !== undefined && onCollectionShortcut !== undefined;
        const isSelected =
          collection !== undefined && collection === activeCollection;
        const content = (
          <>
            <span
              className={`tw-text-sm tw-font-semibold tw-leading-5 ${isSelected ? "tw-text-white" : "tw-text-iron-100"}`}
            >
              {metric.val}
            </span>
            <span
              className={`tw-text-sm tw-font-normal tw-leading-5 ${isSelected ? "tw-text-iron-200" : "tw-text-iron-400 desktop-hover:group-hover:tw-text-iron-300"}`}
            >
              {metric.label}
            </span>
            {metric.sub && (
              <>
                <span aria-hidden="true" className="tw-text-iron-600">
                  ·
                </span>
                <span className="tw-text-sm tw-leading-5 tw-text-iron-500">
                  {metric.sub}
                </span>
              </>
            )}
          </>
        );
        return isInteractive ? (
          <button
            key={metric.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onCollectionShortcut(collection)}
            className={METRIC_CLASSES}
          >
            {content}
          </button>
        ) : (
          <div key={metric.id} className={METRIC_CLASSES}>
            {content}
          </div>
        );
      })}
    </div>
  );
}

export function CollectedStatsDetailsToggle({
  isDetailsOpen,
  detailsId,
  locale = DEFAULT_LOCALE,
  onToggleDetails,
}: {
  readonly isDetailsOpen: boolean;
  readonly detailsId: string;
  readonly locale?: SupportedLocale | undefined;
  readonly onToggleDetails: () => void;
}) {
  return (
    <button
      type="button"
      data-profile-action={isDetailsOpen ? "Hide details" : "Details"}
      aria-expanded={isDetailsOpen}
      aria-controls={detailsId}
      onClick={onToggleDetails}
      className="tw-flex tw-h-11 tw-w-full tw-items-center tw-gap-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-bg-transparent tw-px-3 tw-text-sm tw-font-medium tw-text-iron-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 desktop-hover:hover:tw-text-iron-100 md:tw-px-5"
    >
      <ChartBarIcon aria-hidden="true" className="tw-size-4 tw-text-iron-400" />
      <span>
        {translate(
          locale,
          isDetailsOpen
            ? "user.collected.stats.details.hide"
            : "user.collected.stats.details.show"
        )}
      </span>
      <ChevronDownIcon
        aria-hidden="true"
        className={`tw-ml-auto tw-size-4 tw-text-iron-400 tw-transition-transform tw-duration-200 ${isDetailsOpen ? "tw-rotate-180" : ""}`}
      />
    </button>
  );
}
