import { AuthContext } from "@/components/auth/Auth";
import { WaveLeaderboardHeader } from "@/components/waves/leaderboard/header/WaveleaderboardHeader";
import { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/components/waves/leaderboard/header/WaveleaderboardSort", () => ({
  WaveleaderboardSort: (props: any) => (
    <button
      data-testid="sort"
      onClick={() => props.onSortChange("SORT" as any)}
    />
  ),
}));

jest.mock("@/hooks/useWave", () => ({
  useWave: () => ({ isMemesWave: true, participation: { isEligible: true } }),
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

it("renders controls and handles actions", async () => {
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
  // buttons for view mode
  const listBtn = screen.getAllByRole("button")[0];
  await user.click(listBtn);
  expect(onViewModeChange).toHaveBeenCalledWith("list");
  // sort
  await user.click(screen.getByTestId("sort"));
  expect(onSortChange).toHaveBeenCalledWith("SORT");
  // create drop
  await user.click(screen.getByTestId("create"));
  expect(onCreate).toHaveBeenCalled();
});
