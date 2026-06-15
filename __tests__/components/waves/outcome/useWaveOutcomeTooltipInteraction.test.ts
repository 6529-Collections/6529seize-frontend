import { renderHook } from "@testing-library/react";
import useWaveOutcomeTooltipInteraction from "@/components/waves/outcome/useWaveOutcomeTooltipInteraction";
import useInteractionMode from "@/src/interaction/useInteractionMode";
import type { InteractionMode } from "@/src/interaction/useInteractionMode";

jest.mock("@/src/interaction/useInteractionMode");

const useInteractionModeMock = useInteractionMode as jest.Mock;

const DEFAULT_INTERACTION_MODE: InteractionMode = {
  canHover: false,
  hasFinePointer: false,
  hasCoarsePointer: false,
  hoverNone: false,
  lastPointerType: null,
  enableHoverUI: false,
  enableLongPress: false,
};

function setInteractionMode(overrides: Partial<InteractionMode> = {}) {
  useInteractionModeMock.mockReturnValue({
    ...DEFAULT_INTERACTION_MODE,
    ...overrides,
  });
}

describe("useWaveOutcomeTooltipInteraction", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("keeps mouseleave close policy when a hybrid hover tooltip flips to touch activation", () => {
    setInteractionMode({
      canHover: true,
      hasFinePointer: true,
      enableHoverUI: true,
    });

    const { result, rerender } = renderHook(() =>
      useWaveOutcomeTooltipInteraction()
    );

    expect(result.current.useClickActivation).toBe(false);
    expect(result.current.tooltipOpenEvents).toEqual({
      mouseenter: true,
      focus: true,
    });
    expect(result.current.tooltipCloseEvents).toEqual({
      mouseleave: true,
      blur: true,
    });

    setInteractionMode({
      canHover: true,
      hasFinePointer: true,
      hasCoarsePointer: true,
      lastPointerType: "touch",
      enableHoverUI: true,
      enableLongPress: true,
    });

    rerender();

    expect(result.current.useClickActivation).toBe(true);
    expect(result.current.tooltipOpenEvents).toEqual({
      mouseenter: true,
      focus: true,
      click: true,
    });
    expect(result.current.tooltipCloseEvents).toEqual({
      mouseleave: true,
      blur: true,
      click: true,
    });
    expect(result.current.tooltipGlobalCloseEvents).toEqual({
      clickOutsideAnchor: true,
    });
  });
});
