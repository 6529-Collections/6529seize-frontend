import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { DefaultSingleWaveDrop } from "@/components/waves/drop/DefaultSingleWaveDrop";

jest.mock("@/components/content-moderation/ContentModerationDropGate", () => ({
  __esModule: true,
  default: ({ children }: any) => children,
}));

const mockApprovalStatus = jest.fn();
const mockRefetchWave = jest.fn();
let mockWaveError = false;
let mockWrapperProps: any;
let mockInfoPanelProps: any;

jest.mock("@/components/waves/drop/SingleWaveDropWrapper", () => ({
  __esModule: true,
  SingleWaveDropWrapper: (props: any) => {
    mockWrapperProps = props;
    return <div data-testid="wrapper">{props.children}</div>;
  },
}));

jest.mock("@/components/waves/drop/SingleWaveDropInfoPanel", () => ({
  __esModule: true,
  SingleWaveDropInfoPanel: (props: any) => {
    mockInfoPanelProps = props;
    return <div data-testid="info-panel" />;
  },
}));

jest.mock("@/components/waves/drop/useSingleWaveDropData", () => ({
  useSingleWaveDropData: () => ({
    drop: { id: "1", wave: { id: "w1" } },
    wave: mockWaveError ? undefined : { id: "w1" },
    isWaveError: mockWaveError,
    refetchWave: mockRefetchWave,
    extendedDrop: { id: "1", wave: { id: "w1" } },
  }),
}));

jest.mock("@/hooks/waves/useApprovalWaveStatus", () => ({
  useApprovalWaveStatus: (args: any) => mockApprovalStatus(args),
}));

describe("DefaultSingleWaveDrop", () => {
  beforeEach(() => {
    mockWaveError = false;
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

  it("renders wrapper with info panel", () => {
    render(
      <DefaultSingleWaveDrop
        drop={
          {
            id: "1",
            wave: { id: "w1" },
            stableHash: "sh",
            stableKey: "sk",
          } as any
        }
        onClose={jest.fn()}
      />
    );

    expect(screen.getByTestId("wrapper")).toBeInTheDocument();
    expect(screen.getByTestId("info-panel")).toBeInTheDocument();
  });

  it("offers recovery when wave metadata fails instead of spinning indefinitely", () => {
    mockWaveError = true;
    render(
      <DefaultSingleWaveDrop
        drop={{ id: "d1", wave: { id: "w1" } } as any}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This drop could not be loaded."
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(mockRefetchWave).toHaveBeenCalledTimes(1);
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
      <DefaultSingleWaveDrop
        drop={
          {
            id: "1",
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
