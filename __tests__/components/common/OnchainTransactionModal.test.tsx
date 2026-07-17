import OnchainTransactionModal, {
  type OnchainTransactionModalStatus,
} from "@/components/common/OnchainTransactionModal";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const DEFAULT_MESSAGES: Record<OnchainTransactionModalStatus, string> = {
  confirm_wallet: "Confirm in your wallet",
  submitted: "Transaction Submitted",
  success: "Transaction Successful!",
  error: "Transaction failed",
};

describe("OnchainTransactionModal", () => {
  it.each([
    ["confirm_wallet", false],
    ["submitted", false],
    ["success", true],
    ["error", true],
  ] as const)("renders the %s status", (status, closable) => {
    render(
      <OnchainTransactionModal
        status={status}
        title="Onchain action"
        onClose={jest.fn()}
      />
    );

    expect(
      screen.getByRole("dialog", { name: "Onchain action" })
    ).toBeInTheDocument();
    expect(screen.getByText(DEFAULT_MESSAGES[status])).toBeInTheDocument();

    const closeButton = screen.queryByRole("button", { name: "Close modal" });
    if (closable) {
      expect(closeButton).toBeInTheDocument();
    } else {
      expect(closeButton).not.toBeInTheDocument();
    }
  });

  it("uses the subtitle as the accessible dialog description", () => {
    render(
      <OnchainTransactionModal
        status="confirm_wallet"
        title="Top up"
        subtitle="2 Cards - 0.13 ETH"
        onClose={jest.fn()}
      />
    );

    expect(
      screen.getByRole("dialog", { name: "Top up" })
    ).toHaveAccessibleDescription("2 Cards - 0.13 ETH");
  });

  it("ignores Escape and has no dismissing backdrop before a terminal state", () => {
    const onClose = jest.fn();
    render(
      <OnchainTransactionModal
        status="submitted"
        title="Onchain action"
        onClose={onClose}
      />
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Close modal backdrop" })
    ).not.toBeInTheDocument();
  });

  it("dismisses a terminal state with Escape", () => {
    const onClose = jest.fn();
    render(
      <OnchainTransactionModal
        status="success"
        title="Onchain action"
        onClose={onClose}
      />
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("dismisses a terminal state with the backdrop", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(
      <OnchainTransactionModal
        status="success"
        title="Onchain action"
        onClose={onClose}
      />
    );

    await user.click(
      screen.getByRole("button", { name: "Close modal backdrop" })
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("updates Escape behavior without stealing focus from a nested modal", () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <OnchainTransactionModal
        status="confirm_wallet"
        title="Onchain action"
        onClose={onClose}
      />
    );
    const dialog = screen.getByRole("dialog", { name: "Onchain action" });

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();

    const nestedDialog = document.createElement("dialog");
    nestedDialog.setAttribute("open", "");
    nestedDialog.setAttribute("aria-modal", "true");
    const nestedControl = document.createElement("button");
    nestedDialog.appendChild(nestedControl);
    document.body.appendChild(nestedDialog);
    nestedControl.focus();

    rerender(
      <OnchainTransactionModal
        status="success"
        title="Onchain action"
        onClose={onClose}
      />
    );

    expect(nestedControl).toHaveFocus();
    fireEvent.keyDown(nestedControl, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();

    nestedDialog.remove();
    dialog.focus();
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("leaves nested-modal and already-handled Tab events alone", () => {
    render(
      <OnchainTransactionModal
        status="success"
        title="Onchain action"
        transactionLink="https://explorer.example/tx/0xabc"
        onClose={jest.fn()}
      />
    );

    const nestedDialog = document.createElement("dialog");
    nestedDialog.setAttribute("open", "");
    nestedDialog.setAttribute("aria-modal", "true");
    const nestedControl = document.createElement("button");
    nestedDialog.appendChild(nestedControl);
    document.body.appendChild(nestedDialog);
    nestedControl.focus();

    const nestedTabEvent = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    nestedControl.dispatchEvent(nestedTabEvent);

    expect(nestedTabEvent.defaultPrevented).toBe(false);
    expect(nestedControl).toHaveFocus();

    nestedDialog.remove();
    const handledControl = document.createElement("button");
    handledControl.addEventListener("keydown", (event) => {
      event.preventDefault();
    });
    document.body.appendChild(handledControl);
    handledControl.focus();

    const handledTabEvent = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    handledControl.dispatchEvent(handledTabEvent);

    expect(handledTabEvent.defaultPrevented).toBe(true);
    expect(handledControl).toHaveFocus();
    handledControl.remove();
  });

  it("traps Tab focus inside the transaction dialog", async () => {
    const user = userEvent.setup();
    render(
      <OnchainTransactionModal
        status="success"
        title="Onchain action"
        transactionLink="https://explorer.example/tx/0xabc"
        onClose={jest.fn()}
      />
    );

    const dialog = screen.getByRole("dialog", { name: "Onchain action" });
    const closeButton = screen.getByRole("button", { name: "Close modal" });
    const transactionLink = screen.getByRole("link", { name: "View Tx" });

    expect(dialog).toHaveFocus();
    await user.tab();
    expect(closeButton).toHaveFocus();
    await user.tab();
    expect(transactionLink).toHaveFocus();
    await user.tab();
    expect(closeButton).toHaveFocus();
    await user.tab({ shift: true });
    expect(transactionLink).toHaveFocus();
  });

  it("links a transaction hash using the supplied chain", () => {
    render(
      <OnchainTransactionModal
        status="submitted"
        title="Onchain action"
        transactionHash="0x123"
        chain={{ id: 11155111 }}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByRole("link", { name: "View Tx" })).toHaveAttribute(
      "href",
      "https://sepolia.etherscan.io/tx/0x123"
    );
  });

  it("locks body scroll, takes initial focus and restores focus on close", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();
    document.body.style.overflow = "auto";

    const { unmount } = render(
      <OnchainTransactionModal
        status="confirm_wallet"
        title="Onchain action"
        onClose={jest.fn()}
      />
    );

    expect(
      screen.getByRole("dialog", { name: "Onchain action" })
    ).toHaveFocus();
    expect(document.body.style.overflow).toBe("hidden");

    unmount();

    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe("auto");
    trigger.remove();
    document.body.style.overflow = "";
  });

  it("wraps a custom long error and shows its transaction link", () => {
    const longError = `Failed ${"very-long-error-segment".repeat(20)}`;
    render(
      <OnchainTransactionModal
        status="error"
        title="Pay Artist"
        message={longError}
        transactionLink="https://explorer.example/tx/0xabc"
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText(longError)).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Transaction error details" })
    ).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("link", { name: "View Tx" })).toHaveAttribute(
      "href",
      "https://explorer.example/tx/0xabc"
    );
  });

  it("falls back to the default error for an empty custom message", () => {
    render(
      <OnchainTransactionModal
        status="error"
        title="Onchain action"
        message="   "
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText("Transaction failed")).toBeInTheDocument();
  });

  it("uses valid block markup for live status content", () => {
    render(
      <OnchainTransactionModal
        status="submitted"
        title="Onchain action"
        onClose={jest.fn()}
      />
    );

    expect(screen.getByRole("status").tagName).toBe("DIV");
  });
});
