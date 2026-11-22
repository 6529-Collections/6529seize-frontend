/**
 * @jest-environment-options {"url": "http://localhost:6529/browser-connector"}
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExecutionRevertedError, numberToHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import BrowserWalletRequestPanel from "@/components/desktop/BrowserWalletRequestPanel";
import {
  buildWalletRequestFragment,
  type WalletRequestEnvelope,
} from "@/lib/desktop/wallet-forwarding";

// Public development key (Hardhat/Anvil account 0); never funded.
const shell = privateKeyToAccount(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
);

const ADDRESS = "0x1111111111111111111111111111111111111111";
const SUBSCRIPTIONS = "0xcaac2b43b1b40edbfaddb5aebde9a90a27e1a3be";
const OTHER = "0x2222222222222222222222222222222222222222";
const ID = "Q".repeat(43);
const HASH = `0x${"cd".repeat(32)}`;
const TOP_UP = 65_290_000_000_000_000n;

let account: { isConnected: boolean; address?: string; chainId?: number } = {
  isConnected: true,
  address: ADDRESS,
  chainId: 1,
};
const sendTransactionAsync = jest.fn();
const call = jest.fn();
const publicClient = { call, readContract: jest.fn() };
const assign = jest.fn();

jest.mock("wagmi", () => ({
  useAccount: () => account,
  useConfig: () => ({ chains: [{ id: 1 }, { id: 11_155_111 }] }),
  useSignMessage: () => ({ signMessageAsync: jest.fn() }),
  useSignTypedData: () => ({ signTypedDataAsync: jest.fn() }),
  useSwitchChain: () => ({ switchChainAsync: jest.fn() }),
  useSendTransaction: () => ({ sendTransactionAsync }),
  usePublicClient: () => publicClient,
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ seizeConnect: jest.fn() }),
}));
jest.mock("@/helpers/desktop-navigation", () => ({
  loadDesktopUrlInPlace: (url: string) => assign(url),
}));

const envelope = (
  to: string,
  value: bigint,
  expiresIn = 300_000
): WalletRequestEnvelope => ({
  v: 1,
  id: ID,
  scheme: "localcore6529",
  origin: globalThis.location.origin,
  issuedAt: Date.now(),
  expiresAt: Date.now() + expiresIn,
  request: {
    method: "eth_sendTransaction",
    params: [{ from: ADDRESS, to, data: "0x", value: numberToHex(value) }],
    address: ADDRESS,
    chainId: 1,
  },
});

async function fragmentFor(value: WalletRequestEnvelope): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const fragment = buildWalletRequestFragment(
    bytes,
    await shell.signMessage({ message: { raw: bytes } })
  );
  if (fragment === null) throw new Error("fragment too large");
  return fragment;
}

const returnedData = () => {
  const link = assign.mock.calls[0]?.[0] as string;
  return JSON.parse(
    decodeURIComponent(link.slice("localcore6529://wallet?data=".length))
  ) as unknown;
};

const sendButton = () => screen.getByRole("button", { name: "Send in wallet" });

describe("BrowserWalletRequestPanel: transactions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    account = { isConnected: true, address: ADDRESS, chainId: 1 };
    globalThis.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ signer: shell.address }),
    })) as unknown as typeof fetch;
    call.mockResolvedValue({ data: "0x" });
    sendTransactionAsync.mockResolvedValue(HASH);
  });

  it("shows the decoded transaction, checks it and returns the hash", async () => {
    render(
      <BrowserWalletRequestPanel
        hash={await fragmentFor(envelope(SUBSCRIPTIONS, TOP_UP))}
      />
    );
    expect(
      await screen.findByText("Top up your Memes subscription balance")
    ).toBeInTheDocument();
    expect(screen.getByText(/6529 subscriptions wallet/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "0xCaAc2b43b1b40eDBFAdDB5aebde9A90a27E1A3be",
      })
    ).toHaveAttribute(
      "href",
      "https://etherscan.io/address/0xCaAc2b43b1b40eDBFAdDB5aebde9A90a27E1A3be"
    );
    expect(
      screen.getByText("0.06529 ETH, plus the network fee your wallet sets")
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Checked: this transaction would go through now.")
    ).toBeInTheDocument();
    expect(call).toHaveBeenCalledWith({
      account: "0x1111111111111111111111111111111111111111",
      to: "0xCaAc2b43b1b40eDBFAdDB5aebde9A90a27E1A3be",
      data: "0x",
      value: TOP_UP,
    });

    await userEvent.click(sendButton());

    await waitFor(() => expect(assign).toHaveBeenCalled());
    expect(sendTransactionAsync).toHaveBeenCalledWith({
      account: ADDRESS,
      chainId: 1,
      to: SUBSCRIPTIONS,
      data: "0x",
      value: TOP_UP,
    });
    expect(returnedData()).toEqual({ v: 1, id: ID, ok: true, value: HASH });
    expect(
      screen.getByRole("link", { name: "View the transaction on Etherscan" })
    ).toHaveAttribute("href", `https://etherscan.io/tx/${HASH}`);
  });

  it("blocks a transaction that would fail and can check again", async () => {
    call.mockRejectedValue(
      new ExecutionRevertedError({ message: "Claim inactive" })
    );
    render(
      <BrowserWalletRequestPanel
        hash={await fragmentFor(envelope(SUBSCRIPTIONS, TOP_UP))}
      />
    );
    await waitFor(() =>
      expect(
        screen
          .getAllByRole("alert")
          .some((element) =>
            /This transaction would fail/.test(element.textContent ?? "")
          )
      ).toBe(true)
    );
    expect(sendButton()).toBeDisabled();
    call.mockResolvedValue({ data: "0x" });
    await userEvent.click(screen.getByRole("button", { name: "Check again" }));
    await waitFor(() => expect(sendButton()).toBeEnabled());
  });

  it("lets the user send anyway when the check cannot run", async () => {
    call.mockRejectedValue(new Error("network down"));
    render(
      <BrowserWalletRequestPanel
        hash={await fragmentFor(envelope(SUBSCRIPTIONS, TOP_UP))}
      />
    );
    expect(
      await screen.findByText(/could not be checked right now/)
    ).toBeInTheDocument();
    expect(sendButton()).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Send anyway" }));
    expect(sendButton()).toBeEnabled();
    expect(sendButton()).toHaveAccessibleDescription(
      /could not be checked right now/
    );
  });

  it("asks for confirmation of a high-impact transaction", async () => {
    render(
      <BrowserWalletRequestPanel
        hash={await fragmentFor(envelope(SUBSCRIPTIONS, 2n * 10n ** 18n))}
      />
    );
    expect(
      await screen.findByText("This sends more than 1 ETH.")
    ).toBeInTheDocument();
    await screen.findByText("Checked: this transaction would go through now.");
    expect(sendButton()).toBeDisabled();
    await userEvent.click(
      screen.getByRole("checkbox", { name: "I understand" })
    );
    expect(sendButton()).toBeEnabled();
  });

  it("refuses a transaction outside the allow-list", async () => {
    render(
      <BrowserWalletRequestPanel
        hash={await fragmentFor(envelope(OTHER, 1n))}
      />
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /will not ask your wallet to send this transaction/
    );
    expect(
      screen.queryByRole("button", { name: "Send in wallet" })
    ).not.toBeInTheDocument();
    expect(call).not.toHaveBeenCalled();
  });

  it("asks for the request's network before sending", async () => {
    account = { isConnected: true, address: ADDRESS, chainId: 11_155_111 };
    render(
      <BrowserWalletRequestPanel
        hash={await fragmentFor(envelope(SUBSCRIPTIONS, TOP_UP))}
      />
    );
    expect(
      await screen.findByRole("button", { name: "Switch network" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Send in wallet" })
    ).not.toBeInTheDocument();
  });

  it("offers no Send with less than 45 seconds left", async () => {
    render(
      <BrowserWalletRequestPanel
        hash={await fragmentFor(envelope(SUBSCRIPTIONS, TOP_UP, 30_000))}
      />
    );
    expect(
      await screen.findByText(/Less than a minute is left/)
    ).toBeInTheDocument();
    expect(sendButton()).toBeDisabled();
  });
});
