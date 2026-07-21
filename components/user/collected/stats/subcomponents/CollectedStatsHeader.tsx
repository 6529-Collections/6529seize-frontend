import { ChartBarIcon } from "@heroicons/react/24/outline";
import type { CollectedCollectionType } from "@/entities/IProfile";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t as translate } from "@/i18n/messages";
import type { CollectedHeaderMetric } from "../types";

interface CollectedStatsHeaderProps {
  readonly metrics: CollectedHeaderMetric[];
  readonly activeCollection: CollectedCollectionType | null;
  readonly isDetailsOpen: boolean;
  readonly detailsId: string;
  readonly locale?: SupportedLocale | undefined;
  readonly onToggleDetails: () => void;
  readonly onCollectionShortcut?:
    | ((collection: CollectedCollectionType) => void)
    | undefined;
}

function getLastMetricSpanClass(index: number, metricCount: number): string {
  if (index !== metricCount - 1) {
    return "tw-col-span-1";
  }

  const mobileSpanClass =
    metricCount % 2 === 1 ? "tw-col-span-2" : "tw-col-span-1";
  let tabletSpanClass = "sm:tw-col-span-1";
  if (metricCount % 3 === 1) {
    tabletSpanClass = "sm:tw-col-span-3";
  } else if (metricCount % 3 === 2) {
    tabletSpanClass = "sm:tw-col-span-2";
  }

  return `${mobileSpanClass} ${tabletSpanClass} xl:tw-col-span-1`;
}

export function CollectedStatsHeader({
  metrics,
  activeCollection,
  isDetailsOpen,
  detailsId,
  locale = DEFAULT_LOCALE,
  onToggleDetails,
  onCollectionShortcut,
}: Readonly<CollectedStatsHeaderProps>) {
  const detailsLabel = translate(locale, "user.collected.stats.details.show");
  const hideDetailsLabel = translate(
    locale,
    "user.collected.stats.details.hide"
  );
  const detailsButtonLabel = isDetailsOpen ? hideDetailsLabel : detailsLabel;

  return (
    <div className="tw-flex tw-flex-col tw-gap-3 xl:tw-flex-row xl:tw-items-start xl:tw-justify-between">
      <div className="tw-min-w-0 tw-flex-1">
        {metrics.length > 0 && (
          <div className="tw-grid tw-grid-cols-2 tw-gap-px tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-800 sm:tw-grid-cols-3 xl:tw-grid-cols-5">
            {metrics.map((metric, index) => {
              const metricCollection = metric.collection;
              const isInteractive =
                metricCollection !== undefined &&
                onCollectionShortcut !== undefined;
              const isSelected =
                metricCollection !== undefined &&
                metricCollection === activeCollection;
              let labelToneClass: string | undefined;
              let valueToneClass: string | undefined;
              let subToneClass: string | undefined;

              if (isSelected) {
                labelToneClass = "tw-text-iron-300";
                valueToneClass = "tw-text-white";
                subToneClass = "tw-text-iron-400";
              } else if (isInteractive) {
                labelToneClass = "group-hover:tw-text-iron-300";
                valueToneClass = "group-hover:tw-text-white";
                subToneClass = "group-hover:tw-text-iron-400";
              }
              const metricContent = (
                <>
                  <span
                    className={[
                      "tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-wider tw-text-iron-400",
                      labelToneClass,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {metric.label}
                  </span>
                  <div className="tw-mt-1 tw-flex tw-min-w-0 tw-items-baseline tw-justify-between tw-gap-1.5">
                    <span
                      className={[
                        "tw-shrink-0 tw-text-[15px] tw-font-semibold tw-text-iron-100",
                        valueToneClass,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {metric.val}
                    </span>
                    {metric.sub && (
                      <span
                        className={[
                          "tw-min-w-0 tw-text-right tw-text-[10px] tw-font-medium tw-text-iron-500",
                          subToneClass,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {metric.sub}
                      </span>
                    )}
                  </div>
                </>
              );

              return (
                <div
                  key={metric.id}
                  className={`tw-min-w-0 tw-bg-black ${getLastMetricSpanClass(
                    index,
                    metrics.length
                  )}`}
                >
                  {isInteractive ? (
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => onCollectionShortcut(metricCollection)}
                      className={[
                        "tw-group tw-flex tw-h-full tw-w-full tw-min-w-0 tw-flex-col tw-border-0 tw-px-3 tw-py-2.5 tw-text-left tw-transition-colors tw-duration-200 focus-visible:tw-relative focus-visible:tw-z-10 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400",
                        isSelected
                          ? "tw-bg-iron-900"
                          : "tw-bg-black hover:tw-bg-iron-950",
                      ].join(" ")}
                    >
                      {metricContent}
                    </button>
                  ) : (
                    <div className="tw-flex tw-h-full tw-min-w-0 tw-flex-col tw-bg-black tw-px-3 tw-py-2.5">
                      {metricContent}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        aria-expanded={isDetailsOpen}
        aria-controls={detailsId}
        onClick={onToggleDetails}
        className={[
          "tw-group tw-inline-flex tw-min-h-11 tw-shrink-0 tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-transition-colors tw-duration-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 xl:tw-self-start",
          isDetailsOpen
            ? "tw-border-iron-200 tw-bg-iron-200 tw-text-iron-950"
            : "tw-border-iron-800 tw-bg-iron-950/60 tw-text-iron-200 hover:tw-border-iron-700 hover:tw-bg-iron-900",
        ].join(" ")}
      >
        <span className="-tw-ml-1 tw-inline-flex tw-h-3.5 tw-w-3.5 tw-flex-shrink-0">
          <ChartBarIcon aria-hidden="true" className="tw-h-full tw-w-full" />
        </span>
        <span>{detailsButtonLabel}</span>
      </button>
    </div>
  );
}
