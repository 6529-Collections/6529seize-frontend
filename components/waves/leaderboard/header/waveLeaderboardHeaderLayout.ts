import { resolveWaveLeaderboardHeaderControlModes } from "./waveLeaderboardHeaderControls";

type WaveLeaderboardHeaderActionMode = "full" | "icon";

interface ResolveWaveLeaderboardHeaderLayoutInput {
  readonly rowWidth: number;
  readonly viewModesWidth: number;
  readonly sortTabsWidth: number;
  readonly sortDropdownWidth: number;
  readonly hasCurationControl: boolean;
  readonly curationTabsWidth?: number | undefined;
  readonly curationDropdownWidth?: number | undefined;
  readonly hasActions: boolean;
  readonly actionsFullWidth?: number | undefined;
  readonly actionsIconWidth?: number | undefined;
  readonly controlsGapWidth?: number | undefined;
  readonly actionsGapWidth?: number | undefined;
}

interface WaveLeaderboardHeaderLayout {
  readonly sortMode: "tabs" | "dropdown";
  readonly curationMode: "tabs" | "dropdown";
  readonly enableControlsScroll: boolean;
  readonly actionMode: WaveLeaderboardHeaderActionMode;
  readonly wrapActions: boolean;
}

const DEFAULT_GAP_WIDTH = 8; // tw-gap-2
const WIDTH_TOLERANCE_PX = 1;

const isValidWidth = (value: number): boolean =>
  Number.isFinite(value) && value > 0;

const normalizeGapWidth = (value: number | undefined): number => {
  if (value === undefined || !Number.isFinite(value)) {
    return DEFAULT_GAP_WIDTH;
  }

  return Math.max(0, value);
};

const getDropdownControlsWidth = ({
  viewModesWidth,
  sortDropdownWidth,
  hasCurationControl,
  curationDropdownWidth,
  gapWidth,
}: {
  readonly viewModesWidth: number;
  readonly sortDropdownWidth: number;
  readonly hasCurationControl: boolean;
  readonly curationDropdownWidth: number;
  readonly gapWidth: number;
}): number | null => {
  if (!isValidWidth(viewModesWidth) || !isValidWidth(sortDropdownWidth)) {
    return null;
  }

  if (!hasCurationControl) {
    return viewModesWidth + gapWidth + sortDropdownWidth;
  }

  if (!isValidWidth(curationDropdownWidth)) {
    return null;
  }

  return (
    viewModesWidth +
    gapWidth +
    sortDropdownWidth +
    gapWidth +
    curationDropdownWidth
  );
};

const fits = (availableWidth: number, requiredWidth: number): boolean =>
  requiredWidth <= availableWidth + WIDTH_TOLERANCE_PX;

export function resolveWaveLeaderboardHeaderLayout({
  rowWidth,
  viewModesWidth,
  sortTabsWidth,
  sortDropdownWidth,
  hasCurationControl,
  curationTabsWidth = 0,
  curationDropdownWidth = 0,
  hasActions,
  actionsFullWidth = 0,
  actionsIconWidth = 0,
  controlsGapWidth,
  actionsGapWidth,
}: ResolveWaveLeaderboardHeaderLayoutInput): WaveLeaderboardHeaderLayout {
  const safeControlsGapWidth = normalizeGapWidth(controlsGapWidth);
  const safeActionsGapWidth = normalizeGapWidth(actionsGapWidth);

  const defaultControls = resolveWaveLeaderboardHeaderControlModes({
    availableWidth: rowWidth,
    viewModesWidth,
    sortTabsWidth,
    sortDropdownWidth,
    hasCurationControl,
    curationTabsWidth,
    curationDropdownWidth,
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
    hasCurationControl,
    curationDropdownWidth,
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

  if (fits(rowWidth, requiredWidthWithFullActions)) {
    actionMode = "full";
    wrapActions = false;
  } else if (fits(rowWidth, requiredWidthWithIconActions)) {
    actionMode = "icon";
    wrapActions = false;
  } else {
    actionMode = "icon";
    wrapActions = true;
  }

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
    hasCurationControl,
    curationTabsWidth,
    curationDropdownWidth,
    gapWidth: safeControlsGapWidth,
  });

  return {
    ...controls,
    actionMode,
    wrapActions,
  };
}
