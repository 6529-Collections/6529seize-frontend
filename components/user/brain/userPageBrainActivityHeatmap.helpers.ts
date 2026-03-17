import clsx from "clsx";
import type {
  UserPageBrainActivityCell,
  UserPageBrainActivityViewModel,
} from "./userPageBrainActivity.helpers";

export type HeatmapTooltipData = Readonly<{
  count: number;
  isoDate: string;
  intensity: UserPageBrainActivityCell["intensity"];
}>;

type HeatmapMonthLabel = UserPageBrainActivityViewModel["monthLabels"][number];
type HeatmapNodeVariant = "grid" | "tooltip";
type PlacedMonthLabel = Readonly<{
  key: string;
  label: string;
  leftPx: number;
}>;

// Layout and sizing
export const CELL_SIZE_PX = 14;
export const CELL_GAP_PX = 2;
export const DAY_LABEL_COLUMN_WIDTH_PX = 30;
export const MONTH_LABEL_ROW_HEIGHT_PX = 12;
const HEADER_TO_HEATMAP_GAP_PX = 4;
const DAY_LABEL_EXTRA_OFFSET_PX = 2;
export const DAY_LABEL_TOP_OFFSET_PX =
  MONTH_LABEL_ROW_HEIGHT_PX +
  HEADER_TO_HEATMAP_GAP_PX +
  DAY_LABEL_EXTRA_OFFSET_PX;
export const HEATMAP_GRID_HEIGHT_PX = CELL_SIZE_PX * 7 + CELL_GAP_PX * 6;
export const COLUMN_STRIDE_PX = CELL_SIZE_PX + CELL_GAP_PX;
export const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""] as const;
export const LOADING_MONTH_HEADER_SEGMENTS = [
  { key: "start", widthPx: 18 },
  { key: "spring", widthPx: 24 },
  { key: "early-summer", widthPx: 16 },
  { key: "late-summer", widthPx: 22 },
  { key: "autumn", widthPx: 20 },
  { key: "winter-start", widthPx: 18 },
  { key: "winter-mid", widthPx: 24 },
  { key: "end", widthPx: 16 },
] as const;
export const MONTH_LABEL_MIN_SPACING_PX = 34;
const MONTH_LABEL_OVERFLOW_TOLERANCE_PX = 18;
export const TOOLTIP_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
export const TOOLTIP_STYLE = {
  padding: "0",
  background: "transparent",
  boxShadow: "none",
  zIndex: 99999,
  pointerEvents: "none",
} as const;
export const HEATMAP_VIEWPORT_CLASS_NAME =
  "tw-[scrollbar-gutter:stable] tw-flex-1 tw-overflow-x-auto tw-overflow-y-hidden tw-pb-3 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700/60 desktop-hover:hover:tw-scrollbar-thumb-iron-600/80";
export const HEATMAP_CONTENT_CLASS_NAME = "tw-inline-flex tw-pr-2";
export const HEATMAP_GRID_STYLE = {
  gridTemplateRows: `repeat(7, ${CELL_SIZE_PX}px)`,
  gridAutoColumns: `${CELL_SIZE_PX}px`,
  gap: `${CELL_GAP_PX}px`,
} as const;
export const CELL_FRAME_STYLE = {
  width: `${CELL_SIZE_PX}px`,
  height: `${CELL_SIZE_PX}px`,
} as const;

// Cell presentation
const CELL_NODE_CLASS_NAMES: Readonly<
  Record<
    HeatmapNodeVariant,
    Readonly<Record<UserPageBrainActivityCell["intensity"], string>>
  >
> = {
  grid: {
    0: "tw-h-1 tw-w-1 tw-rounded-[1px] tw-bg-[#1d2229] desktop-hover:group-hover/cell:tw-bg-[#272d35]",
    1: "tw-h-[6px] tw-w-[6px] tw-rounded-[1px] tw-bg-[#064e3b] desktop-hover:group-hover/cell:tw-scale-110 desktop-hover:group-hover/cell:tw-brightness-105",
    2: "tw-h-[7px] tw-w-[7px] tw-rounded-[1px] tw-bg-[#047857] desktop-hover:group-hover/cell:tw-scale-110 desktop-hover:group-hover/cell:tw-brightness-105",
    3: "tw-h-[9px] tw-w-[9px] tw-rounded-sm tw-bg-[#059669] desktop-hover:group-hover/cell:tw-scale-105 desktop-hover:group-hover/cell:tw-brightness-105",
    4: "tw-h-[11px] tw-w-[11px] tw-rounded-sm tw-bg-[#34d399] tw-shadow-[0_0_10px_rgba(52,211,153,0.22)] desktop-hover:group-hover/cell:tw-scale-105 desktop-hover:group-hover/cell:tw-brightness-105",
  },
  tooltip: {
    0: "tw-h-1 tw-w-1 tw-rounded-[1px] tw-bg-iron-500/55",
    1: "tw-h-[6px] tw-w-[6px] tw-rounded-[1px] tw-bg-[#064e3b]",
    2: "tw-h-[6px] tw-w-[6px] tw-rounded-[1px] tw-bg-[#047857]",
    3: "tw-h-[7px] tw-w-[7px] tw-rounded-sm tw-bg-[#059669]",
    4: "tw-h-[8px] tw-w-[8px] tw-rounded-sm tw-bg-[#34d399]",
  },
} as const;

