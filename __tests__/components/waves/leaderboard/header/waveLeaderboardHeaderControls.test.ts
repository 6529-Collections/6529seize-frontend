import { resolveWaveLeaderboardHeaderControlModes } from "@/components/waves/leaderboard/header/waveLeaderboardHeaderControls";

describe("resolveWaveLeaderboardHeaderControlModes", () => {
  it("keeps sort and curation as tabs when both fit", () => {
    const result = resolveWaveLeaderboardHeaderControlModes({
      availableWidth: 700,
      viewModesWidth: 120,
      sortTabsWidth: 260,
      sortDropdownWidth: 140,
      hasCurationControl: true,
      curationTabsWidth: 280,
      curationDropdownWidth: 170,
    });

    expect(result).toEqual({
      sortMode: "tabs",
      curationMode: "tabs",
      enableControlsScroll: false,
    });
  });

  it("falls back to sort dropdown first while preserving curation tabs", () => {
    const result = resolveWaveLeaderboardHeaderControlModes({
      availableWidth: 570,
      viewModesWidth: 120,
      sortTabsWidth: 260,
      sortDropdownWidth: 140,
      hasCurationControl: true,
      curationTabsWidth: 280,
      curationDropdownWidth: 170,
    });

    expect(result).toEqual({
      sortMode: "dropdown",
      curationMode: "tabs",
      enableControlsScroll: false,
    });
  });

  it("falls back to both dropdowns when needed", () => {
    const result = resolveWaveLeaderboardHeaderControlModes({
      availableWidth: 450,
      viewModesWidth: 120,
      sortTabsWidth: 260,
      sortDropdownWidth: 140,
      hasCurationControl: true,
      curationTabsWidth: 280,
      curationDropdownWidth: 170,
    });

    expect(result).toEqual({
      sortMode: "dropdown",
      curationMode: "dropdown",
      enableControlsScroll: false,
    });
  });

  it("enables horizontal scroll fallback if even both dropdowns do not fit", () => {
    const result = resolveWaveLeaderboardHeaderControlModes({
      availableWidth: 300,
      viewModesWidth: 120,
      sortTabsWidth: 260,
      sortDropdownWidth: 140,
      hasCurationControl: true,
      curationTabsWidth: 280,
      curationDropdownWidth: 170,
    });

    expect(result).toEqual({
      sortMode: "dropdown",
      curationMode: "dropdown",
      enableControlsScroll: true,
    });
  });

  it("switches between tabs and dropdown for sort-only layout", () => {
    const tabsResult = resolveWaveLeaderboardHeaderControlModes({
      availableWidth: 420,
      viewModesWidth: 120,
      sortTabsWidth: 260,
      sortDropdownWidth: 140,
      hasCurationControl: false,
    });

    const dropdownResult = resolveWaveLeaderboardHeaderControlModes({
      availableWidth: 300,
      viewModesWidth: 120,
      sortTabsWidth: 260,
      sortDropdownWidth: 140,
      hasCurationControl: false,
    });

    expect(tabsResult).toEqual({
      sortMode: "tabs",
      curationMode: "dropdown",
      enableControlsScroll: false,
    });
    expect(dropdownResult).toEqual({
      sortMode: "dropdown",
      curationMode: "dropdown",
      enableControlsScroll: false,
    });
  });
});
