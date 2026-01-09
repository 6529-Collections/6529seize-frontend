import { render, screen } from "@testing-library/react";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";

describe("MobileWrapperDialog", () => {
  const defaultProps = {
    isOpen: false,
    onClose: jest.fn(),
    children: <div data-testid="child-content">Child Content</div>,
  };

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
      <MobileWrapperDialog {...defaultProps} isOpen={true} title="Test Title" />
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("renders close button when open", () => {
    render(<MobileWrapperDialog {...defaultProps} isOpen={true} />);

    expect(screen.getByRole("button", { name: "Close panel" })).toBeInTheDocument();
  });
});
