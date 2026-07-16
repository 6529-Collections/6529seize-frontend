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

  it("dismisses a terminal state with Escape and the backdrop", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(
      <OnchainTransactionModal
        status="success"
        title="Onchain action"
        onClose={onClose}
      />
    );

    fireEvent.keyDown(document, { key: "Escape" });
    await user.click(
      screen.getByRole("button", { name: "Close modal backdrop" })
    );

    expect(onClose).toHaveBeenCalledTimes(2);
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
    expect(screen.getByRole("link", { name: "View Tx" })).toHaveAttribute(
      "href",
      "https://explorer.example/tx/0xabc"
    );
  });
});
