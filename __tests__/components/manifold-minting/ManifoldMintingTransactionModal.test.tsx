import ManifoldMintingTransactionModal from "@/components/manifold-minting/ManifoldMintingTransactionModal";
import { MEMES_CONTRACT } from "@/constants/constants";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const receipt = {
  quantity: 2,
  recipient: "0x0000000000000000000000000000000000000abc",
  artworkName: "Original artwork",
  collectionLabel: "The Memes #547",
};
const hash = `0x${"a".repeat(64)}`;
const props = {
  contract: MEMES_CONTRACT,
  tokenId: 547,
  chain: { id: 1 },
  receipt,
  message: undefined,
  transactionHash: undefined,
};

describe("ManifoldMintingTransactionModal", () => {
  it("explains the wallet action with submitted details and wallet-side recovery", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(
      <ManifoldMintingTransactionModal
        {...props}
        status="confirm_wallet"
        onClose={onClose}
      />
    );

    const dialog = screen.getByRole("dialog", {
      name: "Confirm in your wallet",
    });
    expect(dialog).toHaveAccessibleDescription(
      "Review the mint details and network fee before confirming."
    );
    expect(screen.getByText(receipt.artworkName)).toBeInTheDocument();
    expect(screen.getByText(receipt.recipient)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Recipient")).toBeInTheDocument();
    expect(screen.queryByText("Minted to")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Done|Close/ })
    ).not.toBeInTheDocument();

    const help = screen.getByText("Wallet not showing?");
    const instructions = screen.getByText(/To stop, reject it in your wallet/);
    expect(instructions).not.toBeVisible();
    await user.tab();
    expect(help).toHaveFocus();
    await user.click(help);
    expect(instructions).toBeVisible();
    await user.tab();
    expect(help).toHaveFocus();
    await user.tab({ shift: true });
    expect(help).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("keeps one dialog and live region throughout the mint while recovering removed focus targets", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const { rerender } = render(
      <ManifoldMintingTransactionModal
        {...props}
        status="confirm_wallet"
        onClose={onClose}
      />
    );
    const dialog = screen.getByRole("dialog");
    const status = screen.getByRole("status");
    await user.tab();
    expect(screen.getByText("Wallet not showing?")).toHaveFocus();

    rerender(
      <ManifoldMintingTransactionModal
        {...props}
        status="submitted"
        transactionHash={hash}
        onClose={onClose}
      />
    );
    expect(screen.getByRole("dialog", { name: "Mint submitted" })).toBe(dialog);
    expect(dialog).toHaveFocus();
    expect(screen.getByRole("status")).toBe(status);
    expect(status).toHaveTextContent(
      "Mint submitted Waiting for network confirmation."
    );
    expect(status).not.toHaveTextContent(receipt.artworkName);
    expect(status).not.toHaveTextContent(receipt.recipient);
    expect(screen.queryByText("Wallet not showing?")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Done" })
    ).not.toBeInTheDocument();
    const transactionLink = screen.getByRole("link", {
      name: "View transaction Opens in a new tab",
    });
    expect(transactionLink).toHaveAttribute(
      "href",
      `https://etherscan.io/tx/${hash}`
    );
    expect(transactionLink).toHaveAttribute("target", "_blank");
    await user.tab();
    expect(transactionLink).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();

    rerender(
      <ManifoldMintingTransactionModal
        {...props}
        status="success"
        transactionHash={hash}
        onClose={onClose}
      />
    );
    expect(screen.getByRole("dialog", { name: "SEIZED!" })).toBe(dialog);
    expect(dialog).toHaveFocus();
    expect(screen.getByRole("status")).toBe(status);
    expect(status).toHaveTextContent("SEIZED! Your mint is confirmed.");
    expect(screen.getByText("Minted to")).toBeInTheDocument();
    expect(screen.queryByText("Recipient")).not.toBeInTheDocument();
    expect(screen.getByText(receipt.recipient)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("preserves focus on the dialog when its current target survives a stage change", () => {
    const { rerender } = render(
      <ManifoldMintingTransactionModal
        {...props}
        status="confirm_wallet"
        onClose={jest.fn()}
      />
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveFocus();
    rerender(
      <ManifoldMintingTransactionModal
        {...props}
        status="submitted"
        transactionHash={hash}
        onClose={jest.fn()}
      />
    );
    expect(dialog).toHaveFocus();
  });

  it.each(["confirm_wallet", "submitted"] as const)(
    "keeps %s guidance usable without receipt metadata",
    (status) => {
      render(
        <ManifoldMintingTransactionModal
          {...props}
          status={status}
          receipt={undefined}
          onClose={jest.fn()}
        />
      );
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
      expect(screen.queryByText("Minted to")).not.toBeInTheDocument();
      if (status === "confirm_wallet") {
        expect(screen.getByText("Wallet not showing?")).toBeInTheDocument();
      } else {
        expect(
          screen.getByText("This window updates automatically.")
        ).toBeInTheDocument();
      }
    }
  );

  it("keeps a pending mint readable after artwork fails", () => {
    render(
      <ManifoldMintingTransactionModal
        {...props}
        status="submitted"
        receipt={{ ...receipt, imageUrl: "/unavailable.png" }}
        transactionHash={hash}
        onClose={jest.fn()}
      />
    );
    fireEvent.error(screen.getByRole("img", { name: receipt.artworkName }));
    expect(
      screen.getByRole("img", { name: "Artwork preview unavailable" })
    ).toBeInTheDocument();
    expect(screen.getByText(receipt.artworkName)).toBeInTheDocument();
    expect(screen.getByText(receipt.recipient)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /View transaction/ })
    ).toBeInTheDocument();
  });

  it("preserves the existing error details and dismissal after a wallet rejection", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(
      <ManifoldMintingTransactionModal
        {...props}
        status="error"
        message="Request rejected in wallet"
        onClose={onClose}
      />
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Transaction error details" })
    ).toHaveValue("Request rejected in wallet");
    expect(screen.queryByText("Wallet not showing?")).not.toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
