/**
 * @jest-environment-options {"url": "http://localhost:6529/browser-connector"}
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { privateKeyToAccount } from "viem/accounts";
import BrowserWalletRequestPanel from "@/components/desktop/BrowserWalletRequestPanel";
import {
  buildWalletRequestFragment,
  WALLET_REQUEST_TTL_MS,
  type WalletRequestEnvelope,
} from "@/lib/desktop/wallet-forwarding";
import {
  buildSafeTxVectors,
  SAFE_TX_SIGNER,
} from "@/__tests__/fixtures/desktop-wallet-safe-tx/vectors";

// Public development key (Hardhat/Anvil account 0); never funded.
const shell = privateKeyToAccount(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
);

const SAFE = "0x87BD1Be4FbDEf9251C318b4870542217AA2AdB68";
const ID = "Q".repeat(43);
const SIGNATURE = `0x${"ab".repeat(65)}`;

let account: { isConnected: boolean; address?: string; chainId?: number } = {
  isConnected: true,
  address: SAFE_TX_SIGNER,
  chainId: 11_155_111,
};
const readContract = jest.fn();
const signTypedDataAsync = jest.fn();
const assign = jest.fn();
// Stable objects, as wagmi returns them: the page keys its checks on them.
const config = { chains: [{ id: 1 }, { id: 11_155_111 }] };
const publicClient = { readContract, call: jest.fn() };

jest.mock("wagmi", () => ({
  useAccount: () => account,
  useConfig: () => config,
  useSignMessage: () => ({ signMessageAsync: jest.fn() }),
  useSignTypedData: () => ({ signTypedDataAsync }),
  useSwitchChain: () => ({ switchChainAsync: jest.fn() }),
  useSendTransaction: () => ({ sendTransactionAsync: jest.fn() }),
  usePublicClient: () => publicClient,
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ seizeConnect: jest.fn() }),
}));
jest.mock("@/helpers/desktop-navigation", () => ({
  loadDesktopUrlInPlace: (url: string) => assign(url),
}));

const vector = (name: string) => {
  const found = buildSafeTxVectors().find((item) => item.name === name);
  if (!found) throw new Error(name);
  return found;
};

async function fragmentFor(name: string): Promise<string> {
  const { payload, chainId } = vector(name);
  const issuedAt = Date.now();
  const envelope: WalletRequestEnvelope = {
    v: 1,
    id: ID,
    scheme: "localcore6529",
    origin: globalThis.location.origin,
    issuedAt,
    expiresAt: issuedAt + WALLET_REQUEST_TTL_MS,
    request: {
      method: "eth_signTypedData_v4",
      params: [SAFE_TX_SIGNER, payload],
      address: SAFE_TX_SIGNER,
      chainId,
    },
  };
  const bytes = new TextEncoder().encode(JSON.stringify(envelope));
  const fragment = buildWalletRequestFragment(
    bytes,
    await shell.signMessage({ message: { raw: bytes } })
  );
  if (fragment === null) throw new Error("fragment too large");
  return fragment;
}

/** The chain as the page reads it: the Safe owns both registries. */
function chain(overrides: Partial<Record<string, unknown>> = {}) {
  const answers: Record<string, unknown> = {
    getOwners: [SAFE_TX_SIGNER, "0x1111111111111111111111111111111111111111"],
    getThreshold: 2n,
    nonce: 7n,
    owner: SAFE,
    pendingOwner: SAFE,
    ...overrides,
  };
  readContract.mockImplementation(
    async ({ functionName }: { functionName: string }) => {
      const answer = answers[functionName];
      if (answer instanceof Error) throw answer;
      return answer;
    }
  );
}

const signButton = () => screen.getByRole("button", { name: "Sign in wallet" });

beforeEach(() => {
  jest.clearAllMocks();
  account = {
    isConnected: true,
    address: SAFE_TX_SIGNER,
    chainId: 11_155_111,
  };
  globalThis.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({ signer: shell.address }),
  })) as unknown as typeof fetch;
  signTypedDataAsync.mockResolvedValue(SIGNATURE);
});

