import { resolveWaveLeaderboardHeaderLayout } from "@/components/waves/leaderboard/header/waveLeaderboardHeaderLayout";

describe("resolveWaveLeaderboardHeaderLayout", () => {
  const baseInput = {
    viewModesWidth: 120,
    sortTabsWidth: 260,
    sortDropdownWidth: 140,
    hasCurationControl: true,
    curationTabsWidth: 280,
    curationDropdownWidth: 170,
    hasActions: true,
    actionsFullWidth: 260,
    actionsIconWidth: 90,
  } as const;

  it("keeps full action buttons on one row when everything fits", () => {
    const result = resolveWaveLeaderboardHeaderLayout({
      ...baseInput,
      rowWidth: 760,
    });

    expect(result).toEqual({
      sortMode: "dropdown",
      curationMode: "dropdown",
      enableControlsScroll: false,
      actionMode: "full",
      wrapActions: false,
    });
  });

  it("uses icon-only actions before controls need scroll fallback", () => {
    const result = resolveWaveLeaderboardHeaderLayout({
      ...baseInput,
      rowWidth: 590,
    });

    expect(result).toEqual({
      sortMode: "dropdown",
      curationMode: "dropdown",
      enableControlsScroll: false,
      actionMode: "icon",
      wrapActions: false,
    });
  });

  it("wraps actions early when space gets tight", () => {
    const result = resolveWaveLeaderboardHeaderLayout({
      ...baseInput,
      rowWidth: 450,
    });

    expect(result).toEqual({
      sortMode: "dropdown",
      curationMode: "dropdown",
      enableControlsScroll: false,
      actionMode: "icon",
      wrapActions: true,
    });
  });

  it("keeps actions inline when wrapping is disabled and falls back to scroll", () => {
    const result = resolveWaveLeaderboardHeaderLayout({
      ...baseInput,
      rowWidth: 450,
      allowActionWrap: false,
    });

    expect(result).toEqual({
      sortMode: "dropdown",
      curationMode: "dropdown",
      enableControlsScroll: true,
      actionMode: "icon",
      wrapActions: false,
    });
  });

  it("keeps control scroll fallback when controls still cannot fit", () => {
    const result = resolveWaveLeaderboardHeaderLayout({
      ...baseInput,
      rowWidth: 300,
      allowActionWrap: false,
    });

    expect(result).toEqual({
      sortMode: "dropdown",
      curationMode: "dropdown",
      enableControlsScroll: true,
      actionMode: "icon",
      wrapActions: false,
    });
  });

  it("uses full controls width when actions are disabled", () => {
    const result = resolveWaveLeaderboardHeaderLayout({
      rowWidth: 570,
      viewModesWidth: 120,
      sortTabsWidth: 260,
      sortDropdownWidth: 140,
      hasCurationControl: true,
      curationTabsWidth: 280,
      curationDropdownWidth: 170,
      hasActions: false,
    });

    expect(result).toEqual({
      sortMode: "dropdown",
      curationMode: "tabs",
      enableControlsScroll: false,
      actionMode: "full",
      wrapActions: false,
    });
  });
});
