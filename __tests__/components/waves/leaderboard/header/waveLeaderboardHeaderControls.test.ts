import { resolveWaveLeaderboardHeaderControlModes } from "@/components/waves/leaderboard/header/waveLeaderboardHeaderControls";

describe("resolveWaveLeaderboardHeaderControlModes", () => {
  it("keeps sort as tabs when view modes and sort tabs fit", () => {
    const result = resolveWaveLeaderboardHeaderControlModes({
      availableWidth: 390,
      viewModesWidth: 120,
      sortTabsWidth: 260,
      sortDropdownWidth: 140,
    });

    expect(result).toEqual({
      sortMode: "tabs",
      enableControlsScroll: false,
    });
  });

  it("falls back to sort dropdown when sort tabs do not fit", () => {
    const result = resolveWaveLeaderboardHeaderControlModes({
      availableWidth: 300,
      viewModesWidth: 120,
      sortTabsWidth: 260,
      sortDropdownWidth: 140,
    });

    expect(result).toEqual({
      sortMode: "dropdown",
      enableControlsScroll: false,
    });
  });

  it("enables horizontal scroll fallback when dropdown controls do not fit", () => {
    const result = resolveWaveLeaderboardHeaderControlModes({
      availableWidth: 240,
      viewModesWidth: 120,
      sortTabsWidth: 260,
      sortDropdownWidth: 140,
    });

    expect(result).toEqual({
      sortMode: "dropdown",
      enableControlsScroll: true,
    });
  });
});
