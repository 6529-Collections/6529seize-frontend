import { WaveleaderboardSort } from "@/components/waves/leaderboard/header/WaveleaderboardSort";
import { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

let mockBreakpoint = "MD";
const commonDropdownMock = jest.fn((props: any) => (
  <button
    data-testid="mobile-sort"
    onClick={() => props.setSelected(WaveDropsLeaderboardSort.CREATED_AT)}
  >
    {props.filterLabel}: {props.activeItem}
  </button>
));

jest.mock("react-use", () => ({
  createBreakpoint: jest.fn(() => () => mockBreakpoint),
}));

jest.mock("@/components/utils/select/dropdown/CommonDropdown", () => ({
  __esModule: true,
  default: (props: any) => commonDropdownMock(props),
}));

describe("WaveleaderboardSort", () => {
  beforeEach(() => {
    mockBreakpoint = "MD";
    commonDropdownMock.mockClear();
  });

  it("shows desktop sort tabs and triggers changes on desktop", async () => {
    const onSortChange = jest.fn();
    const user = userEvent.setup();
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <WaveleaderboardSort
          sort={WaveDropsLeaderboardSort.RANK}
          onSortChange={onSortChange}
        />
      </QueryClientProvider>
    );

    const current = screen.getByText("Current Vote");
    expect(current.className).toContain("tw-bg-white/10");

    await user.click(screen.getByText("Projected Vote"));
    expect(onSortChange).toHaveBeenCalledWith(
      WaveDropsLeaderboardSort.RATING_PREDICTION
    );

    await user.click(screen.getByText("Hot"));
    expect(onSortChange).toHaveBeenCalledWith(WaveDropsLeaderboardSort.TREND);

    await user.click(screen.getByText("Newest"));
    expect(onSortChange).toHaveBeenCalledWith(
      WaveDropsLeaderboardSort.CREATED_AT
    );

    expect(commonDropdownMock).not.toHaveBeenCalled();
  });

  it("shows dropdown sort and forwards selection on small screens", async () => {
    mockBreakpoint = "S";

    const onSortChange = jest.fn();
    const user = userEvent.setup();
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <WaveleaderboardSort
          sort={WaveDropsLeaderboardSort.RANK}
          onSortChange={onSortChange}
        />
      </QueryClientProvider>
    );

    expect(screen.queryByText("Current Vote")).not.toBeInTheDocument();
    expect(screen.getByTestId("mobile-sort")).toHaveTextContent("Sort: RANK");
    expect(screen.getByTestId("mobile-sort").parentElement).toHaveClass(
      "tw-w-full",
      "tw-min-w-0"
    );
    expect(
      screen.getByTestId("mobile-sort").parentElement?.className
    ).not.toContain("tw-w-[11rem]");

    await user.click(screen.getByTestId("mobile-sort"));
    expect(onSortChange).toHaveBeenCalledWith(
      WaveDropsLeaderboardSort.CREATED_AT
    );
  });
});
