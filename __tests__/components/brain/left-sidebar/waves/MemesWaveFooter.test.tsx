import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import MemesWaveFooter from "@/components/brain/left-sidebar/waves/MemesWaveFooter";
import { useMemesWaveFooterStats } from "@/hooks/useMemesWaveFooterStats";
import { MEMES_WAVE_FLOATING_FOOTER_FALLBACK_BOTTOM_STYLE } from "@/components/brain/left-sidebar/waves/MemesWaveFooter.constants";
import { MOBILE_BOTTOM_NAV_DOCK_ATTRIBUTE } from "@/helpers/navigation.helpers";

jest.mock("@/hooks/useMemesWaveFooterStats", () => ({
  useMemesWaveFooterStats: jest.fn(),
}));

const useMemesWaveFooterStatsMock =
  useMemesWaveFooterStats as jest.MockedFunction<
    typeof useMemesWaveFooterStats
  >;

describe("MemesWaveFooter", () => {
  const onOpenQuickVote = jest.fn();
  const onPrefetchQuickVote = jest.fn();
  let originalRequestAnimationFrame:
    | typeof globalThis.requestAnimationFrame
    | undefined;
  let originalCancelAnimationFrame:
    | typeof globalThis.cancelAnimationFrame
    | undefined;
  let originalInnerHeightDescriptor: PropertyDescriptor | undefined;

  const createDockRect = ({
    height,
    top,
  }: {
    readonly height: number;
    readonly top: number;
  }): DOMRect =>
    ({
      bottom: top + height,
      height,
      left: 0,
      right: 390,
      top,
      width: 390,
      x: 0,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect;

  const createMeasuredDock = ({
    height,
    top,
  }: {
    readonly height: number;
    readonly top: number;
  }) => {
    const dock = document.createElement("div");
    dock.setAttribute(MOBILE_BOTTOM_NAV_DOCK_ATTRIBUTE, "true");
    dock.getBoundingClientRect = jest.fn(() => createDockRect({ height, top }));
    document.body.appendChild(dock);

    return dock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    originalRequestAnimationFrame = globalThis.requestAnimationFrame;
    originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
    originalInnerHeightDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      "innerHeight"
    );
    let animationFrameId = 0;
    const animationFrameTimeouts = new Map<
      number,
      ReturnType<typeof setTimeout>
    >();
    Object.defineProperty(globalThis, "requestAnimationFrame", {
      configurable: true,
      value: jest.fn((callback: FrameRequestCallback) => {
        const frameId = ++animationFrameId;
        const timeoutId = setTimeout(() => {
          animationFrameTimeouts.delete(frameId);
          callback(globalThis.performance.now());
        }, 0);
        animationFrameTimeouts.set(frameId, timeoutId);
        return frameId;
      }),
    });
    Object.defineProperty(globalThis, "cancelAnimationFrame", {
      configurable: true,
      value: jest.fn((frameId: number) => {
        const timeoutId = animationFrameTimeouts.get(frameId);
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
          animationFrameTimeouts.delete(frameId);
        }
      }),
    });
    Object.defineProperty(globalThis, "innerHeight", {
      configurable: true,
      value: 900,
    });
    useMemesWaveFooterStatsMock.mockReturnValue({
      isAvailable: false,
      leftThisRoundCount: 0,
      uncastPower: null,
      unratedCount: 0,
      votingLabel: null,
      isReady: false,
    });
  });

  afterEach(() => {
    document
      .querySelectorAll(`[${MOBILE_BOTTOM_NAV_DOCK_ATTRIBUTE}="true"]`)
      .forEach((dock) => dock.remove());

    if (originalRequestAnimationFrame === undefined) {
      delete (globalThis as { requestAnimationFrame?: unknown })
        .requestAnimationFrame;
    } else {
      Object.defineProperty(globalThis, "requestAnimationFrame", {
        configurable: true,
        value: originalRequestAnimationFrame,
      });
    }

    if (originalCancelAnimationFrame === undefined) {
      delete (globalThis as { cancelAnimationFrame?: unknown })
        .cancelAnimationFrame;
    } else {
      Object.defineProperty(globalThis, "cancelAnimationFrame", {
        configurable: true,
        value: originalCancelAnimationFrame,
      });
    }

    if (originalInnerHeightDescriptor === undefined) {
      delete (globalThis as { innerHeight?: unknown }).innerHeight;
    } else {
      Object.defineProperty(
        globalThis,
        "innerHeight",
        originalInnerHeightDescriptor
      );
    }
  });

  it("stays hidden until stats are ready", () => {
    render(<MemesWaveFooter onOpenQuickVote={onOpenQuickVote} />);

    expect(screen.queryByText("Uncast Power")).not.toBeInTheDocument();
  });

  it("renders the expanded footer card", () => {
    useMemesWaveFooterStatsMock.mockReturnValue({
      isAvailable: true,
      leftThisRoundCount: 3,
      uncastPower: 5000,
      unratedCount: 12,
      votingLabel: "TDH",
      isReady: true,
    });

    render(<MemesWaveFooter onOpenQuickVote={onOpenQuickVote} />);

    expect(screen.getByText("Uncast Power")).toBeInTheDocument();
    expect(screen.getByText("5,000 TDH")).toBeInTheDocument();
    expect(screen.getByText("3 left this round")).toBeInTheDocument();
    expect(screen.getByText("12 unrated")).toBeInTheDocument();
  });

  it("renders the expanded footer as a floating mobile overlay", () => {
    useMemesWaveFooterStatsMock.mockReturnValue({
      isAvailable: true,
      leftThisRoundCount: 3,
      uncastPower: 5000,
      unratedCount: 12,
      votingLabel: "TDH",
      isReady: true,
    });

    const { container } = render(
      <MemesWaveFooter floating onOpenQuickVote={onOpenQuickVote} />
    );

    const floatingLayer = container.querySelector(
      '[data-memes-wave-footer-layer="floating"]'
    );
    expect(floatingLayer).toHaveClass("tw-z-40");
    expect(floatingLayer).toHaveClass("tw-pointer-events-none");
    expect(floatingLayer).toHaveClass("tw-transition-[bottom]");
    expect(floatingLayer).not.toHaveClass("tw-bg-black");
    expect((floatingLayer as HTMLElement).style.bottom).toBe(
      MEMES_WAVE_FLOATING_FOOTER_FALLBACK_BOTTOM_STYLE.bottom
    );

    const button = screen.getByRole("button", {
      name: "Uncast Power, 5,000 TDH left, 3 left this round, 12 unrated",
    });
    const floatingFrame = button.closest(
      '[data-memes-wave-footer-frame="floating"]'
    );
    expect(floatingFrame).toHaveClass("tw-pointer-events-auto");
  });

  it("tracks the measured mobile dock top while the dock compacts", async () => {
    useMemesWaveFooterStatsMock.mockReturnValue({
      isAvailable: true,
      leftThisRoundCount: 3,
      uncastPower: 5000,
      unratedCount: 12,
      votingLabel: "TDH",
      isReady: true,
    });
    const dock = createMeasuredDock({ height: 64, top: 816 });

    const { container } = render(
      <MemesWaveFooter floating onOpenQuickVote={onOpenQuickVote} />
    );

    const floatingLayer = container.querySelector(
      '[data-memes-wave-footer-layer="floating"]'
    ) as HTMLElement;

    await waitFor(() => expect(floatingLayer.style.bottom).toBe("88px"));

    (dock.getBoundingClientRect as jest.Mock).mockReturnValue(
      createDockRect({ height: 54, top: 826 })
    );
    dock.dispatchEvent(new Event("transitionrun"));

    await waitFor(() => expect(floatingLayer.style.bottom).toBe("78px"));
  });

  it("reports footer availability changes", () => {
    const onAvailabilityChange = jest.fn();
    const { rerender, unmount } = render(
      <MemesWaveFooter
        onAvailabilityChange={onAvailabilityChange}
        onOpenQuickVote={onOpenQuickVote}
      />
    );

    expect(onAvailabilityChange).toHaveBeenLastCalledWith(false);

    useMemesWaveFooterStatsMock.mockReturnValue({
      isAvailable: true,
      leftThisRoundCount: 3,
      uncastPower: 5000,
      unratedCount: 12,
      votingLabel: "TDH",
      isReady: true,
    });
    rerender(
      <MemesWaveFooter
        onAvailabilityChange={onAvailabilityChange}
        onOpenQuickVote={onOpenQuickVote}
      />
    );

    expect(onAvailabilityChange).toHaveBeenLastCalledWith(true);

    unmount();

    expect(onAvailabilityChange).toHaveBeenLastCalledWith(false);
  });

  it("calls onOpenQuickVote from the expanded card", () => {
    useMemesWaveFooterStatsMock.mockReturnValue({
      isAvailable: true,
      leftThisRoundCount: 3,
      uncastPower: 5000,
      unratedCount: 12,
      votingLabel: "TDH",
      isReady: true,
    });

    render(
      <MemesWaveFooter
        onOpenQuickVote={onOpenQuickVote}
        onPrefetchQuickVote={onPrefetchQuickVote}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Uncast Power, 5,000 TDH left, 3 left this round, 12 unrated",
      })
    );

    expect(onOpenQuickVote).toHaveBeenCalledTimes(1);
  });

  it("prefetches quick vote from the expanded card on hover and focus", () => {
    useMemesWaveFooterStatsMock.mockReturnValue({
      isAvailable: true,
      leftThisRoundCount: 3,
      uncastPower: 5000,
      unratedCount: 12,
      votingLabel: "TDH",
      isReady: true,
    });

    render(
      <MemesWaveFooter
        onOpenQuickVote={onOpenQuickVote}
        onPrefetchQuickVote={onPrefetchQuickVote}
      />
    );

    const button = screen.getByRole("button", {
      name: "Uncast Power, 5,000 TDH left, 3 left this round, 12 unrated",
    });

    fireEvent.mouseEnter(button);
    fireEvent.focus(button);

    expect(onPrefetchQuickVote).toHaveBeenCalledTimes(2);
  });

  it("renders the compact collapsed pill", () => {
    useMemesWaveFooterStatsMock.mockReturnValue({
      isAvailable: true,
      leftThisRoundCount: 4,
      uncastPower: 5000,
      unratedCount: 9,
      votingLabel: "TDH",
      isReady: true,
    });

    render(
      <MemesWaveFooter
        collapsed
        onOpenQuickVote={onOpenQuickVote}
        onPrefetchQuickVote={onPrefetchQuickVote}
      />
    );

    expect(screen.queryByText("Uncast Power")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "4 left this round, 9 unrated in the memes wave",
      })
    ).toBeInTheDocument();
  });

  it("calls onOpenQuickVote from the collapsed pill", () => {
    useMemesWaveFooterStatsMock.mockReturnValue({
      isAvailable: true,
      leftThisRoundCount: 4,
      uncastPower: 5000,
      unratedCount: 9,
      votingLabel: "TDH",
      isReady: true,
    });

    render(<MemesWaveFooter collapsed onOpenQuickVote={onOpenQuickVote} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "4 left this round, 9 unrated in the memes wave",
      })
    );

    expect(onOpenQuickVote).toHaveBeenCalledTimes(1);
  });

  it("prefetches quick vote from the collapsed pill on hover and focus", () => {
    useMemesWaveFooterStatsMock.mockReturnValue({
      isAvailable: true,
      leftThisRoundCount: 4,
      uncastPower: 5000,
      unratedCount: 9,
      votingLabel: "TDH",
      isReady: true,
    });

    render(
      <MemesWaveFooter
        collapsed
        onOpenQuickVote={onOpenQuickVote}
        onPrefetchQuickVote={onPrefetchQuickVote}
      />
    );

    const button = screen.getByRole("button", {
      name: "4 left this round, 9 unrated in the memes wave",
    });

    fireEvent.mouseEnter(button);
    fireEvent.focus(button);

    expect(onPrefetchQuickVote).toHaveBeenCalledTimes(2);
  });

  it("ignores expanded-card clicks when no submissions remain", () => {
    useMemesWaveFooterStatsMock.mockReturnValue({
      isAvailable: false,
      leftThisRoundCount: 0,
      uncastPower: 5000,
      unratedCount: 0,
      votingLabel: "TDH",
      isReady: true,
    });

    render(
      <MemesWaveFooter
        onOpenQuickVote={onOpenQuickVote}
        onPrefetchQuickVote={onPrefetchQuickVote}
      />
    );

    expect(screen.queryByRole("button")).toBeNull();
  });
});
