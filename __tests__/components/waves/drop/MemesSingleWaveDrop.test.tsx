import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemesSingleWaveDrop } from "@/components/waves/drop/MemesSingleWaveDrop";

jest.mock("@/components/content-moderation/ContentModerationDropGate", () => ({
  __esModule: true,
  default: ({ children }: any) => children,
}));

const mockApprovalStatus = jest.fn();
const mockRefetchWave = jest.fn();
let mockWaveError = false;
let mockWaveFetching = false;
let mockWrapperProps: any;
let mockInfoPanelProps: any;

jest.mock("@/components/waves/drop/SingleWaveDropWrapper", () => ({
  __esModule: true,
  SingleWaveDropWrapper: (props: any) => {
    mockWrapperProps = props;
    return <div data-testid="wrapper">{props.children}</div>;
  },
}));

jest.mock("@/components/waves/drop/MemesSingleWaveDropInfoPanel", () => ({
  __esModule: true,
  MemesSingleWaveDropInfoPanel: (props: any) => {
    mockInfoPanelProps = props;
    return <div data-testid="info-panel" data-wave={props.wave?.id} />;
  },
}));

jest.mock("@/components/waves/drop/useSingleWaveDropData", () => ({
  useSingleWaveDropData: () => ({
    drop: { id: "d1", wave: { id: "w1" } },
    wave: mockWaveError ? undefined : { id: "w1" },
    isWaveError: mockWaveError,
    isWaveFetching: mockWaveFetching,
    refetchWave: mockRefetchWave,
    extendedDrop: { id: "d1", wave: { id: "w1" } },
  }),
}));

jest.mock("@/hooks/waves/useApprovalWaveStatus", () => ({
  useApprovalWaveStatus: (args: any) => mockApprovalStatus(args),
}));

jest.mock("@/hooks/waves/useWaveMetadata", () => ({
  useWaveOutcomeVisibility: () => true,
  useWaveSubmissionButtonLabelOverride: () => null,
}));

describe("MemesSingleWaveDrop", () => {
  beforeEach(() => {
    mockWaveError = false;
    mockWaveFetching = false;
    mockRefetchWave.mockClear();
    mockWrapperProps = undefined;
    mockInfoPanelProps = undefined;
    mockApprovalStatus.mockReset();
    mockApprovalStatus.mockReturnValue({
      winningThreshold: null,
      winningThresholdMinDurationMs: null,
      isVotingClosed: false,
      isVotingControlsLocked: false,
    });
  });

  it("renders wrapper with memes info panel", () => {
    render(
      <MemesSingleWaveDrop
        drop={
          {
            id: "d1",
            wave: { id: "w1" },
            stableHash: "sh",
            stableKey: "sk",
          } as any
        }
        onClose={jest.fn()}
      />
    );

    expect(screen.getByTestId("wrapper")).toBeInTheDocument();
    expect(screen.getByTestId("info-panel")).toHaveAttribute("data-wave", "w1");
  });

  it("offers recovery when wave metadata fails instead of spinning indefinitely", () => {
    mockWaveError = true;
    const { rerender } = render(
      <MemesSingleWaveDrop
        drop={{ id: "d1", wave: { id: "w1" } } as any}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This content could not be loaded."
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(mockRefetchWave).toHaveBeenCalledTimes(1);
    mockWaveFetching = true;
    rerender(
      <MemesSingleWaveDrop
        drop={{ id: "d1", wave: { id: "w1" } } as any}
        onClose={jest.fn()}
      />
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Try again" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Loading…" })
    ).toBeInTheDocument();
    expect(screen.queryByTestId("wrapper")).not.toBeInTheDocument();
  });

  it("passes approval lock props into wrapper and info panel", () => {
    mockApprovalStatus.mockReturnValue({
      winningThreshold: 25,
      winningThresholdMinDurationMs: 120_000,
      isVotingClosed: true,
      isVotingControlsLocked: true,
    });

    render(
      <MemesSingleWaveDrop
        drop={
          {
            id: "d1",
            wave: { id: "w1" },
            stableHash: "sh",
            stableKey: "sk",
          } as any
        }
        onClose={jest.fn()}
      />
    );

    expect(mockApprovalStatus).toHaveBeenCalledWith({ wave: { id: "w1" } });
    expect(mockWrapperProps).toEqual(
      expect.objectContaining({
        winningThreshold: 25,
        winningThresholdMinDurationMs: 120_000,
        isVotingClosed: true,
        isVotingControlsLocked: true,
      })
    );
    expect(mockInfoPanelProps).toEqual(
      expect.objectContaining({
        isVotingClosed: true,
        isVotingControlsLocked: true,
      })
    );
  });
});
