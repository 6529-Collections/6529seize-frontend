import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import MemesWaveFooter from "@/components/brain/left-sidebar/waves/MemesWaveFooter";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useMemesWaveFooterStats } from "@/hooks/useMemesWaveFooterStats";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import {
  MEMES_WAVE_FLOATING_FOOTER_FALLBACK_BOTTOM_STYLE,
  MEMES_WAVE_FLOATING_FOOTER_SCALE_PROPERTY,
} from "@/components/brain/left-sidebar/waves/MemesWaveFooter.constants";
import {
  MOBILE_BOTTOM_NAV_DOCK_ATTRIBUTE,
  MOBILE_BOTTOM_NAV_ROOT_ATTRIBUTE,
} from "@/helpers/navigation.helpers";
import { PULL_TO_REFRESH_FIXED_OVERLAY_ATTRIBUTE } from "@/helpers/pull-to-refresh.helpers";

jest.mock("@/hooks/useMemesWaveFooterStats", () => ({
  useMemesWaveFooterStats: jest.fn(),
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const useMemesWaveFooterStatsMock =
  useMemesWaveFooterStats as jest.MockedFunction<
    typeof useMemesWaveFooterStats
  >;
const useDeviceInfoMock = useDeviceInfo as jest.Mock;

const setBrowserLanguages = (languages: readonly string[]) => {
  Object.defineProperty(globalThis.navigator, "languages", {
    configurable: true,
    value: languages,
  });
};

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
    parentElement = document.body,
    top,
  }: {
    readonly height: number;
    readonly parentElement?: HTMLElement | undefined;
    readonly top: number;
  }) => {
    const dock = document.createElement("div");
    dock.setAttribute(MOBILE_BOTTOM_NAV_DOCK_ATTRIBUTE, "true");
    dock.getBoundingClientRect = jest.fn(() => createDockRect({ height, top }));
    parentElement.appendChild(dock);

    return dock;
  };

  const createDockRoot = () => {
    const dockRoot = document.createElement("div");
    dockRoot.setAttribute(MOBILE_BOTTOM_NAV_ROOT_ATTRIBUTE, "true");
    document.body.appendChild(dockRoot);

    return dockRoot;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setBrowserLanguages(["en-US"]);
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
    useDeviceInfoMock.mockReturnValue({
      hasTouchScreen: true,
      isApp: true,
      isAppleMobile: true,
      isMobileDevice: true,
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
    document
      .querySelectorAll(`[${MOBILE_BOTTOM_NAV_ROOT_ATTRIBUTE}="true"]`)
      .forEach((dockRoot) => dockRoot.remove());

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

  it("uses browser locale for expanded footer copy and numbers", async () => {
    setBrowserLanguages(["fr-FR"]);
    useMemesWaveFooterStatsMock.mockReturnValue({
      isAvailable: true,
      leftThisRoundCount: 3,
      uncastPower: 5000,
      unratedCount: 12,
      votingLabel: "TDH",
      isReady: true,
    });
    const formattedPower = formatInteger("fr-FR", 5000);
    const leftThisRoundText = t("fr-FR", "memes.quickVote.leftThisRound", {
      count: formatInteger("fr-FR", 3),
    });
    const unratedText = t("fr-FR", "memes.quickVote.unrated", {
      count: formatInteger("fr-FR", 12),
    });
    const visiblePowerText = t(
      "fr-FR",
      "memes.waveFooter.uncastPower.visibleValue",
      {
        power: formattedPower,
        votingLabel: "TDH",
      }
    );

    render(<MemesWaveFooter onOpenQuickVote={onOpenQuickVote} />);

    expect(
      await screen.findByRole("button", {
        name: t("fr-FR", "memes.waveFooter.uncastPower.ariaLabel", {
          leftThisRound: leftThisRoundText,
          power: formattedPower,
          unrated: unratedText,
          votingLabel: "TDH",
        }),
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(t("fr-FR", "memes.waveFooter.uncastPower.title"))
    ).toBeInTheDocument();
    const visiblePowerElements = screen.getAllByText(
      (_, element) => element?.textContent === visiblePowerText
    );
    expect(visiblePowerElements.map((element) => element.tagName)).toContain(
      "SPAN"
    );
    expect(screen.getByText(leftThisRoundText)).toBeInTheDocument();
    expect(screen.getByText(unratedText)).toBeInTheDocument();
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
    expect(floatingLayer).toHaveClass("tw-will-change-[bottom]");
    expect(floatingLayer).toHaveAttribute(
      PULL_TO_REFRESH_FIXED_OVERLAY_ATTRIBUTE,
      "true"
    );
    expect(floatingLayer).not.toHaveClass("tw-bg-black");
    expect((floatingLayer as HTMLElement).style.bottom).toBe(
      MEMES_WAVE_FLOATING_FOOTER_FALLBACK_BOTTOM_STYLE.bottom
    );
    expect(
      (floatingLayer as HTMLElement).style.getPropertyValue(
        MEMES_WAVE_FLOATING_FOOTER_SCALE_PROPERTY
      )
    ).toBe("1");

    const button = screen.getByRole("button", {
      name: "Uncast Power, 5,000 TDH left, 3 left this round, 12 unrated",
    });
    const floatingFrame = button.closest(
      '[data-memes-wave-footer-frame="floating"]'
    );
    expect(floatingFrame).toHaveClass("tw-pointer-events-auto");
    expect(floatingFrame).toHaveClass(
      "tw-scale-[var(--memes-wave-floating-footer-scale)]"
    );
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
    expect(
      floatingLayer.style.getPropertyValue(
        MEMES_WAVE_FLOATING_FOOTER_SCALE_PROPERTY
      )
    ).toBe("1");

    (dock.getBoundingClientRect as jest.Mock).mockReturnValue(
      createDockRect({ height: 54, top: 826 })
    );
    dock.dispatchEvent(new Event("transitionrun"));

    await waitFor(() => expect(floatingLayer.style.bottom).toBe("78px"));
    expect(
      floatingLayer.style.getPropertyValue(
        MEMES_WAVE_FLOATING_FOOTER_SCALE_PROPERTY
      )
    ).toBe("0.88");
  });

  it("rebinds measurement when the mobile dock node is replaced", async () => {
    useMemesWaveFooterStatsMock.mockReturnValue({
      isAvailable: true,
      leftThisRoundCount: 3,
      uncastPower: 5000,
      unratedCount: 12,
      votingLabel: "TDH",
      isReady: true,
    });
    const dockRoot = createDockRoot();
    const fallbackDock = createMeasuredDock({
      height: 64,
      parentElement: dockRoot,
      top: 816,
    });

    const { container } = render(
      <MemesWaveFooter floating onOpenQuickVote={onOpenQuickVote} />
    );

    const floatingLayer = container.querySelector(
      '[data-memes-wave-footer-layer="floating"]'
    ) as HTMLElement;

    await waitFor(() => expect(floatingLayer.style.bottom).toBe("88px"));

    fallbackDock.remove();
    createMeasuredDock({ height: 54, parentElement: dockRoot, top: 826 });

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

  it("uses browser locale for the compact collapsed pill", async () => {
    setBrowserLanguages(["fr-FR"]);
    useMemesWaveFooterStatsMock.mockReturnValue({
      isAvailable: true,
      leftThisRoundCount: 4,
      uncastPower: 5000,
      unratedCount: 9,
      votingLabel: "TDH",
      isReady: true,
    });
    const leftThisRoundText = t("fr-FR", "memes.quickVote.leftThisRound", {
      count: formatInteger("fr-FR", 4),
    });
    const unratedText = t("fr-FR", "memes.quickVote.unrated", {
      count: formatInteger("fr-FR", 9),
    });

    render(<MemesWaveFooter collapsed onOpenQuickVote={onOpenQuickVote} />);

    expect(
      await screen.findByRole("button", {
        name: t("fr-FR", "memes.quickVote.inMemesWave", {
          leftThisRound: leftThisRoundText,
          unrated: unratedText,
        }),
      })
    ).toHaveAttribute(
      "title",
      t("fr-FR", "memes.quickVote.summary", {
        leftThisRound: leftThisRoundText,
        unrated: unratedText,
      })
    );
    expect(screen.getByText(formatInteger("fr-FR", 4))).toBeInTheDocument();
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
