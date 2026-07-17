import ClaimTransactionModal from "@/components/drop-forge/launch/ClaimTransactionModal";
import { render, screen } from "@testing-library/react";
import { sepolia } from "viem/chains";

describe("ClaimTransactionModal", () => {
  it("preserves all Drop Forge transaction status transitions", () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <ClaimTransactionModal
        state={{
          status: "confirm_wallet",
          actionLabel: "Update Claim",
        }}
        chain={sepolia}
        onClose={onClose}
      />
    );

    expect(screen.getByText("Confirm in your wallet")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Close modal" })
    ).not.toBeInTheDocument();

    rerender(
      <ClaimTransactionModal
        state={{
          status: "submitted",
          actionLabel: "Update Claim",
          txHash: "0x123",
        }}
        chain={sepolia}
        onClose={onClose}
      />
    );
    expect(screen.getByText("Transaction Submitted")).toBeInTheDocument();
    expect(screen.getByText("Waiting for confirmation")).toBeInTheDocument();

    rerender(
      <ClaimTransactionModal
        state={{
          status: "success",
          actionLabel: "Update Claim",
          txHash: "0x123",
        }}
        chain={sepolia}
        onClose={onClose}
      />
    );
    expect(screen.getByText("Transaction Successful!")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Close modal" })
    ).toBeInTheDocument();

    rerender(
      <ClaimTransactionModal
        state={{
          status: "error",
          actionLabel: "Update Claim",
          message: "Claim update failed",
          txHash: "0x123",
        }}
        chain={sepolia}
        onClose={onClose}
      />
    );
    expect(screen.getByText("Claim update failed")).toBeInTheDocument();
  });

  it("maps Drop Forge transaction state into the shared modal", () => {
    render(
      <ClaimTransactionModal
        state={{
          status: "error",
          actionLabel: "Pay Artist",
          message: "Artist payment failed",
          txHash: "0x123",
        }}
        chain={sepolia}
        onClose={jest.fn()}
      />
    );

    expect(
      screen.getByRole("dialog", { name: "Pay Artist" })
    ).toBeInTheDocument();
    expect(screen.getByText("Artist payment failed")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Tx" })).toHaveAttribute(
      "href",
      "https://sepolia.etherscan.io/tx/0x123"
    );
  });

  it("does not render without active Drop Forge transaction state", () => {
    render(
      <ClaimTransactionModal state={null} chain={sepolia} onClose={jest.fn()} />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
