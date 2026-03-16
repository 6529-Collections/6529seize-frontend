"use client";

import { useCallback, useId, useRef, useSyncExternalStore } from "react";
import clsx from "clsx";
import { Tooltip } from "react-tooltip";
import type {
  UserPageBrainActivityCell,
  UserPageBrainActivityViewModel,
} from "./userPageBrainActivity.helpers";

type ViewportMetrics = Readonly<{
  scrollLeft: number;
  clientWidth: number;
  scrollWidth: number;
}>;

const CELL_SIZE_PX = 14;
const CELL_GAP_PX = 2;
const DAY_LABEL_COLUMN_WIDTH_PX = 30;
const MONTH_LABEL_ROW_HEIGHT_PX = 16;
const HEADER_TO_HEATMAP_GAP_PX = 12;
const DAY_LABEL_EXTRA_OFFSET_PX = 2;
const DAY_LABEL_TOP_OFFSET_PX =
  MONTH_LABEL_ROW_HEIGHT_PX +
  HEADER_TO_HEATMAP_GAP_PX +
  DAY_LABEL_EXTRA_OFFSET_PX;
const COLUMN_STRIDE_PX = CELL_SIZE_PX + CELL_GAP_PX;
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const TOOLTIP_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const TOOLTIP_STYLE = {
  padding: "0",
  background: "transparent",
  boxShadow: "none",
  zIndex: 99999,
  pointerEvents: "none",
} as const;
const EMPTY_VIEWPORT_METRICS: ViewportMetrics = {
  scrollLeft: 0,
  clientWidth: 0,
  scrollWidth: 0,
};

function getHeatmapWidthPx(weekCount: number): number {
  if (weekCount <= 0) {
    return 0;
  }

  return weekCount * CELL_SIZE_PX + (weekCount - 1) * CELL_GAP_PX;
}

function getTooltipCountLabel(count: number): string {
  if (count <= 0) {
    return "No posts";
  }

  return count === 1 ? "1 post" : `${count} posts`;
}

function getCellFrameClassName(cell: UserPageBrainActivityCell): string {
  if (cell.state === "padding") {
    return "tw-bg-transparent";
  }

  return clsx(
    "tw-flex tw-items-center tw-justify-center tw-rounded-[4px] tw-transition-colors tw-duration-200",
    cell.ariaLabel &&
      "tw-cursor-pointer desktop-hover:hover:tw-z-20 desktop-hover:hover:tw-bg-[#171b21]"
  );
}

function getCellNodeClassName(
  cell: UserPageBrainActivityCell,
  variant: "grid" | "tooltip" = "grid"
): string {
  const baseClassName =
    variant === "grid"
      ? "tw-transition-all tw-duration-200 tw-ease-out tw-transform-gpu"
      : "";

  if (cell.state === "empty") {
    return clsx(
      baseClassName,
      variant === "grid"
        ? "tw-h-[4px] tw-w-[4px] tw-rounded-[2px] tw-bg-[#1d2229] desktop-hover:group-hover/cell:tw-bg-[#272d35]"
        : "tw-h-[4px] tw-w-[4px] tw-rounded-[2px] tw-bg-iron-500/55"
    );
  }

  switch (cell.intensity) {
    case 4:
      return clsx(
        baseClassName,
        variant === "grid"
          ? "tw-h-[11px] tw-w-[11px] tw-rounded-[1px] tw-bg-[#34d399] tw-shadow-[0_0_10px_rgba(52,211,153,0.22)] desktop-hover:group-hover/cell:tw-scale-105 desktop-hover:group-hover/cell:tw-brightness-105"
          : "tw-h-[8px] tw-w-[8px] tw-rounded-[1px] tw-bg-[#34d399]"
      );
    case 3:
      return clsx(
        baseClassName,
        variant === "grid"
          ? "tw-h-[9px] tw-w-[9px] tw-rounded-[2px] tw-bg-[#059669] desktop-hover:group-hover/cell:tw-scale-105 desktop-hover:group-hover/cell:tw-brightness-105"
          : "tw-h-[7px] tw-w-[7px] tw-rounded-[2px] tw-bg-[#059669]"
      );
    case 2:
      return clsx(
        baseClassName,
        variant === "grid"
          ? "tw-h-[7px] tw-w-[7px] tw-rounded-[3px] tw-bg-[#047857] desktop-hover:group-hover/cell:tw-scale-110 desktop-hover:group-hover/cell:tw-brightness-105"
          : "tw-h-[6px] tw-w-[6px] tw-rounded-[3px] tw-bg-[#047857]"
      );
    case 1:
      return clsx(
        baseClassName,
        variant === "grid"
          ? "tw-h-[6px] tw-w-[6px] tw-rounded-[3px] tw-bg-[#064e3b] desktop-hover:group-hover/cell:tw-scale-110 desktop-hover:group-hover/cell:tw-brightness-105"
          : "tw-h-[6px] tw-w-[6px] tw-rounded-[3px] tw-bg-[#064e3b]"
      );
    case 0:
      return clsx(
        baseClassName,
        variant === "grid"
          ? "tw-h-[4px] tw-w-[4px] tw-rounded-[2px] tw-bg-[#1d2229] desktop-hover:group-hover/cell:tw-bg-[#272d35]"
          : "tw-h-[4px] tw-w-[4px] tw-rounded-[2px] tw-bg-iron-500/55"
      );
  }
}

