type LeaderboardHeaderControlMode = "tabs" | "dropdown";

interface ResolveWaveLeaderboardHeaderControlModesInput {
  readonly availableWidth: number;
  readonly viewModesWidth: number;
  readonly sortTabsWidth: number;
  readonly sortDropdownWidth: number;
  readonly hasCurationControl: boolean;
  readonly curationTabsWidth?: number | undefined;
  readonly curationDropdownWidth?: number | undefined;
  readonly gapWidth?: number | undefined;
}

interface WaveLeaderboardHeaderControlModes {
  readonly sortMode: LeaderboardHeaderControlMode;
  readonly curationMode: LeaderboardHeaderControlMode;
  readonly enableControlsScroll: boolean;
}

const DEFAULT_GAP_WIDTH = 8; // tw-gap-2
const WIDTH_TOLERANCE_PX = 1;

const isValidWidth = (value: number): boolean =>
  Number.isFinite(value) && value > 0;

const getRequiredWidth = ({
  viewModesWidth,
  sortWidth,
  hasCurationControl,
  curationWidth,
  gapWidth,
}: {
  readonly viewModesWidth: number;
  readonly sortWidth: number;
  readonly hasCurationControl: boolean;
  readonly curationWidth: number;
  readonly gapWidth: number;
}) => {
  if (!hasCurationControl) {
    return viewModesWidth + gapWidth + sortWidth;
  }

  return viewModesWidth + gapWidth + sortWidth + gapWidth + curationWidth;
};

export function resolveWaveLeaderboardHeaderControlModes({
  availableWidth,
  viewModesWidth,
  sortTabsWidth,
  sortDropdownWidth,
  hasCurationControl,
  curationTabsWidth = 0,
  curationDropdownWidth = 0,
  gapWidth = DEFAULT_GAP_WIDTH,
}: ResolveWaveLeaderboardHeaderControlModesInput): WaveLeaderboardHeaderControlModes {
  const fallback: WaveLeaderboardHeaderControlModes = {
    sortMode: "dropdown",
    curationMode: hasCurationControl ? "tabs" : "dropdown",
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

  if (!hasCurationControl) {
    const tabsRequiredWidth = getRequiredWidth({
      viewModesWidth,
      sortWidth: sortTabsWidth,
      hasCurationControl: false,
      curationWidth: 0,
      gapWidth: safeGapWidth,
    });

    if (fits(tabsRequiredWidth)) {
      return {
        sortMode: "tabs",
        curationMode: "dropdown",
        enableControlsScroll: false,
      };
    }

    const dropdownRequiredWidth = getRequiredWidth({
      viewModesWidth,
      sortWidth: sortDropdownWidth,
      hasCurationControl: false,
      curationWidth: 0,
      gapWidth: safeGapWidth,
    });

    return {
      sortMode: "dropdown",
      curationMode: "dropdown",
      enableControlsScroll: !fits(dropdownRequiredWidth),
    };
  }

  if (
    !isValidWidth(curationTabsWidth) ||
    !isValidWidth(curationDropdownWidth)
  ) {
    return fallback;
  }

  const candidates: readonly WaveLeaderboardHeaderControlModes[] = [
    {
      sortMode: "tabs",
      curationMode: "tabs",
      enableControlsScroll: false,
    },
    {
      sortMode: "dropdown",
      curationMode: "tabs",
      enableControlsScroll: false,
    },
    {
      sortMode: "dropdown",
      curationMode: "dropdown",
      enableControlsScroll: false,
    },
  ];

  for (const candidate of candidates) {
    const requiredWidth = getRequiredWidth({
      viewModesWidth,
      sortWidth:
        candidate.sortMode === "tabs" ? sortTabsWidth : sortDropdownWidth,
      hasCurationControl,
      curationWidth:
        candidate.curationMode === "tabs"
          ? curationTabsWidth
          : curationDropdownWidth,
      gapWidth: safeGapWidth,
    });

    if (fits(requiredWidth)) {
      return candidate;
    }
  }

  return {
    sortMode: "dropdown",
    curationMode: "dropdown",
    enableControlsScroll: true,
  };
}
