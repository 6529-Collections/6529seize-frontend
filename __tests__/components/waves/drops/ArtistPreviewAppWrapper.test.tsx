import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ArtistPreviewAppWrapper from "@/components/waves/drops/ArtistPreviewAppWrapper";

const mockKeyboardFocusScroll = jest.fn();

jest.mock(
  "@/components/waves/create-wave/hooks/useKeyboardFocusScroll",
  () => ({
    __esModule: true,
    default: (ref: React.RefObject<HTMLElement | null>) =>
      mockKeyboardFocusScroll(ref),
  })
);

// Mock Headless UI components
jest.mock("@headlessui/react", () => ({
  Dialog: ({ children, onClose, ...props }: any) => (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div data-testid="dialog" onClick={onClose} {...props}>
      {children}
    </div>
  ),
  DialogPanel: ({ children, ...props }: any) => (
    <div data-testid="dialog-panel" {...props}>
      {children}
    </div>
  ),
  Transition: ({ children, show }: any) => (show ? <>{children}</> : null),
  TransitionChild: ({ children }: any) => <>{children}</>,
}));

// Mock Heroicons
jest.mock("@heroicons/react/24/outline", () => ({
  XMarkIcon: (props: any) => <svg data-testid="x-mark-icon" {...props} />,
}));

describe("ArtistPreviewAppWrapper", () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    children: <div data-testid="test-content">Test Content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders when isOpen is true", () => {
    render(<ArtistPreviewAppWrapper {...defaultProps} />);

    expect(screen.getByTestId("dialog")).toBeInTheDocument();
    expect(screen.getByTestId("test-content")).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    render(<ArtistPreviewAppWrapper {...defaultProps} isOpen={false} />);

    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });

  it("renders close button", () => {
    render(<ArtistPreviewAppWrapper {...defaultProps} />);

    const closeButton = screen.getByLabelText("Close panel");
    expect(closeButton).toBeInTheDocument();
    expect(screen.getByTestId("x-mark-icon")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const mockOnClose = jest.fn();
    render(<ArtistPreviewAppWrapper {...defaultProps} onClose={mockOnClose} />);

    const closeButton = screen.getByLabelText("Close panel");
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when dialog backdrop is clicked", () => {
    const mockOnClose = jest.fn();
    render(<ArtistPreviewAppWrapper {...defaultProps} onClose={mockOnClose} />);

    const dialog = screen.getByTestId("dialog");
    fireEvent.click(dialog);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("prevents event propagation on container click/touch", () => {
    const mockParentClick = jest.fn();

    render(
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
      <div onClick={mockParentClick}>
        <ArtistPreviewAppWrapper {...defaultProps} />
      </div>
    );

    // Find the container that prevents propagation
    const container = screen.getByTestId("dialog-panel").parentElement;
    if (container) {
      fireEvent.click(container);
      fireEvent.touchStart(container);
    }

    expect(mockParentClick).not.toHaveBeenCalled();
  });

  it("renders children content", () => {
    const customChildren = (
      <div>
        <h1>Custom Header</h1>
        <p>Custom Content</p>
      </div>
    );

    render(
      <ArtistPreviewAppWrapper {...defaultProps}>
        {customChildren}
      </ArtistPreviewAppWrapper>
    );

    expect(screen.getByText("Custom Header")).toBeInTheDocument();
    expect(screen.getByText("Custom Content")).toBeInTheDocument();
  });

  it("has proper ARIA attributes", () => {
    render(<ArtistPreviewAppWrapper {...defaultProps} />);

    const closeButton = screen.getByLabelText("Close panel");
    expect(closeButton).toHaveAttribute("aria-label", "Close panel");
    expect(closeButton).toHaveAttribute("type", "button");
  });

  it("has safe area padding", () => {
    render(<ArtistPreviewAppWrapper {...defaultProps} />);

    const dialogPanel = screen.getByTestId("dialog-panel");
    expect(dialogPanel).toHaveClass("tw-pb-[env(safe-area-inset-bottom,0px)]");
  });

  it("has proper styling classes", () => {
    render(<ArtistPreviewAppWrapper {...defaultProps} />);

    const dialogPanel = screen.getByTestId("dialog-panel");
    expect(dialogPanel).toHaveClass(
      "tw-w-full",
      "tw-bg-[#0B0C0E]",
      "tw-rounded-t-2xl",
      "tw-border-white/10"
    );
    expect(dialogPanel.style.maxHeight).toContain(
      "--native-keyboard-inset-bottom"
    );
  });

  it("tracks focused fields inside the native keyboard-aware layout", () => {
    render(
      <ArtistPreviewAppWrapper {...defaultProps}>
        <input aria-label="Vote amount" />
      </ArtistPreviewAppWrapper>
    );

    const layout = screen.getByTestId("artist-preview-app-layout");
    const scrollRegion = screen.getByTestId("artist-preview-app-scroll");
    const trackedRef = mockKeyboardFocusScroll.mock.calls.at(-1)?.[0];

    expect(layout.style.height).toContain("--native-keyboard-inset-bottom");
    expect(layout.style.transform).toContain("--native-keyboard-inset-bottom");
    expect(layout.style.transition).toContain(
      "--native-keyboard-layout-transition-duration"
    );
    expect(trackedRef.current).toBe(scrollRegion);
  });

  it("handles focus styles on close button", () => {
    render(<ArtistPreviewAppWrapper {...defaultProps} />);

    const closeButton = screen.getByLabelText("Close panel");
    const dialogPanel = screen.getByTestId("dialog-panel");
    expect(closeButton).toHaveClass(
      "focus-visible:tw-ring-2",
      "focus-visible:tw-ring-primary-400"
    );
    expect(dialogPanel).not.toContainElement(closeButton);
  });

  it("has proper z-index for overlay", () => {
    render(<ArtistPreviewAppWrapper {...defaultProps} />);

    const dialog = screen.getByTestId("dialog");
    expect(dialog).toHaveClass("tw-z-[1010]");
  });
});
