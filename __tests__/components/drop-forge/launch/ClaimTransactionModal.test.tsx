import ClaimTransactionModal from "@/components/drop-forge/launch/ClaimTransactionModal";
import { render, screen } from "@testing-library/react";
import { sepolia } from "viem/chains";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { formatDecimalString, formatInteger } from "@/i18n/format";

jest.mock("@/hooks/useBrowserLocale");

const useBrowserLocaleMock = jest.mocked(useBrowserLocale);

describe("ClaimTransactionModal", () => {
  beforeEach(() => {
    useBrowserLocaleMock.mockReturnValue("en-US");
  });

  it.each([
    "Airdrop to Research",
    "Airdrop Artist",
    "Airdrop Team",
    "Airdrop Subscriptions",
  ])("shows the exact quantity for %s through every status", (actionLabel) => {
    const { rerender } = render(
      <ClaimTransactionModal state={null} chain={sepolia} onClose={jest.fn()} />
    );

    for (const status of [
      "confirm_wallet",
      "submitted",
      "success",
      "error",
    ] as const) {
      rerender(
        <ClaimTransactionModal
          state={{
            status,
            actionLabel,
            airdrop: { quantity: "27", walletCount: 3 },
          }}
          chain={sepolia}
          onClose={jest.fn()}
          showAirdropSummary
        />
      );
      expect(
        screen.getByRole("dialog", { name: actionLabel })
      ).toHaveAccessibleDescription("Copies: 27 · Recipient wallets: 3");
      expect(
        screen.getByText("Copies: 27 · Recipient wallets: 3")
      ).toBeVisible();
    }
  });

  it("keeps the ordinary wallet dialog when automation is off", () => {
    render(
      <ClaimTransactionModal
        state={{
          status: "confirm_wallet",
          actionLabel: "Airdrop Subscriptions",
          airdrop: { quantity: "27", walletCount: 3 },
        }}
        chain={sepolia}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByText("Confirm in your wallet")).toBeInTheDocument();
    expect(screen.queryByText(/Recipient wallets/)).not.toBeInTheDocument();
  });

  it.each(SUPPORTED_LOCALES)("formats exact totals in %s", (locale) => {
    useBrowserLocaleMock.mockReturnValue(locale);
    const quantity = "9007199254740993";
    render(
      <ClaimTransactionModal
        state={{
          status: "confirm_wallet",
          actionLabel: "Airdrop Subscriptions",
          airdrop: { quantity, walletCount: 1234 },
        }}
        chain={sepolia}
        onClose={jest.fn()}
        showAirdropSummary
      />
    );
    expect(screen.getByRole("dialog")).toHaveAccessibleDescription(
      `Copies: ${formatDecimalString(locale, quantity)} · Recipient wallets: ${formatInteger(locale, 1234)}`
    );
  });

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
    expect(
      screen.getByRole("textbox", { name: "Transaction error details" })
    ).toHaveValue("Claim update failed");
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
    expect(
      screen.getByRole("textbox", { name: "Transaction error details" })
    ).toHaveValue("Artist payment failed");
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