function HeatmapDayLabels() {
  return (
    <div
      className="tw-hidden tw-shrink-0 tw-text-[9px] tw-font-semibold tw-uppercase tw-tracking-[0.22em] tw-text-iron-500 sm:tw-grid"
      aria-hidden="true"
      style={{
        marginTop: `${DAY_LABEL_TOP_OFFSET_PX}px`,
        width: `${DAY_LABEL_COLUMN_WIDTH_PX}px`,
        gridTemplateRows: `repeat(7, ${CELL_SIZE_PX}px)`,
        rowGap: `${CELL_GAP_PX}px`,
      }}
    >
      {DAY_LABELS.map((label, index) => (
        <div
          key={`${label || "empty"}-${index}`}
          className="tw-flex tw-items-center tw-justify-end"
        >
          {label ? label : <span className="tw-opacity-0">Sun</span>}
        </div>
      ))}
    </div>
  );
}

function HeatmapMonthHeader({ weekCount }: Readonly<{ weekCount: number }>) {
  return (
    <div
      className="tw-grid tw-items-end tw-text-[9px] tw-font-semibold tw-uppercase tw-tracking-[0.22em] tw-text-iron-500"
      aria-hidden="true"
      style={{
        height: `${MONTH_LABEL_ROW_HEIGHT_PX}px`,
        gridTemplateColumns: `repeat(${weekCount}, ${CELL_SIZE_PX}px)`,
        columnGap: `${CELL_GAP_PX}px`,
      }}
    >
      {Array.from({ length: weekCount }, (_, index) => (
        <div key={index} className="tw-relative tw-h-4">
          {index % 4 === 0 ? (
            <span className="tw-absolute tw-left-0 tw-whitespace-nowrap">
              Jan
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function HeatmapMonthLabels({
  activity,
  scrollLeft,
  clientWidth,
}: Readonly<{
  activity: UserPageBrainActivityViewModel;
  scrollLeft: number;
  clientWidth: number;
}>) {
  const visibleMonthLabels = activity.monthLabels.filter((label) => {
    const labelLeftPx = label.startColumn * COLUMN_STRIDE_PX;

    return labelLeftPx >= scrollLeft && labelLeftPx <= scrollLeft + clientWidth;
  });
  const firstVisibleMonthLabelKey = visibleMonthLabels[0]?.key;

  return (
    <div
      className="tw-relative tw-text-[9px] tw-font-semibold tw-uppercase tw-tracking-[0.22em] tw-text-iron-500"
      aria-hidden="true"
      style={{
        height: `${MONTH_LABEL_ROW_HEIGHT_PX}px`,
        width: `${getHeatmapWidthPx(activity.weekCount)}px`,
      }}
    >
      {visibleMonthLabels.map((label) => (
        <span
          key={label.key}
          className="tw-absolute tw-top-0 tw-whitespace-nowrap"
          style={{
            left: `${
              label.key === firstVisibleMonthLabelKey
                ? scrollLeft
                : label.startColumn * COLUMN_STRIDE_PX
            }px`,
          }}
        >
          {label.label}
        </span>
      ))}
    </div>
  );
}

function useHeatmapViewport() {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const cachedMetricsRef = useRef(EMPTY_VIEWPORT_METRICS);

  const setViewportRef = useCallback((node: HTMLDivElement | null) => {
    viewportRef.current = node;
    cachedMetricsRef.current = EMPTY_VIEWPORT_METRICS;
  }, []);

  const getViewportSnapshot = useCallback(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return EMPTY_VIEWPORT_METRICS;
    }

    const nextMetrics = {
      scrollLeft: viewport.scrollLeft,
      clientWidth: viewport.clientWidth,
      scrollWidth: viewport.scrollWidth,
    } as const;
    const previousMetrics = cachedMetricsRef.current;

    if (
      previousMetrics.scrollLeft === nextMetrics.scrollLeft &&
      previousMetrics.clientWidth === nextMetrics.clientWidth &&
      previousMetrics.scrollWidth === nextMetrics.scrollWidth
    ) {
      return previousMetrics;
    }

    cachedMetricsRef.current = nextMetrics;
    return nextMetrics;
  }, []);

  const subscribeToViewport = useCallback((onStoreChange: () => void) => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return () => {};
    }

    const content = viewport.firstElementChild;
    const notify = () => {
      onStoreChange();
    };
    const scrollToEnd = () => {
      const maxScrollLeft = Math.max(
        0,
        viewport.scrollWidth - viewport.clientWidth
      );
      viewport.scrollLeft =
        Math.floor(maxScrollLeft / COLUMN_STRIDE_PX) * COLUMN_STRIDE_PX;
      notify();
    };

    const frameId = requestAnimationFrame(scrollToEnd);
    viewport.addEventListener("scroll", notify, { passive: true });

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", notify);

      return () => {
        cancelAnimationFrame(frameId);
        viewport.removeEventListener("scroll", notify);
        window.removeEventListener("resize", notify);
      };
    }

    const resizeObserver = new ResizeObserver(notify);
    resizeObserver.observe(viewport);
    if (content) {
      resizeObserver.observe(content);
    }

    return () => {
      cancelAnimationFrame(frameId);
      viewport.removeEventListener("scroll", notify);
      resizeObserver.disconnect();
    };
  }, []);

  const viewportMetrics = useSyncExternalStore(
    subscribeToViewport,
    getViewportSnapshot,
    () => EMPTY_VIEWPORT_METRICS
  );

  return { viewportRef: setViewportRef, viewportMetrics };
}

export function UserPageBrainActivityHeatmapLoading() {
  const { viewportRef } = useHeatmapViewport();

  return (
    <div className="tw-flex tw-gap-3" aria-label="Loading activity heatmap">
      <HeatmapDayLabels />
      <div className="tw-relative tw-min-w-0 tw-flex-1">
        <div
          ref={viewportRef}
          className="tw-[scrollbar-gutter:stable] tw-flex-1 tw-overflow-x-auto tw-overflow-y-hidden tw-pb-3 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700/60 desktop-hover:hover:tw-scrollbar-thumb-iron-600/80"
        >
          <div className="tw-inline-flex tw-flex-col tw-gap-3 tw-pr-2">
            <HeatmapMonthHeader weekCount={53} />
            <div
              className="tw-grid tw-grid-flow-col tw-grid-rows-7"
              style={{
                gridTemplateRows: `repeat(7, ${CELL_SIZE_PX}px)`,
                gridAutoColumns: `${CELL_SIZE_PX}px`,
                gap: `${CELL_GAP_PX}px`,
              }}
            >
              {Array.from({ length: 53 * 7 }, (_, index) => (
                <div
                  key={index}
                  className="tw-flex tw-items-center tw-justify-center tw-rounded-[4px]"
                  style={{
                    width: `${CELL_SIZE_PX}px`,
                    height: `${CELL_SIZE_PX}px`,
                  }}
                >
                  <div className="tw-h-[4px] tw-w-[4px] tw-animate-pulse tw-rounded-[2px] tw-bg-[#1d2229]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UserPageBrainActivityHeatmap({
  activity,
}: Readonly<{
  activity: UserPageBrainActivityViewModel;
}>) {
  const tooltipId = useId();
  const { viewportRef, viewportMetrics } = useHeatmapViewport();

  return (
    <div className="tw-flex tw-gap-3 tw-px-3">
      <HeatmapDayLabels />

      <div className="tw-relative tw-min-w-0 tw-flex-1">
        <div
          ref={viewportRef}
          className="tw-[scrollbar-gutter:stable] tw-flex-1 tw-overflow-x-auto tw-overflow-y-hidden tw-pb-3 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700/60 desktop-hover:hover:tw-scrollbar-thumb-iron-600/80"
        >
          <div className="tw-inline-flex tw-flex-col tw-gap-3 tw-pr-2">
            <HeatmapMonthLabels
              activity={activity}
              scrollLeft={viewportMetrics.scrollLeft}
              clientWidth={viewportMetrics.clientWidth}
            />

            <div
              className="tw-grid tw-grid-flow-col tw-grid-rows-7"
              aria-label={`Public activity heatmap for ${activity.periodLabel}`}
              style={{
                gridTemplateRows: `repeat(7, ${CELL_SIZE_PX}px)`,
                gridAutoColumns: `${CELL_SIZE_PX}px`,
                gap: `${CELL_GAP_PX}px`,
              }}
            >
              {activity.cells.map((cell) => {
                const cellProps = cell.ariaLabel
                  ? {
                      role: "img" as const,
                      "aria-label": cell.ariaLabel,
                      "data-tooltip-id": tooltipId,
                      "data-tooltip-count": String(cell.count),
                      "data-tooltip-date": cell.isoDate,
                      "data-tooltip-intensity": String(cell.intensity),
                    }
                  : {
                      "aria-hidden": true as const,
                    };

                return (
                  <div
                    key={cell.key}
                    {...cellProps}
                    className={clsx(
                      "tw-group/cell tw-relative",
                      getCellFrameClassName(cell)
                    )}
                    style={{
                      width: `${CELL_SIZE_PX}px`,
                      height: `${CELL_SIZE_PX}px`,
                    }}
                  >
                    {cell.state !== "padding" && (
                      <div className={getCellNodeClassName(cell, "grid")} />
                    )}
                  </div>
                );
              })}
            </div>
            <Tooltip
              id={tooltipId}
              place="top"
              offset={8}
              opacity={1}
              style={TOOLTIP_STYLE}
              render={({ activeAnchor }) => {
                const countValue = Number(
                  activeAnchor?.getAttribute("data-tooltip-count")
                );
                const isoDate = activeAnchor?.getAttribute("data-tooltip-date");

                if (!isoDate || Number.isNaN(countValue)) {
                  return null;
                }

                const intensityValue = Number(
                  activeAnchor?.getAttribute("data-tooltip-intensity")
                );

                const indicatorCell: UserPageBrainActivityCell = {
                  key: "tooltip",
                  isoDate: isoDate,
                  count: countValue,
                  ariaLabel: null,
                  state: countValue > 0 ? "active" : "empty",
                  intensity:
                    Number.isNaN(intensityValue) || intensityValue < 0
                      ? 0
                      : (intensityValue as UserPageBrainActivityCell["intensity"]),
                };

                return (
                  <div className="tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-[#1c2128]/95 tw-px-3.5 tw-py-2 tw-shadow-[0_10px_30px_rgba(0,0,0,0.8)] tw-backdrop-blur-md">
                    <span className="tw-flex tw-h-3 tw-w-3 tw-items-center tw-justify-center">
                      <span
                        className={getCellNodeClassName(
                          indicatorCell,
                          "tooltip"
                        )}
                      />
                    </span>
                    <span className="tw-text-xs tw-font-semibold tw-text-iron-50">
                      {getTooltipCountLabel(countValue)}
                    </span>
                    <span className="tw-h-3 tw-w-px tw-bg-white/15" />
                    <span className="tw-text-xs tw-font-medium tw-text-iron-400">
                      {TOOLTIP_DATE_FORMATTER.format(
                        new Date(`${isoDate}T00:00:00.000Z`)
                      )}
                    </span>
                  </div>
                );
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
