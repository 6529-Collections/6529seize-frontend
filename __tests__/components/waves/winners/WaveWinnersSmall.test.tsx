import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { WaveWinnersSmall } from "@/components/waves/winners/WaveWinnersSmall";
import { useWaveDecisions } from "@/hooks/waves/useWaveDecisions";
import { useWave } from "@/hooks/useWave";
import { FULL_APPROVAL_WAVE_DECISIONS_PAGE_SIZE } from "@/hooks/waves/useWaveDecisions";

jest.mock("@/hooks/waves/useWaveDecisions", () => ({
  FULL_APPROVAL_WAVE_DECISIONS_PAGE_SIZE: 2000,
  useWaveDecisions: jest.fn(),
}));
jest.mock("@/hooks/useWave");

const ItemMock = jest.fn(() => <div data-testid="item" />);
const SelectorMock = jest.fn(() => <div data-testid="selector" />);
const LoadingMock = jest.fn(() => <div data-testid="loading" />);
const EmptyMock = jest.fn(() => <div data-testid="empty" />);
const mockWave: any = { id: "w" };

jest.mock("@/components/waves/winners/WaveWinnerItemSmall", () => ({
  WaveWinnerItemSmall: (props: any) => ItemMock(props),
}));
jest.mock(
  "@/components/waves/winners/WaveWinnersSmallDecisionSelector",
  () => ({
    WaveWinnersSmallDecisionSelector: (props: any) => SelectorMock(props),
  })
);
jest.mock("@/components/waves/winners/WaveWinnersSmallLoading", () => ({
  WaveWinnersSmallLoading: () => LoadingMock(),
}));
jest.mock("@/components/waves/winners/WaveWinnersSmallEmpty", () => ({
  WaveWinnersSmallEmpty: (props: any) => EmptyMock(props),
}));
jest.mock("@/helpers/waves/drop.helpers", () => ({
  convertApiDropToExtendedDrop: (d: any) => ({
    ...d,
    type: "FULL",
    wave: mockWave,
  }),
}));

