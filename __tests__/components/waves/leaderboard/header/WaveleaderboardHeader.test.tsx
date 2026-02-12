import { AuthContext } from "@/components/auth/Auth";
import { WaveLeaderboardHeader } from "@/components/waves/leaderboard/header/WaveleaderboardHeader";
import { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const useWave = jest.fn();

jest.mock("@/components/waves/leaderboard/header/WaveleaderboardSort", () => ({
  WaveleaderboardSort: (props: any) => (
    <button
      data-testid="sort"
      onClick={() => props.onSortChange("SORT" as any)}
    />
  ),
}));

jest.mock(
  "@/components/waves/leaderboard/header/WaveLeaderboardCurationGroupSelect",
  () => ({
    WaveLeaderboardCurationGroupSelect: (props: any) => (
      <button
        data-testid="curation-group-select"
        onClick={() => props.onChange("cg-1")}
      >
        Curation
      </button>
    ),
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
  await user.click(screen.getByRole("button", { name: "List view" }));
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

  expect(screen.getByTestId("sort")).toBeInTheDocument();
  await user.click(screen.getByTestId("sort"));
  expect(onSortChange).toHaveBeenCalledWith("SORT");
  await user.click(screen.getByRole("button", { name: "Content only" }));
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