// Tooltip
export function getTooltipCountLabel(count: number): string {
  if (count <= 0) {
    return "No posts";
  }

  return count === 1 ? "1 post" : `${count} posts`;
}

function getTooltipIntensity(
  value: number
): UserPageBrainActivityCell["intensity"] {
  const normalizedValue = Math.max(0, Math.min(4, Math.floor(value)));

  switch (normalizedValue) {
    case 4:
      return 4;
    case 3:
      return 3;
    case 2:
      return 2;
    case 1:
      return 1;
    default:
      return 0;
  }
}

export function getCellTooltipAnchorProps(
  cell: UserPageBrainActivityCell,
  tooltipId: string
):
  | Readonly<{
      role: "img";
      "aria-label": string;
      "data-tooltip-id": string;
      "data-tooltip-count": string;
      "data-tooltip-date": string;
      "data-tooltip-intensity": string;
    }>
  | Readonly<{
      "aria-hidden": true;
    }> {
  if (!cell.ariaLabel || !cell.isoDate) {
    return { "aria-hidden": true };
  }

  return {
    role: "img",
    "aria-label": cell.ariaLabel,
    "data-tooltip-id": tooltipId,
    "data-tooltip-count": String(cell.count),
    "data-tooltip-date": cell.isoDate,
    "data-tooltip-intensity": String(cell.intensity),
  };
}

export function getHeatmapTooltipData(
  activeAnchor: Element | null
): HeatmapTooltipData | null {
  const dataset =
    activeAnchor instanceof HTMLElement ? activeAnchor.dataset : undefined;
  const countValue = Number(dataset?.tooltipCount);
  const isoDate = dataset?.tooltipDate;

  if (!isoDate || Number.isNaN(countValue)) {
    return null;
  }

  const intensityValue = Number(dataset?.tooltipIntensity);

  return {
    count: countValue,
    isoDate,
    intensity: getTooltipIntensity(intensityValue),
  };
}

// Cell presentation
export function getCellFrameClassName(cell: UserPageBrainActivityCell): string {
  if (cell.state === "padding") {
    return "tw-bg-transparent";
  }

  return clsx(
    "tw-flex tw-items-center tw-justify-center tw-rounded tw-transition-colors tw-duration-200",
    cell.ariaLabel &&
      "tw-cursor-pointer desktop-hover:hover:tw-z-20 desktop-hover:hover:tw-bg-[#171b21]"
  );
}

export function getCellNodeClassName(
  cell: UserPageBrainActivityCell,
  variant: HeatmapNodeVariant = "grid"
): string {
  return clsx(
    variant === "grid" &&
      "tw-transform-gpu tw-transition-all tw-duration-200 tw-ease-out",
    CELL_NODE_CLASS_NAMES[variant][cell.intensity]
  );
}

// Month label placement
export function getPlacedMonthLabels(
  monthLabels: readonly HeatmapMonthLabel[],
  scrollLeft: number,
  clientWidth: number
): readonly PlacedMonthLabel[] {
  const placedMonthLabels: PlacedMonthLabel[] = [];
  let nextMinimumLeftPx = 0;

  for (const label of monthLabels) {
    const naturalLeftPx = label.labelColumn * COLUMN_STRIDE_PX - scrollLeft;

    if (
      clientWidth > 0 &&
      (naturalLeftPx < -MONTH_LABEL_OVERFLOW_TOLERANCE_PX ||
        naturalLeftPx > clientWidth)
    ) {
      continue;
    }

    const leftPx = Math.max(-MONTH_LABEL_OVERFLOW_TOLERANCE_PX, naturalLeftPx);

    if (clientWidth > 0 && leftPx >= clientWidth) {
      continue;
    }
    if (leftPx < nextMinimumLeftPx) {
      continue;
    }

    placedMonthLabels.push({
      key: label.key,
      label: label.label,
      leftPx,
    });
    nextMinimumLeftPx = leftPx + MONTH_LABEL_MIN_SPACING_PX;
  }

  return placedMonthLabels;
}
