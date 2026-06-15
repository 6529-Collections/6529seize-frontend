import { fireEvent, render, renderHook, screen } from "@testing-library/react";
import { createElement, useState } from "react";
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

function TooltipVisibilityHarness() {
  const { tooltipOpenEvents, tooltipCloseEvents } =
    useWaveOutcomeTooltipInteraction();
  const [isVisible, setIsVisible] = useState(false);

  const handleClick = () => {
    if (isVisible && tooltipCloseEvents.click) {
      setIsVisible(false);
      return;
    }
    if (tooltipOpenEvents.click) {
      setIsVisible(true);
    }
  };

  return createElement(
    "div",
    null,
    createElement(
      "button",
      {
        onBlur: tooltipCloseEvents.blur
          ? () => setIsVisible(false)
          : undefined,
        onClick: handleClick,
        onFocus: tooltipOpenEvents.focus ? () => setIsVisible(true) : undefined,
        onMouseEnter: tooltipOpenEvents.mouseenter
          ? () => setIsVisible(true)
          : undefined,
        onMouseLeave: tooltipCloseEvents.mouseleave
          ? () => setIsVisible(false)
          : undefined,
        type: "button",
      },
      "Outcome"
    ),
    isVisible
      ? createElement("div", { role: "tooltip" }, "Outcome details")
      : null
  );
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

  it("dismisses a hover-opened tooltip on first tap after touch activation", () => {
    setInteractionMode({
      canHover: true,
      hasFinePointer: true,
      enableHoverUI: true,
    });

    const { rerender } = render(createElement(TooltipVisibilityHarness));
    const button = screen.getByRole("button", { name: "Outcome" });

    fireEvent.mouseEnter(button);

    expect(screen.getByRole("tooltip")).toHaveTextContent("Outcome details");

    setInteractionMode({
      canHover: true,
      hasFinePointer: true,
      hasCoarsePointer: true,
      lastPointerType: "touch",
      enableHoverUI: true,
      enableLongPress: true,
    });

    rerender(createElement(TooltipVisibilityHarness));
    fireEvent.click(button);

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    fireEvent.click(button);

    expect(screen.getByRole("tooltip")).toHaveTextContent("Outcome details");
  });
});
