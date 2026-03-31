import { ChartBarIcon } from "@heroicons/react/24/outline";
import type { CollectedCollectionType } from "@/entities/IProfile";
import type { CollectedHeaderMetric } from "../types";

interface CollectedStatsHeaderProps {
  readonly metrics: CollectedHeaderMetric[];
  readonly activeCollection: CollectedCollectionType | null;
  readonly isDetailsOpen: boolean;
  readonly detailsId: string;
  readonly onToggleDetails: () => void;
  readonly onCollectionShortcut?:
    | ((collection: CollectedCollectionType) => void)
    | undefined;
}

export function CollectedStatsHeader({
  metrics,
  activeCollection,
  isDetailsOpen,
  detailsId,
  onToggleDetails,
  onCollectionShortcut,
}: Readonly<CollectedStatsHeaderProps>) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-4 md:tw-flex-row md:tw-items-start md:tw-justify-between">
      <div className="tw-min-w-0 tw-flex-1">
        {metrics.length > 0 && (
          <div className="tw-overflow-x-auto tw-overflow-y-hidden tw-pb-1 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300 md:tw-overflow-visible md:tw-pb-0">
            <div className="tw-flex tw-w-max tw-flex-nowrap tw-items-center tw-gap-4 md:tw-w-auto md:tw-flex-wrap md:tw-gap-6">
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
                        "tw-mb-0.5 tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-wider tw-text-iron-400",
                        labelToneClass,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {metric.label}
                    </span>
                    <div className="tw-flex tw-items-baseline tw-gap-1.5">
                      <span
                        className={[
                          "tw-text-[15px] tw-font-semibold tw-text-iron-100",
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
                            "tw-text-[10px] tw-font-medium tw-text-iron-500",
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
                    className="tw-flex tw-flex-none tw-items-center tw-gap-4 md:tw-gap-6"
                  >
                    {isInteractive ? (
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => onCollectionShortcut(metricCollection)}
                        className={[
                          "tw-group tw-flex tw-flex-col tw-rounded-lg tw-border tw-border-solid tw-px-2.5 tw-py-1.5 tw-text-left tw-transition-colors tw-duration-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500",
                          isSelected
                            ? "tw-border-iron-700 tw-bg-iron-950/80"
                            : "tw-border-transparent tw-bg-transparent hover:tw-border-iron-800 hover:tw-bg-iron-950/60",
                        ].join(" ")}
                      >
                        {metricContent}
                      </button>
                    ) : (
                      <div className="tw-flex tw-flex-col">{metricContent}</div>
                    )}
                    {index < metrics.length - 1 && (
                      <div className="tw-hidden tw-h-6 tw-w-px tw-bg-iron-800 sm:tw-block" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        aria-expanded={isDetailsOpen}
        aria-controls={detailsId}
        onClick={onToggleDetails}
        className={[
          "tw-group tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-transition-all tw-duration-300 tw-ease-out focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500",
          isDetailsOpen
            ? "tw-border-iron-200 tw-bg-iron-200 tw-text-iron-950"
            : "tw-border-iron-800 tw-bg-iron-950/60 tw-text-iron-200 hover:tw-border-iron-700 hover:tw-bg-iron-900",
        ].join(" ")}
      >
        <span className="-tw-ml-1 tw-inline-flex tw-h-3.5 tw-w-3.5 tw-flex-shrink-0">
          <ChartBarIcon className="tw-h-full tw-w-full" />
        </span>
        <span>{isDetailsOpen ? "Hide Details" : "Details"}</span>
      </button>
    </div>
  );
}
