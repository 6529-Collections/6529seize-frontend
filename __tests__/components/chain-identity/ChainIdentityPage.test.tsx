import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ChainIdentityPage from "@/components/chain-identity/ChainIdentityPage";
import { chainGateway } from "@/lib/chain-identity/gateway";
import { draftOperation, submitAndAwait } from "@/lib/chain-identity/operation";

const WALLET = "0x00000000000000000000000000000000000000aa";
const ASSET = `0x${"0b".repeat(32)}`;
const PRINCIPAL = `0x${"0a".repeat(32)}`;
let mockAddress: string | undefined = WALLET;

jest.mock("wagmi", () => ({
  ...jest.requireActual("wagmi"),
  useAccount: () => ({ address: mockAddress }),
}));
jest.mock("@/contexts/TitleContext", () => ({ useSetTitle: jest.fn() }));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ seizeConnect: jest.fn() }),
}));
jest.mock("@/lib/chain-identity/gateway", () => ({
  ...jest.requireActual("@/lib/chain-identity/gateway"),
  chainGateway: {
    getIdentityByWallet: jest.fn(),
    getOps: jest.fn(),
    getState: jest.fn(),
    getHandle: jest.fn(),
    getDoc: jest.fn(),
  },
}));
jest.mock("@/lib/chain-identity/operation", () => ({
  ...jest.requireActual("@/lib/chain-identity/operation"),
  draftOperation: jest.fn(),
  submitAndAwait: jest.fn(async () => ({ status: "final" })),
}));
jest.mock("@/lib/chain-identity/signers", () => ({
  walletSigner: () => ({ keyType: 1, sign: async () => "0x5151" }),
  sessionSigner: jest.fn(),
}));
jest.mock("@/lib/chain-identity/sessionKey", () => ({
  ...jest.requireActual("@/lib/chain-identity/sessionKey"),
  canHoldSessionKey: async () => true,
  sessionKeyStore: { read: async () => null, write: jest.fn(), remove: jest.fn() },
}));

const gateway = chainGateway as unknown as Record<string, jest.Mock>;
const draft = { txId: "0x01", unsigned: "0x02", fee: { maxFee: "1000000000000" } };

beforeEach(() => {
  jest.clearAllMocks();
  mockAddress = WALLET;
  gateway["getOps"]!.mockResolvedValue({ ruleVersion: 6, currencyAsset: ASSET });
  gateway["getState"]!.mockResolvedValue({
    valueFields: { amount: "2000000000000000000" },
  });
  (draftOperation as jest.Mock).mockResolvedValue(draft);
});

it("asks for a wallet first", () => {
  mockAddress = undefined;
  render(<ChainIdentityPage />);
  expect(
    screen.getByText("Connect a wallet to see its identity on the 6529 Network.")
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Connect wallet" })).toBeInTheDocument();
});

it("creates an identity after showing the fee, paid by the wallet", async () => {
  gateway["getIdentityByWallet"]!.mockResolvedValue(null);
  render(<ChainIdentityPage />);
  await screen.findByRole("heading", { name: "Create your identity" });
  expect(await screen.findByText("2 $fake6529")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Handle (optional)"), {
    target: { value: "GM_6529" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create identity" }));

  expect(
    await screen.findByText(
      "Fee: at most 0.000001 $fake6529, from this wallet's balance."
    )
  ).toBeInTheDocument();
  expect(draftOperation).toHaveBeenCalledWith(
    expect.objectContaining({
      opType: "IDENTITY_CREATE",
      principal: null,
      signer: WALLET,
      body: { legacyId: null, handle: "gm_6529", profileDocCid: "0x" },
    }),
    "IdentityCreate"
  );
  expect(submitAndAwait).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Sign with wallet" }));
  await waitFor(() =>
    expect(submitAndAwait).toHaveBeenCalledWith(draft, [
      { role: 0, keyType: 1, sig: "0x5151" },
    ])
  );
  expect(await screen.findByText("Done.")).toBeInTheDocument();
});

it("refuses a handle the chain doesn't take before drafting anything", async () => {
  gateway["getIdentityByWallet"]!.mockResolvedValue(null);
  render(<ChainIdentityPage />);
  const input = await screen.findByLabelText("Handle (optional)");
  fireEvent.change(input, { target: { value: "no-dashes" } });
  expect(screen.getByText("Not a handle the 6529 Network takes.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Create identity" })).toBeDisabled();
});

it("shows an identity's sections and its handle", async () => {
  gateway["getIdentityByWallet"]!.mockResolvedValue({
    principalId: PRINCIPAL,
    handle: "punk",
    wallets: [WALLET],
    profile: null,
  });
  render(<ChainIdentityPage />);
  expect(await screen.findByText("punk")).toBeInTheDocument();
  for (const heading of [
    "Chain actions on this browser",
    "Handle",
    "Profile",
    "Wallets",
    "Delegations",
  ]) {
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  }
  expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
});
