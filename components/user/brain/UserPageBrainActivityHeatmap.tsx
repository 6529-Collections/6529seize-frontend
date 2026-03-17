"use client";

import clsx from "clsx";
import { useId } from "react";
import { Tooltip } from "react-tooltip";
import type {
  UserPageBrainActivityCell,
  UserPageBrainActivityViewModel,
} from "./userPageBrainActivity.helpers";
import {
  CELL_GAP_PX,
  CELL_FRAME_STYLE,
  CELL_SIZE_PX,
  DAY_LABEL_COLUMN_WIDTH_PX,
  DAY_LABEL_TOP_OFFSET_PX,
  DAY_LABELS,
  HEATMAP_CONTENT_CLASS_NAME,
  HEATMAP_GRID_STYLE,
  LOADING_HEATMAP_WEEK_COUNT,
  HEATMAP_VIEWPORT_CLASS_NAME,
  LOADING_MONTH_HEADER_SEGMENTS,
  MONTH_LABEL_MIN_SPACING_PX,
  MONTH_LABEL_ROW_HEIGHT_PX,
  TOOLTIP_DATE_FORMATTER,
  TOOLTIP_STYLE,
  type HeatmapTooltipData,
  getCellFrameClassName,
  getCellNodeClassName,
  getCellTooltipAnchorProps,
  getHeatmapTooltipData,
  getPlacedMonthLabels,
  getTooltipCountLabel,
} from "./userPageBrainActivityHeatmap.helpers";
import { useHeatmapViewport } from "./userPageBrainActivityHeatmap.viewport";

const LOADING_COLUMN_STRIDE_PX = CELL_SIZE_PX + CELL_GAP_PX;
const LOADING_HEATMAP_CELLS = Array.from(
  { length: LOADING_HEATMAP_WEEK_COUNT * 7 },
  (_, index) => {
    const column = Math.floor(index / 7);
    const row = index % 7;

    return {
      key: `loading-${column}-${row}`,
      isPadding:
        (column === 0 && row < 2) ||
        (column === LOADING_HEATMAP_WEEK_COUNT - 1 && row > 4),
      isAccent: (column + row) % 5 === 0,
    };
  }
);

