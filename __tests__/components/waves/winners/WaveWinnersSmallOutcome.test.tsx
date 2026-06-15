import { fireEvent, render, screen } from "@testing-library/react";
import { WaveWinnersSmallOutcome } from "@/components/waves/winners/WaveWinnersSmallOutcome";
import useWaveOutcomeTooltipInteraction from "@/components/waves/outcome/useWaveOutcomeTooltipInteraction";
import { useWaveRankReward } from "@/hooks/waves/useWaveRankReward";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

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
jest.mock("@/hooks/waves/useWaveRankReward");
jest.mock("@/helpers/Helpers", () => ({
  formatNumberWithCommas: jest.fn((num: number) => num.toLocaleString("en-US")),
}));

const useWaveOutcomeTooltipInteractionMock =
  useWaveOutcomeTooltipInteraction as jest.Mock;
const useWaveRankRewardMock = useWaveRankReward as jest.Mock;

const drop = {
  id: "drop-123",
  rank: 7,
  wave: { id: "wave-123" },
} as ExtendedDrop;

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

describe("WaveWinnersSmallOutcome", () => {
  beforeEach(() => {
    mockTooltipInteraction();
    useWaveRankRewardMock.mockReturnValue({
      nicTotal: 0,
      repTotal: 0,
      manualOutcomes: [],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when there are no outcomes", () => {
    const { container } = render(<WaveWinnersSmallOutcome drop={drop} />);

    expect(container.firstChild).toBeNull();
  });

  it("renders outcome details from rank rewards", () => {
    useWaveRankRewardMock.mockReturnValue({
      nicTotal: 1234,
      repTotal: 56,
      manualOutcomes: ["Special Award"],
    });

    render(<WaveWinnersSmallOutcome drop={drop} />);

    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByText("Outcome:")).toBeInTheDocument();
    expect(
      screen.getByTestId("tooltip-outcome-small-drop-123")
    ).toHaveAttribute(
      "data-open-events",
      JSON.stringify({ mouseenter: true, focus: true })
    );
    expect(screen.getByText("Outcome Details")).toBeInTheDocument();
    expect(screen.getByText("1,234")).toBeInTheDocument();
    expect(screen.getByText("56")).toBeInTheDocument();
    expect(screen.getByText("Special Award")).toBeInTheDocument();
  });

  it("uses click activation without bubbling when touch-style tooltip mode is active", () => {
    const parentClickHandler = jest.fn();
    mockTooltipInteraction(true);
    useWaveRankRewardMock.mockReturnValue({
      nicTotal: 1,
      repTotal: 0,
      manualOutcomes: [],
    });

    render(
      <div onClick={parentClickHandler}>
        <WaveWinnersSmallOutcome drop={drop} />
      </div>
    );

    fireEvent.click(screen.getByRole("button"));

    expect(parentClickHandler).not.toHaveBeenCalled();
    expect(
      screen.getByTestId("tooltip-outcome-small-drop-123")
    ).toHaveAttribute(
      "data-open-events",
      JSON.stringify({ click: true, focus: true })
    );
  });

  it("lets clicks bubble when hover tooltip mode is active", () => {
    const parentClickHandler = jest.fn();
    useWaveRankRewardMock.mockReturnValue({
      nicTotal: 1,
      repTotal: 0,
      manualOutcomes: [],
    });

    render(
      <div onClick={parentClickHandler}>
        <WaveWinnersSmallOutcome drop={drop} />
      </div>
    );

    fireEvent.click(screen.getByRole("button"));

    expect(parentClickHandler).toHaveBeenCalledTimes(1);
  });

  it("loads rewards for the drop wave and rank", () => {
    useWaveRankRewardMock.mockReturnValue({
      nicTotal: 1,
      repTotal: 0,
      manualOutcomes: [],
    });

    render(<WaveWinnersSmallOutcome drop={drop} />);

    expect(useWaveRankRewardMock).toHaveBeenCalledWith({
      waveId: "wave-123",
      rank: 7,
    });
  });
});
