import React from "react";
import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import CustomTooltip from "@/components/utils/tooltip/CustomTooltip";
import { CUSTOM_TOOLTIP_CLOSE_ALL_EVENT } from "@/helpers/tooltip.helpers";

// Mock createPortal
jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (children: React.ReactNode) => children,
}));

function createDomRect({
  left,
  top = 0,
  width = 120,
  height = 40,
}: {
  left: number;
  top?: number;
  width?: number;
  height?: number;
}): DOMRect {
  return {
    x: left,
    y: top,
    top,
    left,
    width,
    height,
    bottom: top + height,
    right: left + width,
    toJSON: () => ({}),
  } as DOMRect;
}

describe("CustomTooltip", () => {
  beforeEach(() => {
    // Create portal root for tests
    const portalRoot = document.createElement("div");
    portalRoot.id = "custom-tooltip-portal";
    document.body.appendChild(portalRoot);
  });

  afterEach(() => {
    // Clean up portal root
    const portalRoot = document.getElementById("custom-tooltip-portal");
    if (portalRoot) {
      document.body.removeChild(portalRoot);
    }
  });

  it("renders children without tooltip initially", () => {
    render(
      <CustomTooltip content="Test tooltip">
        <button>Test Button</button>
      </CustomTooltip>
    );

    expect(screen.getByText("Test Button")).toBeInTheDocument();
    expect(screen.queryByText("Test tooltip")).not.toBeInTheDocument();
  });

  it("shows tooltip on mouse enter after delay", async () => {
    render(
      <CustomTooltip content="Test tooltip" delayShow={100}>
        <button>Test Button</button>
      </CustomTooltip>
    );

    const button = screen.getByText("Test Button");
    fireEvent.mouseEnter(button);

    await waitFor(() => {
      expect(screen.getByText("Test tooltip")).toBeInTheDocument();
    });
  });

  it("hides tooltip on mouse leave after delay", async () => {
    render(
      <CustomTooltip content="Test tooltip" delayShow={100} delayHide={100}>
        <button>Test Button</button>
      </CustomTooltip>
    );

    const button = screen.getByText("Test Button");
    fireEvent.mouseEnter(button);

    await waitFor(() => {
      expect(screen.getByText("Test tooltip")).toBeInTheDocument();
    });

    fireEvent.mouseLeave(button);

    await waitFor(() => {
      expect(screen.queryByText("Test tooltip")).not.toBeInTheDocument();
    });
  });

  it("does not show tooltip when disabled", async () => {
    render(
      <CustomTooltip content="Test tooltip" disabled delayShow={100}>
        <button>Test Button</button>
      </CustomTooltip>
    );

    const button = screen.getByText("Test Button");
    fireEvent.mouseEnter(button);

    // Wait a bit longer than delayShow to ensure tooltip would have appeared
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(screen.queryByText("Test tooltip")).not.toBeInTheDocument();
  });

  it("preserves original mouse event handlers", () => {
    const onMouseEnter = jest.fn();
    const onMouseLeave = jest.fn();

    render(
      <CustomTooltip content="Test tooltip" delayShow={100}>
        <button onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
          Test Button
        </button>
      </CustomTooltip>
    );

    const button = screen.getByText("Test Button");
    fireEvent.mouseEnter(button);
    fireEvent.mouseLeave(button);

    expect(onMouseEnter).toHaveBeenCalled();
    expect(onMouseLeave).toHaveBeenCalled();
  });

  it("preserves the child's ref and still opens the tooltip", async () => {
    const buttonRef = React.createRef<HTMLButtonElement>();

    render(
      <CustomTooltip content="Test tooltip" delayShow={0}>
        <button ref={buttonRef}>Test Button</button>
      </CustomTooltip>
    );

    expect(buttonRef.current).toBe(screen.getByText("Test Button"));

    fireEvent.mouseEnter(buttonRef.current!);

    await waitFor(() => {
      expect(screen.getByText("Test tooltip")).toBeInTheDocument();
    });
  });

  it("shows on focus, hides on blur, and preserves focus handlers", async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();

    render(
      <CustomTooltip
        content="Test tooltip"
        delayShow={0}
        delayHide={0}
        hoverTransitionDelay={0}
      >
        <button onFocus={onFocus} onBlur={onBlur}>
          Test Button
        </button>
      </CustomTooltip>
    );

    const button = screen.getByText("Test Button");
    fireEvent.focus(button);

    await waitFor(() => {
      expect(screen.getByText("Test tooltip")).toBeInTheDocument();
    });

    fireEvent.blur(button);

    await waitFor(() => {
      expect(screen.queryByText("Test tooltip")).not.toBeInTheDocument();
    });

    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it("merges the tooltip id into an existing aria-describedby value", async () => {
    render(
      <>
        <span id="existing-description">Existing description</span>
        <CustomTooltip
          content="Test tooltip"
          delayShow={0}
          delayHide={0}
          hoverTransitionDelay={0}
        >
          <button aria-describedby="existing-description">Test Button</button>
        </CustomTooltip>
      </>
    );

    const button = screen.getByRole("button", { name: "Test Button" });
    fireEvent.focus(button);

    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveAttribute("id");

    const tooltipId = tooltip.getAttribute("id");
    expect(tooltipId).toBeTruthy();
    expect(button.getAttribute("aria-describedby")?.split(/\s+/)).toEqual(
      expect.arrayContaining(["existing-description", tooltipId ?? ""])
    );

    fireEvent.blur(button);

    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    expect(button).toHaveAttribute("aria-describedby", "existing-description");
  });

  it("removes only the tooltip id when the tooltip hides", async () => {
    render(
      <CustomTooltip
        content="Test tooltip"
        delayShow={0}
        delayHide={0}
        hoverTransitionDelay={0}
      >
        <button>Test Button</button>
      </CustomTooltip>
    );

    const button = screen.getByRole("button", { name: "Test Button" });
    fireEvent.mouseEnter(button);

    const tooltip = await screen.findByRole("tooltip");
    expect(button).toHaveAttribute(
      "aria-describedby",
      tooltip.getAttribute("id") ?? ""
    );

    fireEvent.mouseLeave(button);

    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    expect(button).not.toHaveAttribute("aria-describedby");
  });

  it("does not duplicate the tooltip id across repeated opens", async () => {
    render(
      <CustomTooltip
        content="Test tooltip"
        delayShow={0}
        delayHide={0}
        hoverTransitionDelay={0}
      >
        <button>Test Button</button>
      </CustomTooltip>
    );

    const button = screen.getByRole("button", { name: "Test Button" });

    fireEvent.focus(button);
    const firstTooltip = await screen.findByRole("tooltip");
    const tooltipId = firstTooltip.getAttribute("id");

    fireEvent.blur(button);

    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    fireEvent.focus(button);

    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });

    const describedByIds =
      button.getAttribute("aria-describedby")?.split(/\s+/) ?? [];
    expect(describedByIds.filter((id) => id === tooltipId)).toHaveLength(1);
  });

  it("closes when close-all tooltip event is dispatched", async () => {
    render(
      <CustomTooltip content="Test tooltip" delayShow={100}>
        <button>Test Button</button>
      </CustomTooltip>
    );

    const button = screen.getByText("Test Button");
    fireEvent.mouseEnter(button);

    await waitFor(() => {
      expect(screen.getByText("Test tooltip")).toBeInTheDocument();
    });

    document.dispatchEvent(new Event(CUSTOM_TOOLTIP_CLOSE_ALL_EVENT));

    await waitFor(() => {
      expect(screen.queryByText("Test tooltip")).not.toBeInTheDocument();
    });
  });

  it("stays open when clicking inside passive tooltip content", async () => {
    render(
      <CustomTooltip
        content={<button type="button">Inside Tooltip</button>}
        delayShow={100}
      >
        <button>Test Button</button>
      </CustomTooltip>
    );

    fireEvent.mouseEnter(screen.getByText("Test Button"));

    await waitFor(() => {
      expect(screen.getByText("Inside Tooltip")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Inside Tooltip"));

    await waitFor(() => {
      expect(screen.getByText("Inside Tooltip")).toBeInTheDocument();
    });
  });

  it("rebinds the trigger resize observer and measures the live trigger after swapping children", async () => {
    const originalResizeObserver = globalThis.ResizeObserver;
    const resizeObserverCallbacks: ResizeObserverCallback[] = [];
    const observeMocks: jest.Mock[] = [];
    const unobserveMocks: jest.Mock[] = [];
    let firstTriggerRectSpy: jest.SpyInstance | undefined;
    let secondTriggerRectSpy: jest.SpyInstance | undefined;
    let tooltipRectSpy: jest.SpyInstance | undefined;

    globalThis.ResizeObserver = jest
      .fn()
      .mockImplementation((callback: ResizeObserverCallback) => {
        resizeObserverCallbacks.push(callback);

        const observe = jest.fn();
        const unobserve = jest.fn();

        observeMocks.push(observe);
        unobserveMocks.push(unobserve);

        return {
          observe,
          unobserve,
          disconnect: jest.fn(),
        };
      }) as unknown as typeof ResizeObserver;

    function TriggerSwapHarness() {
      const [triggerLabel, setTriggerLabel] = React.useState("First Trigger");

      return (
        <>
          <button
            type="button"
            onClick={() => setTriggerLabel("Second Trigger")}
          >
            Swap Trigger
          </button>
          <CustomTooltip
            content="Test tooltip"
            delayShow={0}
            delayHide={0}
            hoverTransitionDelay={0}
          >
            <button type="button">{triggerLabel}</button>
          </CustomTooltip>
        </>
      );
    }

    try {
      render(<TriggerSwapHarness />);

      const firstTrigger = screen.getByRole("button", {
        name: "First Trigger",
      });
      firstTriggerRectSpy = jest
        .spyOn(firstTrigger, "getBoundingClientRect")
        .mockImplementation(() => createDomRect({ left: 16 }));

      fireEvent.mouseEnter(firstTrigger);

      const tooltip = await screen.findByRole("tooltip");
      tooltipRectSpy = jest
        .spyOn(tooltip, "getBoundingClientRect")
        .mockImplementation(() =>
          createDomRect({ left: 0, top: 0, width: 180, height: 60 })
        );

      await waitFor(() => {
        expect(observeMocks).toHaveLength(2);
      });

      expect(observeMocks[1]).toHaveBeenCalledWith(firstTrigger);

      fireEvent.click(screen.getByRole("button", { name: "Swap Trigger" }));

      const secondTrigger = await screen.findByRole("button", {
        name: "Second Trigger",
      });
      secondTriggerRectSpy = jest
        .spyOn(secondTrigger, "getBoundingClientRect")
        .mockImplementation(() => createDomRect({ left: 220 }));

      await waitFor(() => {
        expect(unobserveMocks[1]).toHaveBeenCalledWith(firstTrigger);
        expect(observeMocks[1]).toHaveBeenCalledWith(secondTrigger);
      });

      const firstMeasureCount = firstTriggerRectSpy.mock.calls.length;
      const secondMeasureCount = secondTriggerRectSpy.mock.calls.length;

      act(() => {
        resizeObserverCallbacks[1]?.([], {} as ResizeObserver);
      });

      await waitFor(() => {
        expect(secondTriggerRectSpy).toHaveBeenCalledTimes(
          secondMeasureCount + 1
        );
      });
      expect(firstTriggerRectSpy).toHaveBeenCalledTimes(firstMeasureCount);
    } finally {
      tooltipRectSpy?.mockRestore();
      firstTriggerRectSpy?.mockRestore();
      secondTriggerRectSpy?.mockRestore();
      globalThis.ResizeObserver = originalResizeObserver;
    }
  });
});
