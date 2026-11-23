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
let mockActive = true;
jest.mock("@/hooks/useIdentityMovePhase", () => ({
  useChainIdentityActive: () => mockActive,
}));
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
    getWalletMembership: jest.fn(async () => ({ principalId: null })),
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
  sessionKeyStore: {
    read: async () => null,
    write: jest.fn(),
    remove: jest.fn(),
  },
}));

const gateway = chainGateway as unknown as Record<string, jest.Mock>;
const draft = {
  txId: "0x01",
  unsigned: "0x02",
  fee: { maxFee: "1000000000000" },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAddress = WALLET;
  mockActive = true;
  gateway["getOps"]!.mockResolvedValue({
    ruleVersion: 6,
    currencyAsset: ASSET,
  });
  gateway["getState"]!.mockResolvedValue({
    valueFields: { amount: "2000000000000000000" },
  });
  (draftOperation as jest.Mock).mockResolvedValue(draft);
  gateway["getHandle"]!.mockImplementation(async (handle: string) => ({
    handle,
    valid: true,
    available: true,
    status: "free",
    principalId: null,
  }));
});

it("says changes open at the switch-on, and reads nothing, before it", () => {
  mockActive = false;
  render(<ChainIdentityPage />);
  expect(
    screen.getByText(
      "Changes on the 6529 Network open here once identities have moved there."
    )
  ).toBeInTheDocument();
  expect(gateway["getIdentityByWallet"]).not.toHaveBeenCalled();
  expect(gateway["getOps"]).not.toHaveBeenCalled();
});

it("asks for a wallet first", () => {
  mockAddress = undefined;
  render(<ChainIdentityPage />);
  expect(
    screen.getByText(
      "Connect a wallet to see its identity on the 6529 Network."
    )
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Connect wallet" })
  ).toBeInTheDocument();
});

it("creates an identity after showing the fee, paid by the wallet", async () => {
  gateway["getIdentityByWallet"]!.mockResolvedValue(null);
  render(<ChainIdentityPage />);
  await screen.findByRole("heading", { name: "Create your identity" });
  expect(await screen.findByText("2 $fake6529")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Handle (optional)"), {
    target: { value: "Tester_Two" },
  });
  // The handle is checked on the chain before the button opens.
  expect(await screen.findByText("Available.")).toBeInTheDocument();
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
      body: { legacyId: null, handle: "tester_two", profileDocCid: "0x" },
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
  expect(
    screen.getByText(
      "That isn't a valid handle. Use 3 to 15 characters: a to z, 0 to 9 and _."
    )
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Create identity" })
  ).toBeDisabled();
});

it("shows an identity's sections and its handle", async () => {
  gateway["getIdentityByWallet"]!.mockResolvedValue({
    principalId: PRINCIPAL,
    handle: "tester_one",
    wallets: [WALLET],
    profile: null,
  });
  render(<ChainIdentityPage />);
  expect(await screen.findByText("tester_one")).toBeInTheDocument();
  for (const heading of [
    "REP and NIC",
    "Handle",
    "Profile",
    "Wallets",
    "Sign on this browser",
    "Delegations",
  ]) {
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  }
  expect(
    screen.queryByRole("button", { name: "Remove" })
  ).not.toBeInTheDocument();
});

it("shows the REP and NIC left to give: the TDH less what was given", async () => {
  gateway["getIdentityByWallet"]!.mockResolvedValue({
    principalId: PRINCIPAL,
    handle: "tester_one",
    wallets: [WALLET],
    profile: null,
    level: { level: 12, tdh: "5000", tdhDay: 25 },
  });
  gateway["getState"]!.mockImplementation(async (key: string) => {
    // RaterBudget[principal, matter]: 1,200 REP and no NIC given.
    if (key === `0x0703${PRINCIPAL.slice(2)}01`) {
      return { valueFields: { spent: "1200", count: 4 } };
    }
    if (key.startsWith("0x0703")) {
      return { value: null, valueFields: null };
    }
    return { valueFields: { amount: "2000000000000000000" } };
  });
  render(<ChainIdentityPage />);
  expect(
    await screen.findByText(
      "Your TDH, 5,000, is the most REP you can give across everyone, and the most NIC. To give REP or NIC, open the person's profile page."
    )
  ).toBeInTheDocument();
  expect(await screen.findByText("3,800 of 5,000")).toBeInTheDocument();
  expect(screen.getByText("5,000 of 5,000")).toBeInTheDocument();
});

it("says what to do first when the identity has no $fake6529", async () => {
  gateway["getIdentityByWallet"]!.mockResolvedValue({
    principalId: PRINCIPAL,
    handle: null,
    wallets: [WALLET],
    profile: null,
  });
  gateway["getState"]!.mockImplementation(async (key: string) =>
    key.startsWith("0x090101")
      ? { value: null, valueFields: null }
      : { valueFields: { amount: "2000000000000000000" } }
  );
  render(<ChainIdentityPage />);
  expect(
    await screen.findByText(
      "Your identity has no $fake6529 yet, so it can't pay for changes. Get $fake6529 for this wallet, then move it to your identity."
    )
  ).toBeInTheDocument();
});

it("won't create an identity with a handle the chain says is taken", async () => {
  gateway["getIdentityByWallet"]!.mockResolvedValue(null);
  gateway["getHandle"]!.mockResolvedValue({
    handle: "tester_one",
    valid: true,
    available: false,
    status: "claimed",
    principalId: `0x${"0c".repeat(32)}`,
  });
  render(<ChainIdentityPage />);
  fireEvent.change(await screen.findByLabelText("Handle (optional)"), {
    target: { value: "tester_one" },
  });
  expect(await screen.findByText("Taken.")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Create identity" })
  ).toBeDisabled();
});
