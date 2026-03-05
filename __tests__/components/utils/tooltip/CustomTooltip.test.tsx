import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import CustomTooltip from "@/components/utils/tooltip/CustomTooltip";
import { CUSTOM_TOOLTIP_CLOSE_ALL_EVENT } from "@/helpers/tooltip.helpers";

// Mock createPortal
jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (children: React.ReactNode) => children,
}));

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

  it("closes when clicking inside tooltip content", async () => {
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
      expect(screen.queryByText("Inside Tooltip")).not.toBeInTheDocument();
    });
  });
});
