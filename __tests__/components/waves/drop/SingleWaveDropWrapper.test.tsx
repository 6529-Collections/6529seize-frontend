import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { SingleWaveDropWrapper } from "@/components/waves/drop/SingleWaveDropWrapper";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";

const mockChatProps: any[] = [];

jest.mock("@/components/waves/drop/SingleWaveDropChat", () => ({
  __esModule: true,
  SingleWaveDropChat: (props: any) => {
    mockChatProps.push(props);
    return <div data-testid="chat" />;
  },
}));

jest.mock("@/hooks/useIsMobileLayoutViewport", () => ({
  __esModule: true,
  default: jest.fn(() => false),
}));

jest.mock("@/utils/monitoring/dropOpenTiming", () => ({
  markDropOpenReady: jest.fn(),
}));

jest.mock("@headlessui/react", () => ({
  Dialog: ({ children, ...props }: any) => (
    <div role="dialog" aria-label={props["aria-label"]}>
      {children}
    </div>
  ),
  DialogPanel: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
  Transition: ({ show, children }: any) => (show ? <>{children}</> : null),
  TransitionChild: ({ children }: any) => <>{children}</>,
}));

const mockedUseIsMobileLayoutViewport =
  useIsMobileLayoutViewport as jest.MockedFunction<
    typeof useIsMobileLayoutViewport
  >;

describe("SingleWaveDropWrapper", () => {
  beforeEach(() => {
    mockChatProps.length = 0;
    mockedUseIsMobileLayoutViewport.mockReturnValue(false);
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
    expect(screen.queryByTestId("chat")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show chat" }));

    expect(screen.getAllByTestId("chat")).toHaveLength(1);
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

  it("docks the mobile chat panel above the native keyboard inset", () => {
    mockedUseIsMobileLayoutViewport.mockReturnValue(true);
    const { container } = render(
      <SingleWaveDropWrapper
        drop={{ id: "d1" } as any}
        wave={{ id: "w1" } as any}
        onClose={jest.fn()}
      >
        <div />
      </SingleWaveDropWrapper>
    );

    fireEvent.click(screen.getByRole("button", { name: "Show chat" }));

    expect(
      screen.getByRole("dialog", { name: "Drop chat" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close chat" })).toBeVisible();
    expect(screen.getAllByTestId("chat")).toHaveLength(1);

    const mobileChatPanel = container.querySelector<HTMLElement>(
      'div[style*="--native-keyboard-inset-bottom"]'
    );

    expect(mobileChatPanel).toBeInstanceOf(HTMLElement);
    const panel = mobileChatPanel as HTMLElement;

    expect(panel.style.bottom).toBe("var(--native-keyboard-inset-bottom, 0px)");
    expect(panel.style.transition).toBe(
      "bottom var(--native-keyboard-layout-transition-duration, 0ms) ease-out"
    );
    expect(panel).toHaveClass("tw-max-h-[100dvh]");
  });

  it("keeps exactly one chat tree mounted when the layout changes", () => {
    mockedUseIsMobileLayoutViewport.mockReturnValue(true);
    const props = {
      drop: { id: "d1" } as any,
      wave: { id: "w1" } as any,
      onClose: jest.fn(),
    };
    const { rerender } = render(
      <SingleWaveDropWrapper {...props}>
        <div />
      </SingleWaveDropWrapper>
    );

    fireEvent.click(screen.getByRole("button", { name: "Show chat" }));
    expect(screen.getAllByTestId("chat")).toHaveLength(1);

    mockedUseIsMobileLayoutViewport.mockReturnValue(false);
    rerender(
      <SingleWaveDropWrapper {...props}>
        <div />
      </SingleWaveDropWrapper>
    );

    expect(screen.getAllByTestId("chat")).toHaveLength(1);
  });
});
