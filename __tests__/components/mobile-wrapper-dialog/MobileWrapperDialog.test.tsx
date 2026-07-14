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

    it("renders close button when open", () => {
      render(<MobileWrapperDialog {...defaultProps} isOpen={true} />);

      expect(
        screen.getByRole("button", { name: "Close panel" })
      ).toBeInTheDocument();
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

      const closeButton = screen.getByRole("button", { name: "Close panel" });
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

      const closeButton = screen.getByRole("button", { name: "Close panel" });
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