describe("BrowserWalletRequestPanel: Safe transactions", () => {
  it("shows a batch in order with the Safe and nonce, then signs", async () => {
    chain();
    render(
      <BrowserWalletRequestPanel
        hash={await fragmentFor("a batch of registrations on both registries")}
      />
    );
    expect(
      await screen.findByText(
        "Approve a 6529 Provenance governance action as a signer of this Safe"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This is a signature, not a transaction/)
    ).toBeInTheDocument();
    expect(
      screen.getByText("1. Register a canonicalization")
    ).toBeInTheDocument();
    expect(screen.getByText("2. Register a record type")).toBeInTheDocument();
    expect(
      screen.getByText("3. Register a schema (by hash and CID)")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/6529 Network Museum catalog registry/)
    ).toBeInTheDocument();
    expect(
      await screen.findByText("6529 Provenance test Safe (2 of 2 signers)")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: SAFE })).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    await waitFor(() => expect(signButton()).toBeEnabled());
    await userEvent.click(signButton());
    await waitFor(() => expect(assign).toHaveBeenCalled());
    expect(signTypedDataAsync).toHaveBeenCalled();
  });

  it("needs confirmation for a high-impact call", async () => {
    chain();
    render(
      <BrowserWalletRequestPanel
        hash={await fragmentFor("governance.freeze alone on the test registry")}
      />
    );
    expect(
      await screen.findByText(/changes who controls the registry/)
    ).toBeInTheDocument();
    await screen.findByText(/Checked: the Safe owns the registry/);
    expect(signButton()).toBeDisabled();
    await userEvent.click(
      screen.getByRole("checkbox", {
        name: "I checked this action and want to approve it",
      })
    );
    expect(signButton()).toBeEnabled();
  });

  it("blocks when the Safe does not own the registry", async () => {
    chain({ owner: "0x2222222222222222222222222222222222222222" });
    render(
      <BrowserWalletRequestPanel
        hash={await fragmentFor(
          "governance.registerRecordType alone on the test registry"
        )}
      />
    );
    await waitFor(() =>
      expect(
        screen
          .getAllByRole("alert")
          .some((element) =>
            /is not owned by this Safe/.test(element.textContent ?? "")
          )
      ).toBe(true)
    );
    expect(signButton()).toBeDisabled();
  });

  it("blocks acceptOwnership unless the Safe is the pending owner", async () => {
    chain({
      owner: "0x2222222222222222222222222222222222222222",
      pendingOwner: "0x3333333333333333333333333333333333333333",
    });
    render(
      <BrowserWalletRequestPanel
        hash={await fragmentFor(
          "governance.acceptOwnership alone on the test registry"
        )}
      />
    );
    expect(
      await screen.findByText(/is not the pending owner/)
    ).toBeInTheDocument();
    expect(signButton()).toBeDisabled();
  });

  it("blocks a wallet that is not a Safe signer, a used nonce and a failed read", async () => {
    chain({ getOwners: ["0x1111111111111111111111111111111111111111"] });
    const { unmount } = render(
      <BrowserWalletRequestPanel
        hash={await fragmentFor(
          "governance.registerRecordType alone on the test registry"
        )}
      />
    );
    expect(
      await screen.findByText(/not one of this Safe's signers/)
    ).toBeInTheDocument();
    unmount();

    chain({ nonce: 8n });
    const second = render(
      <BrowserWalletRequestPanel
        hash={await fragmentFor(
          "governance.registerRecordType alone on the test registry"
        )}
      />
    );
    expect(
      await screen.findByText(/already used this transaction number/)
    ).toBeInTheDocument();
    second.unmount();

    chain({ nonce: new Error("node down") });
    render(
      <BrowserWalletRequestPanel
        hash={await fragmentFor(
          "governance.registerRecordType alone on the test registry"
        )}
      />
    );
    expect(
      await screen.findByText(/could not be checked right now/)
    ).toBeInTheDocument();
    expect(signButton()).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Check again" })
    ).toBeInTheDocument();
  });

  it("announces a blocking result in the alert region after checking", async () => {
    let release: (value: unknown) => void = () => undefined;
    const pending = new Promise((resolve) => {
      release = resolve;
    });
    chain();
    const answers = readContract.getMockImplementation()!;
    readContract.mockImplementation(async (call: { functionName: string }) =>
      call.functionName === "owner" ? pending : answers(call)
    );
    render(
      <BrowserWalletRequestPanel
        hash={await fragmentFor(
          "governance.registerRecordType alone on the test registry"
        )}
      />
    );
    expect(
      await screen.findByText("Checking the Safe and the registry on chain…")
    ).toBeInTheDocument();
    release("0x2222222222222222222222222222222222222222");
    await waitFor(() =>
      expect(
        screen
          .getAllByRole("alert")
          .some((element) =>
            /Not offered for signing: .*is not owned by this Safe/.test(
              element.textContent ?? ""
            )
          )
      ).toBe(true)
    );
    expect(screen.getByText("Checks finished.")).toBeInTheDocument();
    expect(signButton()).toBeDisabled();
  });

  it("refuses a high-impact call inside a batch", async () => {
    render(
      <BrowserWalletRequestPanel
        hash={await fragmentFor("refuses a high-impact call inside a batch")}
      />
    );
    expect(
      await screen.findByText(
        /will not ask your wallet to sign this Safe transaction/
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sign in wallet" })
    ).not.toBeInTheDocument();
  });
});
