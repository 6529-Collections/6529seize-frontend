import ClaimTransactionModal from "@/components/drop-forge/launch/ClaimTransactionModal";
import { render, screen } from "@testing-library/react";
import { sepolia } from "viem/chains";

describe("ClaimTransactionModal", () => {
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
