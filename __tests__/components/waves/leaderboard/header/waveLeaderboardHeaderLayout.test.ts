import {
  resolveSubmissionToolbarLayout,
  resolveWaveLeaderboardHeaderLayout,
} from "@/components/waves/leaderboard/header/waveLeaderboardHeaderLayout";

describe("submission toolbar layout", () => {
  const input = {
    rowWidth: 600,
    viewModesWidth: 104,
    sortControlWidth: 111,
    submissionActionsWidth: 205,
    showAdditionalActions: true,
    showPriceActions: false,
    hasFullControlsBasis: false,
  };

  it.each<[number, boolean, boolean]>([
    [600, false, false],
    [442, false, false],
    [350, true, false],
    [207, true, true],
  ])(
    "keeps measured controls usable at %s px",
    (rowWidth, balanced, compact) => {
      expect(resolveSubmissionToolbarLayout({ ...input, rowWidth })).toEqual({
        balanceSubmissionRows: balanced,
        compactSubmissionControls: compact,
        controlsRowFlexClass: balanced
          ? "tw-flex-[1_1_100%]"
          : "tw-flex-[1_1_auto]",
      });
    }
  );

  it("preserves price-action layout even in a narrow container", () => {
    expect(
      resolveSubmissionToolbarLayout({
        ...input,
        rowWidth: 207,
        showPriceActions: true,
      })
    ).toMatchObject({
      balanceSubmissionRows: false,
      compactSubmissionControls: false,
    });
  });

  it("waits for the action measurements before changing the row layout", () => {
    expect(
      resolveSubmissionToolbarLayout({
        ...input,
        rowWidth: 207,
        submissionActionsWidth: 0,
      })
    ).toMatchObject({
      balanceSubmissionRows: false,
      compactSubmissionControls: false,
    });
  });
});

describe("resolveWaveLeaderboardHeaderLayout", () => {
  const baseInput = {
    viewModesWidth: 120,
    sortTabsWidth: 260,
    sortDropdownWidth: 140,
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
      sortMode: "tabs",
      enableControlsScroll: false,
      actionMode: "full",
      wrapActions: false,
    });
  });

  it("uses icon-only actions before controls need scroll fallback", () => {
    const result = resolveWaveLeaderboardHeaderLayout({
      ...baseInput,
      rowWidth: 550,
    });

    expect(result).toEqual({
      sortMode: "tabs",
      enableControlsScroll: false,
      actionMode: "icon",
      wrapActions: false,
    });
  });

  it("wraps actions early when space gets tight", () => {
    const result = resolveWaveLeaderboardHeaderLayout({
      ...baseInput,
      rowWidth: 380,
    });

    expect(result).toEqual({
      sortMode: "dropdown",
      enableControlsScroll: false,
      actionMode: "icon",
      wrapActions: true,
    });
  });

  it("keeps actions inline when wrapping is disabled and falls back to scroll", () => {
    const result = resolveWaveLeaderboardHeaderLayout({
      ...baseInput,
      rowWidth: 340,
      allowActionWrap: false,
    });

    expect(result).toEqual({
      sortMode: "dropdown",
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
      enableControlsScroll: true,
      actionMode: "icon",
      wrapActions: false,
    });
  });

  it("uses full controls width when actions are disabled", () => {
    const result = resolveWaveLeaderboardHeaderLayout({
      rowWidth: 390,
      viewModesWidth: 120,
      sortTabsWidth: 260,
      sortDropdownWidth: 140,
      hasActions: false,
    });

    expect(result).toEqual({
      sortMode: "tabs",
      enableControlsScroll: false,
      actionMode: "full",
      wrapActions: false,
    });
  });
});
