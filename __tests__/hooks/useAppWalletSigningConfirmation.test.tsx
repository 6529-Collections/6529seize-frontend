import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { parseEther } from "viem";
import { useAppWalletSigningConfirmation } from "@/hooks/useAppWalletSigningConfirmation";
import {
  type AppWalletSigningRequest,
  confirmAppWalletSigningRequest,
} from "@/wagmiConfig/appWalletSigningConfirmation";

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ setToast: jest.fn() }),
}));
jest.mock("@/components/app-wallets/AppWalletsContext", () => ({
  useAppWallets: () => ({ setError: jest.fn() }),
}));

let mockLocale = "en-US";
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => mockLocale,
}));

const WALLET = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const ETHER = { symbol: "ETH", decimals: 18 };
const RECIPIENT = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

function Host() {
  return useAppWalletSigningConfirmation();
}

function request(
  input: AppWalletSigningRequest
): Promise<"approved" | "rejected"> {
  return confirmAppWalletSigningRequest(input).then(
    () => "approved" as const,
    (error: { code?: number }) => {
      expect(error.code).toBe(4001);
      return "rejected" as const;
    }
  );
}

describe("useAppWalletSigningConfirmation", () => {
  it("shows the exact message and approves it on Sign", async () => {
    const user = userEvent.setup();
    render(<Host />);

    let outcome!: Promise<string>;
    act(() => {
      outcome = request({
        kind: "message",
        walletAddress: WALLET,
        text: "Sign in to 6529\nNonce: 42",
        rawHex: null,
        canShowContent: true,
      });
    });

    const dialog = await screen.findByRole("dialog", {
      name: "Sign this message?",
    });
    expect(within(dialog).getByText(WALLET)).toBeInTheDocument();
    expect(dialog).toHaveTextContent("Sign in to 6529 Nonce: 42");
    // Focus starts on the heading, never on a control that dismisses.
    await waitFor(() =>
      expect(
        within(dialog).getByRole("heading", { name: "Sign this message?" })
      ).toHaveFocus()
    );
    // Long content is a named scroll region the keyboard can reach.
    expect(
      within(dialog).getByRole("region", { name: "Message" })
    ).toHaveAttribute("tabindex", "0");

    await user.click(within(dialog).getByRole("button", { name: "Sign" }));
    await expect(outcome).resolves.toBe("approved");
    expect(dialog).not.toHaveAttribute("open");
  });

  it("shows transaction details and rejects on Cancel", async () => {
    const user = userEvent.setup();
    render(<Host />);

    let outcome!: Promise<string>;
    act(() => {
      outcome = request({
        kind: "transaction",
        walletAddress: WALLET,
        to: RECIPIENT.toLowerCase() as `0x${string}`,
        valueWei: parseEther("0.13058"),
        chainId: 1,
        chainName: "Ethereum",
        nativeCurrency: ETHER,
        callDataBytes: 68,
        selector: "0xa9059cbb",
        canShowContent: true,
      });
    });

    const dialog = await screen.findByRole("dialog", {
      name: "Approve this transaction?",
    });
    // The recipient is shown in full, checksummed.
    expect(within(dialog).getByText(RECIPIENT)).toBeInTheDocument();
    expect(within(dialog).getByText("0.13058 ETH")).toBeInTheDocument();
    expect(
      within(dialog).getByText("Ethereum (chain ID 1)")
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("Yes, function selector 0xa9059cbb")
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await expect(outcome).resolves.toBe("rejected");
  });

  it("shows a contract deployment and plain transfer in plain terms", async () => {
    const user = userEvent.setup();
    render(<Host />);

    let outcome!: Promise<string>;
    act(() => {
      outcome = request({
        kind: "transaction",
        walletAddress: WALLET,
        to: null,
        valueWei: 0n,
        chainId: 1,
        chainName: "Ethereum",
        nativeCurrency: ETHER,
        callDataBytes: 0,
        selector: null,
        canShowContent: true,
      });
    });

    const dialog = await screen.findByRole("dialog", {
      name: "Approve this transaction?",
    });
    expect(
      within(dialog).getByText("New contract deployment")
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("Contract creation, 0 bytes of code")
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Approve" }));
    await expect(outcome).resolves.toBe("approved");
  });

  it("shows typed data by type and domain", async () => {
    const user = userEvent.setup();
    render(<Host />);

    let outcome!: Promise<string>;
    act(() => {
      outcome = request({
        kind: "typedData",
        walletAddress: WALLET,
        primaryType: "Grant",
        domainName: "6529",
        domainChainId: 1,
        domainChainName: "Ethereum",
        verifyingContract: RECIPIENT,
        canShowContent: true,
        messageJson: '{\n  "amount": "5"\n}',
      });
    });

    const dialog = await screen.findByRole("dialog", {
      name: "Sign this data?",
    });
    expect(within(dialog).getByText("Grant")).toBeInTheDocument();
    expect(within(dialog).getByText("6529")).toBeInTheDocument();
    expect(within(dialog).getByText(RECIPIENT)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await expect(outcome).resolves.toBe("rejected");
  });

  it("rejects a pending request when the dialog host unmounts", async () => {
    const { unmount } = render(<Host />);

    let outcome!: Promise<string>;
    act(() => {
      outcome = request({
        kind: "message",
        walletAddress: WALLET,
        text: "hello",
        rawHex: null,
        canShowContent: true,
      });
    });
    await screen.findByRole("dialog", { name: "Sign this message?" });

    unmount();
    await expect(outcome).resolves.toBe("rejected");
    // With no dialog mounted, later requests are rejected too.
    await expect(
      request({
        kind: "message",
        walletAddress: WALLET,
        text: "later",
        rawHex: null,
        canShowContent: true,
      })
    ).resolves.toBe("rejected");
  });

  it("labels the amount with the chain's own native token", async () => {
    const user = userEvent.setup();
    render(<Host />);

    let outcome!: Promise<string>;
    act(() => {
      outcome = request({
        kind: "transaction",
        walletAddress: WALLET,
        to: RECIPIENT,
        valueWei: parseEther("2.5"),
        chainId: 137,
        chainName: "Polygon",
        nativeCurrency: { symbol: "POL", decimals: 18 },
        callDataBytes: 0,
        selector: null,
        canShowContent: true,
      });
    });

    const dialog = await screen.findByRole("dialog", {
      name: "Approve this transaction?",
    });
    expect(within(dialog).getByText("2.5 POL")).toBeInTheDocument();
    expect(within(dialog).queryByText(/ETH/)).toBeNull();
    expect(within(dialog).getByText("None")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await expect(outcome).resolves.toBe("rejected");
  });

  it("shows the raw amount for an unknown chain without naming a token", async () => {
    const user = userEvent.setup();
    render(<Host />);

    let outcome!: Promise<string>;
    act(() => {
      outcome = request({
        kind: "transaction",
        walletAddress: WALLET,
        to: RECIPIENT,
        valueWei: 1500n,
        chainId: 999,
        chainName: null,
        nativeCurrency: null,
        callDataBytes: 2,
        selector: null,
        canShowContent: true,
      });
    });

    const dialog = await screen.findByRole("dialog", {
      name: "Approve this transaction?",
    });
    expect(
      within(dialog).getByText(
        "1,500 in the smallest unit of the native token of chain ID 999"
      )
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("Yes, 2 bytes without a function selector")
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await expect(outcome).resolves.toBe("rejected");
  });

  it("formats the amount for a comma-decimal locale without losing digits", async () => {
    mockLocale = "de-DE";
    try {
      const user = userEvent.setup();
      render(<Host />);

      let outcome!: Promise<string>;
      act(() => {
        outcome = request({
          kind: "transaction",
          walletAddress: WALLET,
          to: RECIPIENT,
          valueWei: 1234567123456789012345678n,
          chainId: 1,
          chainName: "Ethereum",
          nativeCurrency: ETHER,
          callDataBytes: 0,
          selector: null,
          canShowContent: true,
        });
      });

      const dialog = await screen.findByRole("dialog", {
        name: "Approve this transaction?",
      });
      expect(dialog.textContent).toContain("1.234.567,123456789012345678 ETH");
      await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
      await expect(outcome).resolves.toBe("rejected");
    } finally {
      mockLocale = "en-US";
    }
  });

  it("says when content cannot be shown and does not allow signing it", async () => {
    const user = userEvent.setup();
    render(<Host />);

    let outcome!: Promise<string>;
    act(() => {
      outcome = request({
        kind: "typedData",
        walletAddress: WALLET,
        primaryType: "Grant",
        domainName: "6529",
        domainChainId: 1,
        domainChainName: "Ethereum",
        verifyingContract: RECIPIENT,
        messageJson: null,
        canShowContent: false,
      });
    });

    const dialog = await screen.findByRole("dialog", {
      name: "Sign this data?",
    });
    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "This content cannot be shown, so it cannot be signed here."
    );
    expect(within(dialog).queryByRole("region")).toBeNull();
    expect(within(dialog).getByRole("button", { name: "Sign" })).toBeDisabled();
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await expect(outcome).resolves.toBe("rejected");
  });

  it("does not let a host that unmounts block the next request", async () => {
    const first = render(<Host />);
    let firstOutcome!: Promise<string>;
    act(() => {
      firstOutcome = request({
        kind: "message",
        walletAddress: WALLET,
        text: "first",
        rawHex: null,
        canShowContent: true,
      });
    });
    await screen.findByRole("dialog", { name: "Sign this message?" });
    first.unmount();
    await expect(firstOutcome).resolves.toBe("rejected");

    const user = userEvent.setup();
    render(<Host />);
    let secondOutcome!: Promise<string>;
    act(() => {
      secondOutcome = request({
        kind: "message",
        walletAddress: WALLET,
        text: "second",
        rawHex: null,
        canShowContent: true,
      });
    });
    const dialog = await screen.findByRole("dialog", {
      name: "Sign this message?",
    });
    expect(dialog).toHaveTextContent("second");
    await user.click(within(dialog).getByRole("button", { name: "Sign" }));
    await expect(secondOutcome).resolves.toBe("approved");
  });
});
