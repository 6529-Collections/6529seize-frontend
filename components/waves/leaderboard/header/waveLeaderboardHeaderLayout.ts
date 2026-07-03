import { resolveWaveLeaderboardHeaderControlModes } from "./waveLeaderboardHeaderControls";

type WaveLeaderboardHeaderActionMode = "full" | "icon";

interface ResolveWaveLeaderboardHeaderLayoutInput {
  readonly rowWidth: number;
  readonly viewModesWidth: number;
  readonly sortTabsWidth: number;
  readonly sortDropdownWidth: number;
  readonly hasActions: boolean;
  readonly allowActionWrap?: boolean | undefined;
  readonly actionsFullWidth?: number | undefined;
  readonly actionsIconWidth?: number | undefined;
  readonly controlsGapWidth?: number | undefined;
  readonly actionsGapWidth?: number | undefined;
  readonly wrapEarlyThresholdPx?: number | undefined;
}

interface WaveLeaderboardHeaderLayout {
  readonly sortMode: "tabs" | "dropdown";
  readonly enableControlsScroll: boolean;
  readonly actionMode: WaveLeaderboardHeaderActionMode;
  readonly wrapActions: boolean;
}

const DEFAULT_GAP_WIDTH = 8; // tw-gap-2
const WIDTH_TOLERANCE_PX = 1;
const DEFAULT_WRAP_EARLY_THRESHOLD_PX = 20;

const isValidWidth = (value: number): boolean =>
  Number.isFinite(value) && value > 0;

const normalizeGapWidth = (value: number | undefined): number => {
  if (value === undefined || !Number.isFinite(value)) {
    return DEFAULT_GAP_WIDTH;
  }

  return Math.max(0, value);
};

const normalizeWrapEarlyThreshold = (value: number | undefined): number => {
  if (value === undefined || !Number.isFinite(value)) {
    return DEFAULT_WRAP_EARLY_THRESHOLD_PX;
  }

  return Math.max(0, value);
};

const getDropdownControlsWidth = ({
  viewModesWidth,
  sortDropdownWidth,
  gapWidth,
}: {
  readonly viewModesWidth: number;
  readonly sortDropdownWidth: number;
  readonly gapWidth: number;
}): number | null => {
  if (!isValidWidth(viewModesWidth) || !isValidWidth(sortDropdownWidth)) {
    return null;
  }

  return viewModesWidth + gapWidth + sortDropdownWidth;
};

const fits = (
  availableWidth: number,
  requiredWidth: number,
  wrapEarlyThresholdPx: number
): boolean =>
  requiredWidth + wrapEarlyThresholdPx <= availableWidth + WIDTH_TOLERANCE_PX;

export function resolveWaveLeaderboardHeaderLayout({
  rowWidth,
  viewModesWidth,
  sortTabsWidth,
  sortDropdownWidth,
  hasActions,
  allowActionWrap = true,
  actionsFullWidth = 0,
  actionsIconWidth = 0,
  controlsGapWidth,
  actionsGapWidth,
  wrapEarlyThresholdPx,
}: ResolveWaveLeaderboardHeaderLayoutInput): WaveLeaderboardHeaderLayout {
  const safeControlsGapWidth = normalizeGapWidth(controlsGapWidth);
  const safeActionsGapWidth = normalizeGapWidth(actionsGapWidth);
  const safeWrapEarlyThresholdPx =
    normalizeWrapEarlyThreshold(wrapEarlyThresholdPx);

  const defaultControls = resolveWaveLeaderboardHeaderControlModes({
    availableWidth: rowWidth,
    viewModesWidth,
    sortTabsWidth,
    sortDropdownWidth,
    gapWidth: safeControlsGapWidth,
  });

  if (!hasActions) {
    return {
      ...defaultControls,
      actionMode: "full",
      wrapActions: false,
    };
  }

  const minimumControlsWidth = getDropdownControlsWidth({
    viewModesWidth,
    sortDropdownWidth,
    gapWidth: safeControlsGapWidth,
  });

  if (
    !isValidWidth(rowWidth) ||
    minimumControlsWidth === null ||
    !isValidWidth(actionsFullWidth) ||
    !isValidWidth(actionsIconWidth)
  ) {
    return {
      ...defaultControls,
      actionMode: "full",
      wrapActions: false,
    };
  }

  let actionMode: WaveLeaderboardHeaderActionMode = "full";
  let wrapActions = false;

  const requiredWidthWithFullActions =
    minimumControlsWidth + safeActionsGapWidth + actionsFullWidth;
  const requiredWidthWithIconActions =
    minimumControlsWidth + safeActionsGapWidth + actionsIconWidth;
  const fitsFull = fits(
    rowWidth,
    requiredWidthWithFullActions,
    safeWrapEarlyThresholdPx
  );
  const fitsIcon = fits(
    rowWidth,
    requiredWidthWithIconActions,
    safeWrapEarlyThresholdPx
  );

  actionMode = fitsFull ? "full" : "icon";
  wrapActions = !fitsFull && !fitsIcon && allowActionWrap;

  const actionWidth =
    actionMode === "full" ? actionsFullWidth : actionsIconWidth;
  const reservedActionsWidth = wrapActions
    ? 0
    : actionWidth + safeActionsGapWidth;

  const controls = resolveWaveLeaderboardHeaderControlModes({
    availableWidth: Math.max(0, rowWidth - reservedActionsWidth),
    viewModesWidth,
    sortTabsWidth,
    sortDropdownWidth,
    gapWidth: safeControlsGapWidth,
  });

  return {
    ...controls,
    actionMode,
    wrapActions,
  };
}
