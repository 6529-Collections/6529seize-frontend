import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { WaveWinners } from "@/components/waves/winners/WaveWinners";
import { useWaveDecisions } from "@/hooks/waves/useWaveDecisions";
import { useWave } from "@/hooks/useWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { FULL_APPROVAL_WAVE_DECISIONS_PAGE_SIZE } from "@/hooks/waves/useWaveDecisions";

jest.mock("@/hooks/waves/useWaveDecisions", () => ({
  FULL_APPROVAL_WAVE_DECISIONS_PAGE_SIZE: 2000,
  useWaveDecisions: jest.fn(),
}));
jest.mock("@/hooks/useWave");
jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ winnersViewStyle: {} }),
}));

const Timeline = jest.fn(() => <div data-testid="timeline" />);
const Podium = jest.fn(() => <div data-testid="podium" />);
const Drops = jest.fn(() => <div data-testid="drops" />);

jest.mock("@/components/waves/winners/WaveWinnersTimeline", () => ({
  WaveWinnersTimeline: (p: any) => Timeline(p),
}));
jest.mock("@/components/waves/winners/podium/WaveWinnersPodium", () => ({
  WaveWinnersPodium: (p: any) => Podium(p),
}));
jest.mock("@/components/waves/winners/drops/WaveWinnersDrops", () => ({
  WaveWinnersDrops: (p: any) => Drops(p),
}));

const wave = { id: "w1", wave: { type: ApiWaveType.Rank } } as any;

describe("WaveWinners", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders timeline when multi decision", () => {
    (useWave as jest.Mock).mockReturnValue({
      decisions: { multiDecision: true },
    });
    (useWaveDecisions as jest.Mock).mockReturnValue({
      decisionPoints: [],
      isFetching: false,
      isLoadingAllPages: false,
    });
    render(<WaveWinners wave={wave} onDropClick={jest.fn()} />);
    expect(Timeline).toHaveBeenCalled();
  });

  it("renders podium and drops for single decision", () => {
    (useWave as jest.Mock).mockReturnValue({
      decisions: { multiDecision: false },
    });
    (useWaveDecisions as jest.Mock).mockReturnValue({
      decisionPoints: [{ winners: [] }],
      isFetching: false,
      isLoadingAllPages: false,
    });
    render(<WaveWinners wave={wave} onDropClick={jest.fn()} />);
    expect(Podium).toHaveBeenCalled();
    expect(Drops).toHaveBeenCalled();
  });

  it("renders approved drops for approve waves", () => {
    (useWave as jest.Mock).mockReturnValue({
      decisions: { multiDecision: true },
    });
    (useWaveDecisions as jest.Mock).mockReturnValue({
      decisionPoints: [{ winners: [{ drop: { id: "d1" } }] }],
      isFetching: false,
      isLoadingAllPages: false,
    });
    render(
      <WaveWinners
        wave={{ ...wave, wave: { type: ApiWaveType.Approve } }}
        onDropClick={jest.fn()}
      />
    );

    expect(Timeline).not.toHaveBeenCalled();
    expect(Podium).not.toHaveBeenCalled();
    expect(Drops).toHaveBeenCalledWith(
      expect.objectContaining({
        isApprovalWave: true,
        emptyMessage: "No drops approved yet",
        winners: [{ drop: { id: "d1" } }],
      })
    );
    expect(useWaveDecisions).toHaveBeenCalledWith({
      waveId: "w1",
      enabled: true,
      loadAllPages: true,
      pageSize: FULL_APPROVAL_WAVE_DECISIONS_PAGE_SIZE,
    });
  });

  it("shows approve-wave full-load error instead of partial drops", () => {
    const fetchNextPage = jest.fn();
    const refetch = jest.fn();
    (useWave as jest.Mock).mockReturnValue({
      decisions: { multiDecision: true },
    });
    (useWaveDecisions as jest.Mock).mockReturnValue({
      decisionPoints: [{ winners: [{ drop: { id: "partial" } }] }],
      isFetching: false,
      isLoadingAllPages: false,
      isLoadingAllPagesError: true,
      fetchNextPage,
      refetch,
      hasNextPage: true,
    });

    render(
      <WaveWinners
        wave={{ ...wave, wave: { type: ApiWaveType.Approve } }}
        onDropClick={jest.fn()}
      />
    );

    expect(
      screen.getByText("Unable to load approved drops.")
    ).toBeInTheDocument();
    expect(Drops).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
    expect(refetch).not.toHaveBeenCalled();
  });

  it("refetches approve winners when full-load error has no next page", () => {
    const fetchNextPage = jest.fn();
    const refetch = jest.fn();
    (useWave as jest.Mock).mockReturnValue({
      decisions: { multiDecision: true },
    });
    (useWaveDecisions as jest.Mock).mockReturnValue({
      decisionPoints: [{ winners: [{ drop: { id: "partial" } }] }],
      isFetching: false,
      isLoadingAllPages: false,
      isLoadingAllPagesError: true,
      fetchNextPage,
      refetch,
      hasNextPage: false,
    });

    render(
      <WaveWinners
        wave={{ ...wave, wave: { type: ApiWaveType.Approve } }}
        onDropClick={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(refetch).toHaveBeenCalledTimes(1);
    expect(fetchNextPage).not.toHaveBeenCalled();
  });
});
