import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TermsOfServiceModal from "@/components/terms/TermsOfServiceModal";

jest.mock("@/components/waves/memes/submission/layout/ModalLayout", () => ({
  __esModule: true,
  default: ({ children, title, titleId }: any) => (
    <div data-testid="layout">
      <h2 id={titleId}>{title}</h2>
      {children}
    </div>
  ),
}));

jest.mock("focus-trap-react", () => ({
  FocusTrap: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/utils/button/PrimaryButton", () => ({
  __esModule: true,
  default: ({ children, onClicked, ...props }: any) => (
    <button data-testid="primary" onClick={onClicked} {...props}>
      {children}
    </button>
  ),
}));

describe("TermsOfServiceModal", () => {
  it("returns null when closed", () => {
    const { container } = render(
      <TermsOfServiceModal
        isOpen={false}
        onClose={jest.fn()}
        onAccept={jest.fn()}
        termsContent={""}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("displays content and allows acceptance", async () => {
    const onAccept = jest.fn();
    const { container } = render(
      <TermsOfServiceModal
        isOpen
        onClose={jest.fn()}
        onAccept={onAccept}
        termsContent="terms"
      />
    );
    const dialog = screen.getByRole("dialog", { name: "Submission rules" });
    expect(dialog).toHaveClass("tailwind-scope", "tw-z-[1100]");
    expect(container).not.toContainElement(dialog);
    const checkbox = screen.getByRole("checkbox");
    const button = screen.getByTestId("primary");
    expect(button).toBeDisabled();
    await userEvent.click(checkbox);
    expect(button).toBeEnabled();
    await userEvent.click(button);
    expect(onAccept).toHaveBeenCalled();
  });

  it("shows placeholder when no terms", () => {
    render(
      <TermsOfServiceModal
        isOpen
        onClose={jest.fn()}
        onAccept={jest.fn()}
        termsContent={null}
      />
    );
    expect(screen.getByText("No submission rules found.")).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const onClose = jest.fn();
    render(
      <TermsOfServiceModal
        isOpen
        onClose={onClose}
        onAccept={jest.fn()}
        termsContent="t"
      />
    );
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("toggles via Space key", async () => {
    render(
      <TermsOfServiceModal
        isOpen
        onClose={jest.fn()}
        onAccept={jest.fn()}
        termsContent="t"
      />
    );
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
    checkbox.focus();
    await userEvent.keyboard(" ");
    expect(checkbox).toBeChecked();
  });

  it("keeps the dialog open while signing", async () => {
    const onClose = jest.fn();
    render(
      <TermsOfServiceModal
        isOpen
        onClose={onClose}
        onAccept={jest.fn()}
        termsContent="t"
        isLoading
      />
    );

    expect(screen.getByRole("checkbox")).toBeDisabled();
    await userEvent.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("resets acknowledgement when reopened", async () => {
    const onClose = jest.fn();
    const onAccept = jest.fn();
    const { rerender } = render(
      <TermsOfServiceModal
        isOpen
        onClose={onClose}
        onAccept={onAccept}
        termsContent="t"
      />
    );

    await userEvent.click(screen.getByRole("checkbox"));
    expect(screen.getByTestId("primary")).toBeEnabled();

    rerender(
      <TermsOfServiceModal
        isOpen={false}
        onClose={onClose}
        onAccept={onAccept}
        termsContent="t"
      />
    );
    rerender(
      <TermsOfServiceModal
        isOpen
        onClose={onClose}
        onAccept={onAccept}
        termsContent="t"
      />
    );

    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.getByTestId("primary")).toBeDisabled();
  });
});
