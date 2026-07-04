type LeaderboardHeaderControlMode = "tabs" | "dropdown";

interface ResolveWaveLeaderboardHeaderControlModesInput {
  readonly availableWidth: number;
  readonly viewModesWidth: number;
  readonly sortTabsWidth: number;
  readonly sortDropdownWidth: number;
  readonly gapWidth?: number | undefined;
}

interface WaveLeaderboardHeaderControlModes {
  readonly sortMode: LeaderboardHeaderControlMode;
  readonly enableControlsScroll: boolean;
}

const DEFAULT_GAP_WIDTH = 8; // tw-gap-2
const WIDTH_TOLERANCE_PX = 1;

const isValidWidth = (value: number): boolean =>
  Number.isFinite(value) && value > 0;

const getRequiredWidth = ({
  viewModesWidth,
  sortWidth,
  gapWidth,
}: {
  readonly viewModesWidth: number;
  readonly sortWidth: number;
  readonly gapWidth: number;
}) => viewModesWidth + gapWidth + sortWidth;

export function resolveWaveLeaderboardHeaderControlModes({
  availableWidth,
  viewModesWidth,
  sortTabsWidth,
  sortDropdownWidth,
  gapWidth = DEFAULT_GAP_WIDTH,
}: ResolveWaveLeaderboardHeaderControlModesInput): WaveLeaderboardHeaderControlModes {
  const fallback: WaveLeaderboardHeaderControlModes = {
    sortMode: "dropdown",
    enableControlsScroll: false,
  };

  if (
    !isValidWidth(availableWidth) ||
    !isValidWidth(viewModesWidth) ||
    !isValidWidth(sortTabsWidth) ||
    !isValidWidth(sortDropdownWidth)
  ) {
    return fallback;
  }

  const safeGapWidth = Number.isFinite(gapWidth)
    ? Math.max(0, gapWidth)
    : DEFAULT_GAP_WIDTH;

  const fits = (requiredWidth: number): boolean =>
    requiredWidth <= availableWidth + WIDTH_TOLERANCE_PX;

  const tabsRequiredWidth = getRequiredWidth({
    viewModesWidth,
    sortWidth: sortTabsWidth,
    gapWidth: safeGapWidth,
  });

  if (fits(tabsRequiredWidth)) {
    return {
      sortMode: "tabs",
      enableControlsScroll: false,
    };
  }

  const dropdownRequiredWidth = getRequiredWidth({
    viewModesWidth,
    sortWidth: sortDropdownWidth,
    gapWidth: safeGapWidth,
  });

  return {
    sortMode: "dropdown",
    enableControlsScroll: !fits(dropdownRequiredWidth),
  };
}