describe("WaveWinnersSmall", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading state", () => {
    (useWaveDecisions as jest.Mock).mockReturnValue({
      decisionPoints: [],
      isFetching: true,
      isLoadingAllPages: false,
    });
    (useWave as jest.Mock).mockReturnValue({
      decisions: { multiDecision: false },
    });
    render(<WaveWinnersSmall wave={mockWave} onDropClick={jest.fn()} />);
    expect(LoadingMock).toHaveBeenCalled();
  });

  it("shows empty state", () => {
    (useWaveDecisions as jest.Mock).mockReturnValue({
      decisionPoints: [],
      isFetching: false,
      isLoadingAllPages: false,
    });
    (useWave as jest.Mock).mockReturnValue({
      decisions: { multiDecision: true },
    });
    render(<WaveWinnersSmall wave={mockWave} onDropClick={jest.fn()} />);
    expect(EmptyMock).toHaveBeenCalled();
  });

  it("renders winners for single decision", () => {
    (useWaveDecisions as jest.Mock).mockReturnValue({
      decisionPoints: [
        { decision_time: 1, winners: [{ drop: { id: "d" }, place: 1 }] },
      ],
      isFetching: false,
      isLoadingAllPages: false,
    });
    (useWave as jest.Mock).mockReturnValue({
      decisions: { multiDecision: false },
    });
    render(<WaveWinnersSmall wave={mockWave} onDropClick={jest.fn()} />);
    expect(ItemMock).toHaveBeenCalled();
  });

  it("renders selector for multi decision", () => {
    (useWaveDecisions as jest.Mock).mockReturnValue({
      decisionPoints: [
        { decision_time: 1, winners: [{ drop: { id: "d" }, place: 1 }] },
      ],
      isFetching: false,
      isLoadingAllPages: false,
    });
    (useWave as jest.Mock).mockReturnValue({
      decisions: { multiDecision: true },
    });
    render(<WaveWinnersSmall wave={mockWave} onDropClick={jest.fn()} />);
    expect(SelectorMock).toHaveBeenCalled();
  });

  it("renders approved drops without selector for approve waves", () => {
    (useWaveDecisions as jest.Mock).mockReturnValue({
      decisionPoints: [
        {
          decision_time: 1,
          winners: [{ drop: { id: "older" }, place: 1 }],
        },
        {
          decision_time: 2,
          winners: [{ drop: { id: "newer" }, place: 2 }],
        },
      ],
      isFetching: false,
      isLoadingAllPages: false,
    });
    (useWave as jest.Mock).mockReturnValue({
      decisions: { multiDecision: true },
      isApproveWave: true,
      isQuorumWave: false,
    });
    render(<WaveWinnersSmall wave={mockWave} onDropClick={jest.fn()} />);
    expect(ItemMock).toHaveBeenCalled();
    expect(ItemMock.mock.calls.map(([props]) => props.drop.id)).toEqual([
      "newer",
      "older",
    ]);
    expect(SelectorMock).not.toHaveBeenCalled();
    expect(useWaveDecisions).toHaveBeenCalledWith({
      waveId: "w",
      enabled: true,
      loadAllPages: true,
      pageSize: FULL_APPROVAL_WAVE_DECISIONS_PAGE_SIZE,
    });
  });

  it("uses quorum compact content for quorum approve waves", () => {
    (useWaveDecisions as jest.Mock).mockReturnValue({
      decisionPoints: [
        {
          decision_time: 1,
          winners: [{ drop: { id: "d" }, place: 1 }],
        },
      ],
      isFetching: false,
      isLoadingAllPages: false,
    });
    (useWave as jest.Mock).mockReturnValue({
      decisions: { multiDecision: true },
      isApproveWave: true,
      isQuorumWave: true,
    });

    render(<WaveWinnersSmall wave={mockWave} onDropClick={jest.fn()} />);

    expect(ItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        contentPresentation: "quorumCompact",
      })
    );
  });

  it("shows approval empty state for approve waves", () => {
    (useWaveDecisions as jest.Mock).mockReturnValue({
      decisionPoints: [],
      isFetching: false,
      isLoadingAllPages: false,
    });
    (useWave as jest.Mock).mockReturnValue({
      decisions: { multiDecision: true },
      isApproveWave: true,
    });
    render(<WaveWinnersSmall wave={mockWave} onDropClick={jest.fn()} />);
    expect(EmptyMock).toHaveBeenCalledWith({
      title: "No approvals yet",
      message: "No drops approved yet",
    });
  });

  it("shows approve-wave full-load error instead of partial drops", () => {
    const fetchNextPage = jest.fn();
    const refetch = jest.fn();
    (useWaveDecisions as jest.Mock).mockReturnValue({
      decisionPoints: [
        { decision_time: 1, winners: [{ drop: { id: "partial" }, place: 1 }] },
      ],
      isFetching: false,
      isLoadingAllPages: false,
      isLoadingAllPagesError: true,
      fetchNextPage,
      refetch,
      hasNextPage: true,
    });
    (useWave as jest.Mock).mockReturnValue({
      decisions: { multiDecision: true },
      isApproveWave: true,
    });

    render(<WaveWinnersSmall wave={mockWave} onDropClick={jest.fn()} />);

    expect(
      screen.getByText("Unable to load approved drops.")
    ).toBeInTheDocument();
    expect(ItemMock).not.toHaveBeenCalled();
    expect(EmptyMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
    expect(refetch).not.toHaveBeenCalled();
  });

  it("refetches approve winners when full-load error has no next page", () => {
    const fetchNextPage = jest.fn();
    const refetch = jest.fn();
    (useWaveDecisions as jest.Mock).mockReturnValue({
      decisionPoints: [],
      isFetching: false,
      isLoadingAllPages: false,
      isLoadingAllPagesError: true,
      fetchNextPage,
      refetch,
      hasNextPage: false,
    });
    (useWave as jest.Mock).mockReturnValue({
      decisions: { multiDecision: true },
      isApproveWave: true,
    });

    render(<WaveWinnersSmall wave={mockWave} onDropClick={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(refetch).toHaveBeenCalledTimes(1);
    expect(fetchNextPage).not.toHaveBeenCalled();
  });
});
