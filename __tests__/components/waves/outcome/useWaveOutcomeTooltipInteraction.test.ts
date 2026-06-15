import { renderHook } from "@testing-library/react";
import useWaveOutcomeTooltipInteraction from "@/components/waves/outcome/useWaveOutcomeTooltipInteraction";
import useInteractionMode from "@/src/interaction/useInteractionMode";
import { createInteractionMode } from "@/__tests__/utils/interactionMode";

jest.mock("@/src/interaction/useInteractionMode");

const useInteractionModeMock = useInteractionMode as jest.Mock;

function setInteractionMode(
  overrides: Parameters<typeof createInteractionMode>[0] = {}
) {
  useInteractionModeMock.mockReturnValue(createInteractionMode(overrides));
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
