import { WaveleaderboardSort } from "@/components/waves/leaderboard/header/WaveleaderboardSort";
import { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const commonDropdownMock = jest.fn((props: any) => (
  <button
    data-testid="sort-dropdown"
    onClick={() => props.setSelected(WaveDropsLeaderboardSort.CREATED_AT)}
  >
    {props.filterLabel}: {props.activeItem}
  </button>
));

jest.mock("@/components/utils/select/dropdown/CommonDropdown", () => ({
  __esModule: true,
  default: (props: any) => commonDropdownMock(props),
}));

describe("WaveleaderboardSort", () => {
  beforeEach(() => {
    commonDropdownMock.mockClear();
  });

  it("always renders dropdown sort and forwards selection", async () => {
    const onSortChange = jest.fn();
    const user = userEvent.setup();

    render(
      <WaveleaderboardSort
        sort={WaveDropsLeaderboardSort.RANK}
        onSortChange={onSortChange}
      />
    );

    expect(screen.getByTestId("sort-dropdown")).toHaveTextContent("Sort: RANK");
    expect(screen.getByTestId("sort-dropdown").parentElement).toHaveClass(
      "tw-min-w-0"
    );

    await user.click(screen.getByTestId("sort-dropdown"));
    expect(onSortChange).toHaveBeenCalledWith(
      WaveDropsLeaderboardSort.CREATED_AT
    );
  });

  it("passes correct props to CommonDropdown", () => {
    render(
      <WaveleaderboardSort
        sort={WaveDropsLeaderboardSort.TREND}
        onSortChange={jest.fn()}
      />
    );

    expect(commonDropdownMock).toHaveBeenCalledWith(
      expect.objectContaining({
        activeItem: WaveDropsLeaderboardSort.TREND,
        filterLabel: "Sort",
        size: "sm",
        showFilterLabel: true,
      })
    );

    const items = commonDropdownMock.mock.calls[0]![0].items;
    expect(items).toHaveLength(4);
    expect(items.map((i: any) => i.label)).toEqual([
      "Current Vote",
      "Projected Vote",
      "Hot",
      "Newest",
    ]);
  });
});
