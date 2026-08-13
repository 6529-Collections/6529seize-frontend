import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("MobileWrapperDialog", () => {
  const defaultProps = {
    isOpen: false,
    onClose: jest.fn(),
    children: <div data-testid="child-content">Child Content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("does not render children when closed", () => {
      render(<MobileWrapperDialog {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId("child-content")).not.toBeInTheDocument();
    });

    it("renders children when open", () => {
      render(<MobileWrapperDialog {...defaultProps} isOpen={true} />);

      expect(screen.getByTestId("child-content")).toBeInTheDocument();
    });

    it("renders title when provided", () => {
      render(
        <MobileWrapperDialog
          {...defaultProps}
          isOpen={true}
          title="Test Title"
        />
      );

      expect(screen.getByText("Test Title")).toBeInTheDocument();
    });

    it("renders title actions beside the title", () => {
      render(
        <MobileWrapperDialog
          {...defaultProps}
          isOpen={true}
          title="Test Title"
          titleActions={<button type="button">Title action</button>}
        />
      );

      const title = screen.getByText("Test Title");
      const action = screen.getByRole("button", { name: "Title action" });

      expect(title.parentElement).toContainElement(action);
    });

    it("renders close button when open", () => {
      render(<MobileWrapperDialog {...defaultProps} isOpen={true} />);

      expect(
        screen.getByRole("button", { name: "Close" })
      ).toBeInTheDocument();
    });

    it("applies custom styling to the tablet modal close button", () => {
      render(
        <MobileWrapperDialog
          {...defaultProps}
          isOpen={true}
          tabletModal
          headerCloseButtonClassName="!tw-rounded-lg"
        />
      );

      const desktopCloseButton = screen
        .getAllByRole("button", { name: "Close" })
        .find((button) => button.classList.contains("md:tw-inline-flex"));

      expect(desktopCloseButton).toHaveClass("!tw-rounded-lg");
    });
  });

  describe("props variations", () => {
    it("applies noPadding styling when noPadding prop is true", () => {
      render(
        <MobileWrapperDialog {...defaultProps} isOpen={true} noPadding={true} />
      );

      expect(screen.getByTestId("child-content")).toBeInTheDocument();
    });

    it("allows content overflow when allowOverflow is true", () => {
      render(
        <MobileWrapperDialog
          {...defaultProps}
          isOpen={true}
          allowOverflow={true}
        />
      );

      expect(
        document.querySelector(".tw-rounded-t-xl.tw-overflow-visible")
      ).toBeInTheDocument();
      expect(
        document.querySelector(".tw-flex-1.tw-overflow-visible")
      ).toBeInTheDocument();
    });

    it("keeps mobile sheets above the native keyboard inset", () => {
      render(<MobileWrapperDialog {...defaultProps} isOpen={true} />);

      const container = document.querySelector<HTMLElement>(
        ".tw-pointer-events-none.tw-fixed.tw-inset-x-0"
      );
      const surface = document.querySelector<HTMLElement>(".tw-rounded-t-xl");

      expect(container).toHaveClass(
        "[--mobile-wrapper-dialog-keyboard-inset:var(--native-keyboard-inset-bottom,0px)]"
      );
      expect(container?.style.bottom).toBe("0px");
      expect(container?.style.transform).toBe(
        "translate3d(0, calc(0px - var(--mobile-wrapper-dialog-keyboard-inset, 0px)), 0)"
      );
      expect(container?.style.transition).toBe(
        "transform var(--native-keyboard-layout-transition-duration, 0ms) ease-out"
      );
      expect(surface?.style.maxHeight).toBe(
        "min(calc(min(100vh, 100svh) - 10rem), max(0px, calc(min(100vh, 100svh) - 4rem - var(--mobile-wrapper-dialog-keyboard-inset, 0px))))"
      );
      expect(surface?.style.transition).toBe(
        "max-height var(--native-keyboard-layout-transition-duration, 0ms) ease-out"
      );
    });

    it("animates keyboard resizing for fixed-height sheets", () => {
      render(
        <MobileWrapperDialog
          {...defaultProps}
          isOpen={true}
          fixedHeight={true}
        />
      );

      const surface = document.querySelector<HTMLElement>(".tw-rounded-t-xl");

      expect(surface?.style.height).toContain(
        "var(--mobile-wrapper-dialog-keyboard-inset, 0px)"
      );
      expect(surface?.style.transition).toBe(
        "height var(--native-keyboard-layout-transition-duration, 0ms) ease-out"
      );
    });

    it("keeps the centered tablet modal independent of the keyboard inset", () => {
      render(
        <MobileWrapperDialog
          {...defaultProps}
          isOpen={true}
          tabletModal={true}
        />
      );

      const container = document.querySelector<HTMLElement>(
        ".tw-pointer-events-none.tw-fixed.tw-inset-x-0"
      );

      expect(container).toHaveClass(
        "md:[--mobile-wrapper-dialog-keyboard-inset:0px]"
      );
    });

    it.each([
      {
        name: "enables dragging without rendering a handle",
        props: { enableDragToClose: true },
        canDrag: true,
        showsHandle: false,
      },
      {
        name: "lets an explicit false override the handle fallback",
        props: { enableDragToClose: false, showDragHandle: true },
        canDrag: false,
        showsHandle: true,
      },
      {
        name: "falls back to the legacy handle behavior",
        props: { showDragHandle: true },
        canDrag: true,
        showsHandle: true,
      },
      {
        name: "disables dragging when the dialog is not dismissible",
        props: { dismissible: false, enableDragToClose: true },
        canDrag: false,
        showsHandle: false,
      },
      {
        name: "disables dragging for tablet modals",
        props: { enableDragToClose: true, tabletModal: true },
        canDrag: false,
        showsHandle: false,
      },
    ])("$name", ({ props, canDrag, showsHandle }) => {
      render(
        <MobileWrapperDialog {...defaultProps} {...props} isOpen={true} />
      );

      const dragSurface = document.querySelector<HTMLElement>(
        ".mobile-wrapper-dialog"
      );
      expect(dragSurface).toBeInTheDocument();
      expect(dragSurface?.style.transform).toBe(
        canDrag ? "translate3d(0, 0px, 0)" : ""
      );
      const dragHandle = document.querySelector(
        ".tw-h-1.tw-w-10.tw-rounded-full"
      );
      if (showsHandle) {
        expect(dragHandle).toBeInTheDocument();
      } else {
        expect(dragHandle).not.toBeInTheDocument();
      }
    });
  });

  describe("user interactions", () => {
    it("calls onClose when close button is clicked", async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(
        <MobileWrapperDialog
          {...defaultProps}
          isOpen={true}
          onClose={onClose}
        />
      );

      const closeButton = screen.getByRole("button", { name: "Close" });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it("calls onClose when Escape key is pressed", async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(
        <MobileWrapperDialog
          {...defaultProps}
          isOpen={true}
          onClose={onClose}
        />
      );

      await user.keyboard("{Escape}");

      expect(onClose).toHaveBeenCalled();
    });

    it("calls onClose when backdrop is clicked", async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(
        <MobileWrapperDialog
          {...defaultProps}
          isOpen={true}
          onClose={onClose}
        />
      );

      const backdrop = document.querySelector(".tw-fixed.tw-inset-0");
      if (backdrop) {
        await user.click(backdrop);
      }

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("accessibility", () => {
    it("close button can receive focus", () => {
      render(<MobileWrapperDialog {...defaultProps} isOpen={true} />);

      const closeButton = screen.getByRole("button", { name: "Close" });
      closeButton.focus();

      expect(closeButton).toHaveFocus();
    });
  });

  describe("transition callbacks", () => {
    it("accepts onBeforeLeave callback", async () => {
      const onBeforeLeave = jest.fn();
      const { rerender } = render(
        <MobileWrapperDialog
          {...defaultProps}
          isOpen={true}
          onBeforeLeave={onBeforeLeave}
        />
      );

      rerender(
        <MobileWrapperDialog
          {...defaultProps}
          isOpen={false}
          onBeforeLeave={onBeforeLeave}
        />
      );

      await waitFor(() => {
        expect(onBeforeLeave).toHaveBeenCalled();
      });
    });

    it("accepts onAfterLeave callback", async () => {
      const onAfterLeave = jest.fn();
      const { rerender } = render(
        <MobileWrapperDialog
          {...defaultProps}
          isOpen={true}
          onAfterLeave={onAfterLeave}
        />
      );

      rerender(
        <MobileWrapperDialog
          {...defaultProps}
          isOpen={false}
          onAfterLeave={onAfterLeave}
        />
      );

      await waitFor(
        () => {
          expect(onAfterLeave).toHaveBeenCalled();
        },
        { timeout: 1000 }
      );
    });
  });
});
