/**
 * @jest-environment-options {"url": "http://localhost:6529/browser-connector"}
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import BrowserWalletRequestPanel from "@/components/desktop/BrowserWalletRequestPanel";
import {
  buildWalletRequestFragment,
  walletRequestCode,
  type WalletRequestEnvelope,
} from "@/lib/desktop/walletForwarding";

// Public development keys (Hardhat/Anvil accounts 0 and 1); never funded.
const shell = privateKeyToAccount(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
);
const stranger = privateKeyToAccount(
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
);

const ADDRESS = "0x1111111111111111111111111111111111111111";
const OTHER = "0x2222222222222222222222222222222222222222";
const ID = "Q".repeat(43);
const SIGNATURE = `0x${"ab".repeat(65)}`;

let account: { isConnected: boolean; address?: string; chainId?: number } = {
  isConnected: true,
  address: ADDRESS,
  chainId: 1,
};
let signerResponse: { ok: boolean; body: unknown } = {
  ok: true,
  body: { signer: shell.address },
};
const seizeConnect = jest.fn();
const signMessageAsync = jest.fn();
const signTypedDataAsync = jest.fn();
const switchChainAsync = jest.fn();
const assign = jest.fn();

jest.mock("wagmi", () => ({
  useAccount: () => account,
  useConfig: () => ({ chains: mockChains }),
  useSignMessage: () => ({ signMessageAsync }),
  useSignTypedData: () => ({ signTypedDataAsync }),
  useSwitchChain: () => ({ switchChainAsync }),
}));
const mockChains = [{ id: 1 }];
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ seizeConnect }),
}));
jest.mock("@/helpers/desktop-navigation", () => ({
  loadDesktopUrlInPlace: (url: string) => assign(url),
}));

const envelope = (
  overrides: Partial<WalletRequestEnvelope> = {}
): WalletRequestEnvelope => ({
  v: 1,
  id: ID,
  scheme: "localcore6529",
  origin: globalThis.location.origin,
  issuedAt: Date.now(),
  expiresAt: Date.now() + 60_000,
  request: {
    method: "personal_sign",
    params: [toHex("Vote for entry 7"), ADDRESS],
    address: ADDRESS,
    chainId: 1,
  },
  ...overrides,
});

async function fragmentFor(
  value: WalletRequestEnvelope | Record<string, unknown>,
  signer = shell
): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  return buildWalletRequestFragment(
    bytes,
    await signer.signMessage({ message: { raw: bytes } })
  );
}

const returnedData = () => {
  const link = assign.mock.calls.at(-1)?.[0] as string;
  expect(link.startsWith("localcore6529://wallet?data=")).toBe(true);
  return JSON.parse(
    decodeURIComponent(link.slice("localcore6529://wallet?data=".length))
  );
};

describe("BrowserWalletRequestPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    account = { isConnected: true, address: ADDRESS, chainId: 1 };
    signerResponse = { ok: true, body: { signer: shell.address } };
    globalThis.fetch = jest.fn(async () => ({
      ok: signerResponse.ok,
      json: async () => signerResponse.body,
    })) as unknown as typeof fetch;
    signMessageAsync.mockResolvedValue(SIGNATURE);
    signTypedDataAsync.mockResolvedValue(SIGNATURE);
    switchChainAsync.mockResolvedValue(undefined);
  });

  it("shows the message, the request code and signs the exact bytes", async () => {
    render(<BrowserWalletRequestPanel hash={await fragmentFor(envelope())} />);

    expect(await screen.findByText("Vote for entry 7")).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(walletRequestCode(ID)))
    ).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/browser-connector/signer",
      expect.objectContaining({ cache: "no-store" })
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Sign in wallet" })
    );

    await waitFor(() => expect(assign).toHaveBeenCalled());
    expect(signMessageAsync).toHaveBeenCalledWith({
      account: ADDRESS,
      message: { raw: toHex("Vote for entry 7") },
    });
    expect(returnedData()).toEqual({
      v: 1,
      id: ID,
      ok: true,
      value: SIGNATURE,
    });
    expect(
      screen.getByRole("link", { name: "Open 6529 Desktop" })
    ).toHaveAttribute("href", assign.mock.calls[0][0]);
  });

  it.each([
    ["another key signed it", async () => fragmentFor(envelope(), stranger)],
    [
      "the signer is unknown",
      async () => {
        signerResponse = { ok: false, body: {} };
        return fragmentFor(envelope());
      },
    ],
    [
      "the method is not forwarded",
      async () =>
        fragmentFor(
          envelope({
            request: {
              method: "eth_sendTransaction",
              params: [{ from: ADDRESS, to: OTHER, value: "0x1" }],
              address: ADDRESS,
              chainId: 1,
            },
          })
        ),
    ],
    [
      "the signer named in the request is not the address shown",
      async () =>
        fragmentFor(
          envelope({
            request: {
              method: "personal_sign",
              params: [toHex("hi"), OTHER],
              address: ADDRESS,
              chainId: 1,
            },
          })
        ),
    ],
    [
      "it is for another origin",
      async () => fragmentFor(envelope({ origin: "http://localhost:1" })),
    ],
    ["it is not a request at all", async () => "#w=abc&s=0x12"],
  ])("offers nothing to sign when %s", async (_label, makeHash) => {
    render(<BrowserWalletRequestPanel hash={await makeHash()} />);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "did not get a valid request"
      )
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(signMessageAsync).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
  });

  it("says an expired request has expired and offers nothing", async () => {
    const hash = await fragmentFor(
      envelope({ issuedAt: Date.now() - 90_000, expiresAt: Date.now() - 1 })
    );
    render(<BrowserWalletRequestPanel hash={hash} />);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("has expired")
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("refuses a request it cannot describe and can tell the app", async () => {
    const hash = await fragmentFor(
      envelope({
        request: {
          method: "personal_sign",
          params: [toHex("6529 Authentication\nVersion: 2"), ADDRESS],
          address: ADDRESS,
          chainId: 1,
        },
      })
    );
    render(<BrowserWalletRequestPanel hash={hash} />);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "It is a sign-in message."
      )
    );
    expect(
      screen.queryByRole("button", { name: "Sign in wallet" })
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Tell 6529 Desktop and close" })
    );
    expect(returnedData()).toEqual({
      v: 1,
      id: ID,
      ok: false,
      code: "refused",
    });
    expect(signMessageAsync).not.toHaveBeenCalled();
  });

  it("asks for the right account before signing", async () => {
    account = { isConnected: true, address: OTHER, chainId: 1 };
    render(<BrowserWalletRequestPanel hash={await fragmentFor(envelope())} />);

    expect(
      await screen.findByText(
        /Switch it to 0x1111111111111111111111111111111111111111/
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sign in wallet" })
    ).not.toBeInTheDocument();
  });

  it("offers to connect a wallet when none is connected", async () => {
    account = { isConnected: false };
    render(<BrowserWalletRequestPanel hash={await fragmentFor(envelope())} />);

    await userEvent.click(
      await screen.findByRole("button", { name: "Connect wallet" })
    );
    expect(seizeConnect).toHaveBeenCalled();
  });

  it("returns a decline, and a wallet rejection, as rejected", async () => {
    const { unmount } = render(
      <BrowserWalletRequestPanel hash={await fragmentFor(envelope())} />
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Decline" })
    );
    expect(returnedData()).toEqual({
      v: 1,
      id: ID,
      ok: false,
      code: "rejected",
    });
    unmount();

    signMessageAsync.mockRejectedValue(
      Object.assign(new Error("User rejected"), { code: 4001 })
    );
    render(<BrowserWalletRequestPanel hash={await fragmentFor(envelope())} />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Sign in wallet" })
    );
    await waitFor(() => expect(assign).toHaveBeenCalledTimes(2));
    expect(returnedData()).toEqual({
      v: 1,
      id: ID,
      ok: false,
      code: "rejected",
    });
  });

  it("lets the user retry after a wallet failure", async () => {
    signMessageAsync.mockRejectedValueOnce(new Error("Wallet crashed"));
    render(<BrowserWalletRequestPanel hash={await fragmentFor(envelope())} />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Sign in wallet" })
    );

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("did not sign")
    );
    expect(assign).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole("button", { name: "Sign in wallet" })
    );
    await waitFor(() => expect(assign).toHaveBeenCalled());
  });

  it("signs known typed data on the request's network only", async () => {
    const typedData = {
      domain: { name: "6529 Profile CMS", version: "1", chainId: 1 },
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
        ],
        ProfileCmsPublish: [
          { name: "action", type: "string" },
          { name: "profileId", type: "string" },
          { name: "handle", type: "string" },
          { name: "packageId", type: "string" },
          { name: "version", type: "uint256" },
          { name: "draftId", type: "string" },
          { name: "payloadHash", type: "string" },
          { name: "packageHash", type: "string" },
          { name: "primaryPath", type: "string" },
          { name: "storageProvider", type: "string" },
          { name: "storageUri", type: "string" },
          { name: "storageContentHash", type: "string" },
          { name: "deadline", type: "uint256" },
        ],
      },
      primaryType: "ProfileCmsPublish",
      message: {
        action: "publish",
        profileId: "p",
        handle: "punk6529",
        packageId: "k",
        version: "4",
        draftId: "d",
        payloadHash: "h",
        packageHash: "h",
        primaryPath: "/",
        storageProvider: "arweave",
        storageUri: "ar://x",
        storageContentHash: "c",
        deadline: "1900000000",
      },
    };
    account = { isConnected: true, address: ADDRESS, chainId: 11155111 };
    const hash = await fragmentFor(
      envelope({
        request: {
          method: "eth_signTypedData_v4",
          params: [ADDRESS, JSON.stringify(typedData)],
          address: ADDRESS,
          chainId: 1,
        },
      })
    );
    const { rerender } = render(<BrowserWalletRequestPanel hash={hash} />);

    expect(
      await screen.findByText(
        "Publish version 4 of the profile site for punk6529."
      )
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Switch network" })
    );
    expect(switchChainAsync).toHaveBeenCalledWith({ chainId: 1 });
    expect(
      screen.queryByRole("button", { name: "Sign in wallet" })
    ).not.toBeInTheDocument();

    account = { isConnected: true, address: ADDRESS, chainId: 1 };
    rerender(<BrowserWalletRequestPanel hash={hash} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Sign in wallet" })
    );
    await waitFor(() => expect(assign).toHaveBeenCalled());
    const { EIP712Domain: _domainType, ...types } = typedData.types;
    expect(signTypedDataAsync).toHaveBeenCalledWith({
      account: ADDRESS,
      domain: typedData.domain,
      types,
      primaryType: "ProfileCmsPublish",
      message: typedData.message,
    });
  });
});
