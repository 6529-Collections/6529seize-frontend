import { AuthContext } from "@/components/auth/Auth";
import { WaveLeaderboardHeader } from "@/components/waves/leaderboard/header/WaveleaderboardHeader";
import { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const useWave = jest.fn();
const sortComponentMock = jest.fn((props: any) => (
  <button
    data-testid="sort"
    data-mode={props.mode}
    onClick={() => props.onSortChange("SORT" as any)}
  />
));
const curationComponentMock = jest.fn((props: any) => (
  <button
    data-testid="curation-group-select"
    data-mode={props.mode}
    onClick={() => props.onChange("cg-1")}
  >
    Curation
  </button>
));
const resolveControlModesMock = jest.fn();

jest.mock("@/components/waves/leaderboard/header/WaveleaderboardSort", () => ({
  WAVE_LEADERBOARD_SORT_ITEMS: [
    { key: "RANK", label: "Current Vote", value: "RANK" },
    {
      key: "RATING_PREDICTION",
      label: "Projected Vote",
      value: "RATING_PREDICTION",
    },
    { key: "TREND", label: "Hot", value: "TREND" },
    { key: "CREATED_AT", label: "Newest", value: "CREATED_AT" },
  ],
  WaveleaderboardSort: (props: any) => sortComponentMock(props),
}));

jest.mock(
  "@/components/waves/leaderboard/header/WaveLeaderboardCurationGroupSelect",
  () => ({
    WaveLeaderboardCurationGroupSelect: (props: any) =>
      curationComponentMock(props),
  })
);

jest.mock(
  "@/components/waves/leaderboard/header/waveLeaderboardHeaderControls",
  () => ({
    resolveWaveLeaderboardHeaderControlModes: (...args: any[]) =>
      resolveControlModesMock(...args),
  })
);

jest.mock("@/hooks/useWave", () => ({
  useWave: (...args: any[]) => useWave(...args),
}));

jest.mock("@/components/utils/button/PrimaryButton", () => (props: any) => (
  <button data-testid="create" onClick={props.onClicked}>
    {props.children}
  </button>
));

jest.mock("react-use", () => ({
  createBreakpoint: jest.fn(() => () => "MD"),
}));

const wave = { id: "w" } as any;

beforeEach(() => {
  sortComponentMock.mockClear();
  curationComponentMock.mockClear();
  resolveControlModesMock.mockReset();
  resolveControlModesMock.mockReturnValue({
    sortMode: "dropdown",
    curationMode: "tabs",
    enableControlsScroll: false,
  });

  useWave.mockReturnValue({
    isMemesWave: true,
    participation: { isEligible: true },
  });
});

it("renders meme controls and handles actions", async () => {
  const user = userEvent.setup();
  const onCreate = jest.fn();
  const onViewModeChange = jest.fn();
  const onSortChange = jest.fn();
  render(
    <AuthContext.Provider value={{ connectedProfile: {} } as any}>
      <WaveLeaderboardHeader
        wave={wave}
        onCreateDrop={onCreate}
        viewMode="list"
        onViewModeChange={onViewModeChange}
        sort={WaveDropsLeaderboardSort.RANK}
        onSortChange={onSortChange}
      />
    </AuthContext.Provider>
  );

  await waitFor(() =>
    expect(screen.getByTestId("sort")).toHaveAttribute("data-mode", "dropdown")
  );

  await user.click(screen.getByRole("tab", { name: "List view" }));
  expect(onViewModeChange).toHaveBeenCalledWith("list");
  // sort
  await user.click(screen.getByTestId("sort"));
  expect(onSortChange).toHaveBeenCalledWith("SORT");
  // create drop
  await user.click(screen.getByTestId("create"));
  expect(onCreate).toHaveBeenCalled();
});

it("renders three view toggles and sort for non-meme waves", async () => {
  useWave.mockReturnValue({
    isMemesWave: false,
    participation: { isEligible: true },
  });
  const user = userEvent.setup();
  const onViewModeChange = jest.fn();
  const onSortChange = jest.fn();

  render(
    <AuthContext.Provider value={{ connectedProfile: {} } as any}>
      <WaveLeaderboardHeader
        wave={wave}
        onCreateDrop={jest.fn()}
        viewMode="grid_content_only"
        onViewModeChange={onViewModeChange}
        sort={WaveDropsLeaderboardSort.RANK}
        onSortChange={onSortChange}
      />
    </AuthContext.Provider>
  );

  await waitFor(() =>
    expect(screen.getByTestId("sort")).toHaveAttribute("data-mode", "dropdown")
  );

  expect(screen.getByTestId("sort")).toBeInTheDocument();
  await user.click(screen.getByTestId("sort"));
  expect(onSortChange).toHaveBeenCalledWith("SORT");
  await user.click(screen.getByRole("tab", { name: "Content only" }));
  expect(onViewModeChange).toHaveBeenCalledWith("grid_content_only");
});

it("renders curation selector and handles curation filter changes", async () => {
  const user = userEvent.setup();
  const onCurationGroupChange = jest.fn();

  render(
    <AuthContext.Provider value={{ connectedProfile: {} } as any}>
      <WaveLeaderboardHeader
        wave={wave}
        onCreateDrop={jest.fn()}
        viewMode="list"
        onViewModeChange={jest.fn()}
        sort={WaveDropsLeaderboardSort.RANK}
        onSortChange={jest.fn()}
        curationGroups={[
          {
            id: "cg-1",
            name: "Curators One",
            wave_id: "w",
            group_id: "g-1",
            created_at: 1,
            updated_at: 1,
          },
        ]}
        curatedByGroupId={null}
        onCurationGroupChange={onCurationGroupChange}
      />
    </AuthContext.Provider>
  );

  expect(screen.getByTestId("curation-group-select")).toBeInTheDocument();
  expect(screen.getByTestId("curation-group-select")).toHaveAttribute(
    "data-mode",
    "tabs"
  );
  await user.click(screen.getByTestId("curation-group-select"));
  expect(onCurationGroupChange).toHaveBeenCalledWith("cg-1");
});

it("does not render curation selector when curation controls are unavailable", () => {
  render(
    <AuthContext.Provider value={{ connectedProfile: {} } as any}>
      <WaveLeaderboardHeader
        wave={wave}
        onCreateDrop={jest.fn()}
        viewMode="list"
        onViewModeChange={jest.fn()}
        sort={WaveDropsLeaderboardSort.RANK}
        onSortChange={jest.fn()}
        curationGroups={[
          {
            id: "cg-1",
            name: "Curators One",
            wave_id: "w",
            group_id: "g-1",
            created_at: 1,
            updated_at: 1,
          },
        ]}
        curatedByGroupId={null}
      />
    </AuthContext.Provider>
  );

  expect(screen.queryByTestId("curation-group-select")).not.toBeInTheDocument();
});

it("applies resolved modes and enables scroll fallback styling when requested", async () => {
  resolveControlModesMock.mockReturnValue({
    sortMode: "dropdown",
    curationMode: "dropdown",
    enableControlsScroll: true,
  });

  render(
    <AuthContext.Provider value={{ connectedProfile: {} } as any}>
      <WaveLeaderboardHeader
        wave={wave}
        onCreateDrop={jest.fn()}
        viewMode="list"
        onViewModeChange={jest.fn()}
        sort={WaveDropsLeaderboardSort.RANK}
        onSortChange={jest.fn()}
        curationGroups={[
          {
            id: "cg-1",
            name: "Curators One",
            wave_id: "w",
            group_id: "g-1",
            created_at: 1,
            updated_at: 1,
          },
        ]}
        curatedByGroupId={null}
        onCurationGroupChange={jest.fn()}
      />
    </AuthContext.Provider>
  );

  await waitFor(() =>
    expect(screen.getByTestId("curation-group-select")).toHaveAttribute(
      "data-mode",
      "dropdown"
    )
  );
  expect(
    screen.getByTestId("leaderboard-header-controls-row").className
  ).toContain("tw-overflow-x-auto");
  expect(resolveControlModesMock).toHaveBeenCalled();
});
