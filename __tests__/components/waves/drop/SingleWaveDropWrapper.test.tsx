import React from "react";
import { render, screen } from "@testing-library/react";
import { SingleWaveDropWrapper } from "@/components/waves/drop/SingleWaveDropWrapper";

const mockChatProps: any[] = [];

jest.mock("@/components/waves/drop/SingleWaveDropChat", () => ({
  __esModule: true,
  SingleWaveDropChat: (props: any) => {
    mockChatProps.push(props);
    return <div data-testid="chat" />;
  },
}));

jest.mock("@/hooks/useMediaQuery", () => ({
  useMediaQuery: () => false,
}));

jest.mock("@/utils/monitoring/dropOpenTiming", () => ({
  markDropOpenReady: jest.fn(),
}));

jest.mock("@headlessui/react", () => ({
  Transition: {
    Root: ({ show, children }: any) => (show ? <>{children}</> : null),
    Child: ({ children }: any) => <>{children}</>,
  },
}));

describe("SingleWaveDropWrapper", () => {
  beforeEach(() => {
    mockChatProps.length = 0;
  });

  it("passes approval lock props into SingleWaveDropChat", () => {
    const drop: any = { id: "d1" };
    const wave: any = { id: "w1" };

    render(
      <SingleWaveDropWrapper
        drop={drop}
        wave={wave}
        onClose={jest.fn()}
        winningThreshold={25}
        winningThresholdMinDurationMs={120_000}
        isVotingClosed={true}
        isVotingControlsLocked={true}
      >
        <div data-testid="child" />
      </SingleWaveDropWrapper>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(mockChatProps).toEqual([
      expect.objectContaining({
        drop,
        wave,
        winningThreshold: 25,
        winningThresholdMinDurationMs: 120_000,
        isVotingClosed: true,
        isVotingControlsLocked: true,
      }),
    ]);
  });
});