export function UserPageBrainActivityHeatmapLoading() {
  const { viewportRef, viewportMetrics } = useHeatmapViewport("loading");

  return (
    <div
      className="tw-flex tw-gap-3 tw-px-4"
      aria-label="Loading activity heatmap"
    >
      <HeatmapDayLabels />
      <div className="tw-relative tw-min-w-0 tw-flex-1">
        <HeatmapLoadingMonthLabels
          scrollLeft={viewportMetrics.scrollLeft}
          clientWidth={viewportMetrics.clientWidth}
        />
        <div ref={viewportRef} className={HEATMAP_VIEWPORT_CLASS_NAME}>
          <div className={HEATMAP_CONTENT_CLASS_NAME}>
            <div
              className="tw-grid tw-animate-pulse tw-grid-flow-col tw-grid-rows-7"
              aria-hidden="true"
              style={HEATMAP_GRID_STYLE}
            >
              {LOADING_HEATMAP_CELLS.map((cell) => (
                <HeatmapLoadingCell
                  key={cell.key}
                  isPadding={cell.isPadding}
                  isAccent={cell.isAccent}
                />
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
  const { viewportRef, viewportMetrics } = useHeatmapViewport(
    activity.resetKey
  );

  return (
    <div className="tw-flex tw-gap-3 tw-px-4">
      <HeatmapDayLabels />
      <div className="tw-relative tw-min-w-0 tw-flex-1">
        <HeatmapMonthLabels
          activity={activity}
          scrollLeft={viewportMetrics.scrollLeft}
          clientWidth={viewportMetrics.clientWidth}
        />
        <div ref={viewportRef} className={HEATMAP_VIEWPORT_CLASS_NAME}>
          <div className={HEATMAP_CONTENT_CLASS_NAME}>
            <div
              className="tw-grid tw-grid-flow-col tw-grid-rows-7"
              role="img"
              aria-label={`Public activity heatmap for ${activity.periodLabel}`}
              style={HEATMAP_GRID_STYLE}
            >
              {activity.cells.map((cell) => (
                <HeatmapCell key={cell.key} cell={cell} tooltipId={tooltipId} />
              ))}
            </div>
            <Tooltip
              id={tooltipId}
              place="top"
              offset={8}
              opacity={1}
              style={TOOLTIP_STYLE}
              render={({ activeAnchor }) => {
                const tooltipData = getHeatmapTooltipData(activeAnchor);
                return tooltipData ? (
                  <HeatmapTooltipContent {...tooltipData} />
                ) : null;
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function HeatmapDayLabels() {
  return (
    <div
      className="tw-hidden tw-shrink-0 tw-text-[9px] tw-font-semibold tw-uppercase tw-tracking-widest tw-text-iron-600 sm:tw-grid"
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
          {label || <span className="tw-opacity-0">Sun</span>}
        </div>
      ))}
    </div>
  );
}

function HeatmapLoadingCell({
  isPadding,
  isAccent,
}: Readonly<{
  isPadding: boolean;
  isAccent: boolean;
}>) {
  return (
    <div
      className="tw-flex tw-items-center tw-justify-center"
      style={CELL_FRAME_STYLE}
    >
      {!isPadding && (
        <div
          className={clsx(
            "tw-rounded-[2px]",
            isAccent
              ? "tw-h-[9px] tw-w-[9px] tw-bg-white/[0.09]"
              : "tw-h-[7px] tw-w-[7px] tw-bg-white/[0.05]"
          )}
        />
      )}
    </div>
  );
}

function HeatmapCell({
  cell,
  tooltipId,
}: Readonly<{
  cell: UserPageBrainActivityCell;
  tooltipId: string;
}>) {
  return (
    <div
      {...getCellTooltipAnchorProps(cell, tooltipId)}
      className={clsx("tw-group/cell tw-relative", getCellFrameClassName(cell))}
      style={CELL_FRAME_STYLE}
    >
      {cell.state !== "padding" && (
        <div className={getCellNodeClassName(cell, "grid")} />
      )}
    </div>
  );
}

function HeatmapTooltipContent({
  count,
  isoDate,
  intensity,
}: HeatmapTooltipData) {
  const indicatorCell: UserPageBrainActivityCell = {
    key: "tooltip",
    isoDate,
    count,
    ariaLabel: null,
    state: count > 0 ? "active" : "empty",
    intensity,
  };

  return (
    <div className="tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-[#1c2128]/95 tw-px-3.5 tw-py-2 tw-shadow-[0_10px_30px_rgba(0,0,0,0.8)] tw-backdrop-blur-md">
      <span className="tw-flex tw-h-3 tw-w-3 tw-items-center tw-justify-center">
        <span className={getCellNodeClassName(indicatorCell, "tooltip")} />
      </span>
      <span className="tw-text-xs tw-font-semibold tw-text-iron-50">
        {getTooltipCountLabel(count)}
      </span>
      <span className="tw-h-3 tw-w-px tw-bg-white/15" />
      <span className="tw-text-xs tw-font-medium tw-text-iron-400">
        {TOOLTIP_DATE_FORMATTER.format(new Date(`${isoDate}T00:00:00.000Z`))}
      </span>
    </div>
  );
}

function HeatmapLoadingMonthLabels({
  scrollLeft,
  clientWidth,
}: Readonly<{
  scrollLeft: number;
  clientWidth: number;
}>) {
  const visibleSegments = LOADING_MONTH_HEADER_SEGMENTS.filter((segment) => {
    const leftPx = segment.labelColumn * LOADING_COLUMN_STRIDE_PX - scrollLeft;
    const rightPx = leftPx + segment.widthPx;

    if (clientWidth <= 0) {
      return true;
    }

    return rightPx >= 0 && leftPx <= clientWidth;
  });

  return (
    <div
      className="tw-relative tw-mb-1 tw-overflow-hidden"
      aria-hidden="true"
      style={{
        height: `${MONTH_LABEL_ROW_HEIGHT_PX}px`,
        minWidth: `${MONTH_LABEL_MIN_SPACING_PX}px`,
      }}
    >
      {visibleSegments.map((segment) => (
        <span
          key={segment.key}
          className="tw-absolute tw-bottom-0 tw-h-[5px] tw-animate-pulse tw-rounded-full tw-bg-white/[0.08]"
          style={{
            left: `${segment.labelColumn * LOADING_COLUMN_STRIDE_PX - scrollLeft}px`,
            width: `${segment.widthPx}px`,
          }}
        />
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
  const placedMonthLabels = getPlacedMonthLabels(
    activity.monthLabels,
    scrollLeft,
    clientWidth
  );

  return (
    <div
      className="tw-relative tw-mb-1 tw-overflow-hidden tw-text-[9px] tw-font-semibold tw-uppercase tw-tracking-widest tw-text-iron-600"
      aria-hidden="true"
      style={{ height: `${MONTH_LABEL_ROW_HEIGHT_PX}px` }}
    >
      {placedMonthLabels.map((label) => (
        <span
          key={label.key}
          className="tw-absolute tw-bottom-0 tw-whitespace-nowrap tw-leading-none"
          style={{ left: `${label.leftPx}px` }}
        >
          {label.label}
        </span>
      ))}
    </div>
  );
}
