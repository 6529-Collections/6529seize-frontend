import React from "react";
import { render, screen } from "@testing-library/react";
import { MemesSingleWaveDrop } from "@/components/waves/drop/MemesSingleWaveDrop";

const mockApprovalStatus = jest.fn();
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
    wave: { id: "w1" },
    extendedDrop: { id: "d1", wave: { id: "w1" } },
  }),
}));

jest.mock("@/hooks/waves/useApprovalWaveStatus", () => ({
  useApprovalWaveStatus: (args: any) => mockApprovalStatus(args),
}));

jest.mock("@/hooks/waves/useWaveMetadata", () => ({
  useWaveOutcomeVisibility: () => true,
}));

describe("MemesSingleWaveDrop", () => {
  beforeEach(() => {
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
