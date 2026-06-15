import { fireEvent, render, screen } from "@testing-library/react";
import { WaveSmallLeaderboardItemOutcomes } from "@/components/waves/small-leaderboard/WaveSmallLeaderboardItemOutcomes";
import useWaveOutcomeTooltipInteraction from "@/components/waves/outcome/useWaveOutcomeTooltipInteraction";

const mockUseWaveRankReward = jest.fn();

jest.mock("react-tooltip", () => ({
  Tooltip: ({
    children,
    id,
    openEvents,
    closeEvents,
    globalCloseEvents,
  }: any) => (
    <div
      data-testid={`tooltip-${id}`}
      data-open-events={JSON.stringify(openEvents)}
      data-close-events={JSON.stringify(closeEvents)}
      data-global-close-events={JSON.stringify(globalCloseEvents)}
    >
      {children}
    </div>
  ),
}));

jest.mock("@/components/waves/outcome/useWaveOutcomeTooltipInteraction");

jest.mock("@/hooks/waves/useWaveRankReward", () => ({
  useWaveRankReward: (args: any) => mockUseWaveRankReward(args),
}));

const useWaveOutcomeTooltipInteractionMock =
  useWaveOutcomeTooltipInteraction as jest.Mock;

function mockTooltipInteraction(useClickActivation = false) {
  useWaveOutcomeTooltipInteractionMock.mockReturnValue({
    useClickActivation,
    tooltipOpenEvents: useClickActivation
      ? { click: true, focus: true }
      : { mouseenter: true, focus: true },
    tooltipCloseEvents: useClickActivation
      ? { click: true, blur: true }
      : { mouseleave: true, blur: true },
    tooltipGlobalCloseEvents: useClickActivation
      ? { clickOutsideAnchor: true }
      : {},
  });
}

describe("WaveSmallLeaderboardItemOutcomes", () => {
  const drop: any = { id: "drop-1", rank: 1, wave: { id: "w1" } };

  beforeEach(() => {
    mockUseWaveRankReward.mockReset();
    mockTooltipInteraction();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders button when outcomes exist", () => {
    mockUseWaveRankReward.mockReturnValue({
      nicTotal: 10,
      repTotal: 20,
      manualOutcomes: ["Award"],
      isLoading: false,
    });

    render(<WaveSmallLeaderboardItemOutcomes drop={drop} />);
    expect(screen.getByRole("button", { name: "Outcome" })).toBeInTheDocument();
  });

  it("hides when no outcomes and not loading", () => {
    mockUseWaveRankReward.mockReturnValue({
      nicTotal: 0,
      repTotal: 0,
      manualOutcomes: [],
      isLoading: false,
    });

    const { container } = render(
      <WaveSmallLeaderboardItemOutcomes drop={drop} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows loading state", () => {
    mockUseWaveRankReward.mockReturnValue({
      nicTotal: 0,
      repTotal: 0,
      manualOutcomes: [],
      isLoading: true,
    });
    const { container } = render(
      <WaveSmallLeaderboardItemOutcomes drop={drop} />
    );
    expect(container.querySelector(".tw-animate-pulse")).toBeInTheDocument();
  });

  it("passes shared tooltip events through to the tooltip", () => {
    const parentClickHandler = jest.fn();
    mockTooltipInteraction(true);
    mockUseWaveRankReward.mockReturnValue({
      nicTotal: 10,
      repTotal: 0,
      manualOutcomes: [],
      isLoading: false,
    });

    render(
      <div onClick={parentClickHandler}>
        <WaveSmallLeaderboardItemOutcomes drop={drop} />
      </div>
    );

    fireEvent.click(screen.getByRole("button", { name: "Outcome" }));

    expect(parentClickHandler).not.toHaveBeenCalled();
    expect(
      screen.getByTestId("tooltip-wave-outcomes-drop-1")
    ).toHaveAttribute(
      "data-open-events",
      JSON.stringify({ click: true, focus: true })
    );
    expect(
      screen.getByTestId("tooltip-wave-outcomes-drop-1")
    ).toHaveAttribute(
      "data-close-events",
      JSON.stringify({ click: true, blur: true })
    );
    expect(
      screen.getByTestId("tooltip-wave-outcomes-drop-1")
    ).toHaveAttribute(
      "data-global-close-events",
      JSON.stringify({ clickOutsideAnchor: true })
    );
  });
});
