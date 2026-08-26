import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WaveGuidelinesAgreementDialog from "@/components/waves/create-drop-content/WaveGuidelinesAgreementDialog";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

describe("WaveGuidelinesAgreementDialog", () => {
  it("renders an accessible, scroll-contained guidelines decision", async () => {
    const user = userEvent.setup();
    const onAgree = jest.fn();
    const onDecline = jest.fn();
    const { container } = render(
      <WaveGuidelinesAgreementDialog
        guidelines={"Be thoughtful.\nStay on topic."}
        onAgree={onAgree}
        onDecline={onDecline}
      />
    );

    const dialog = screen.getByRole("dialog", { name: "Wave guidelines" });
    expect(dialog).toBeVisible();
    expect(dialog).toHaveAccessibleDescription(
      "Review this wave's guidelines before sending your first message."
    );
    const guidelines = screen.getByText(
      (_content, element) =>
        element?.tagName === "P" &&
        element.textContent === "Be thoughtful.\nStay on topic."
    );
    expect(guidelines).toBeVisible();
    expect(screen.getByText("Guidelines")).toBeVisible();
    expect(screen.getByText(/Decline keeps it as a draft/)).toBeVisible();
    expect(container).toBeEmptyDOMElement();

    const guidelinesScroller = screen.getByRole("region", {
      name: "Guidelines",
    });
    expect(guidelinesScroller).toHaveClass("tw-overflow-y-auto");
    expect(guidelinesScroller).toHaveAttribute("tabindex", "0");

    const agreeButton = screen.getByRole("button", { name: "Agree" });
    await waitFor(() => expect(agreeButton).toHaveFocus());

    await user.click(agreeButton);
    expect(onAgree).toHaveBeenCalledTimes(1);
    expect(onDecline).not.toHaveBeenCalled();
  });

  it("treats Decline and Escape as non-submitting dismissal", async () => {
    const user = userEvent.setup();
    const onDecline = jest.fn();
    const { rerender } = render(
      <WaveGuidelinesAgreementDialog
        guidelines="Be kind."
        onAgree={jest.fn()}
        onDecline={onDecline}
      />
    );

    await user.click(screen.getByRole("button", { name: "Decline" }));
    expect(onDecline).toHaveBeenCalledTimes(1);

    rerender(
      <WaveGuidelinesAgreementDialog
        guidelines="Be kind."
        onAgree={jest.fn()}
        onDecline={onDecline}
      />
    );
    await user.keyboard("{Escape}");
    expect(onDecline).toHaveBeenCalledTimes(2);
  });

  it("does not render when no agreement is pending", () => {
    render(
      <WaveGuidelinesAgreementDialog
        guidelines={null}
        onAgree={jest.fn()}
        onDecline={jest.fn()}
      />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
