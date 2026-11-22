import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { Config } from "wagmi";
import ChainIdentityWallets from "@/components/chain-identity/ChainIdentityWallets";
import { chainGateway, type ChainIdentity } from "@/lib/chain-identity/gateway";
import { draftOperation } from "@/lib/chain-identity/operation";
import { chainRelay } from "@/lib/chain-identity/relay";
import {
  IDENTITY_WALLET,
  JOIN_EXPIRES_AT,
  JOIN_PRINCIPAL,
  joinDraft,
  JOINING_WALLET,
} from "../../lib/chain-identity/joinFixture";

const mockRequestAuth = jest.fn(async () => ({ success: true }));
jest.mock("@/components/auth/authContext", () => ({
  useAuth: () => ({ requestAuth: mockRequestAuth }),
}));
jest.mock("@/lib/chain-identity/gateway", () => ({
  ...jest.requireActual("@/lib/chain-identity/gateway"),
  chainGateway: { draft: jest.fn(), getWalletMembership: jest.fn() },
}));
jest.mock("@/lib/chain-identity/operation", () => ({
  ...jest.requireActual("@/lib/chain-identity/operation"),
  draftOperation: jest.fn(),
}));
jest.mock("@/lib/chain-identity/relay", () => ({
  chainRelay: { hold: jest.fn(async () => ({})), get: jest.fn() },
}));
jest.mock("@/lib/chain-identity/signers", () => ({
  walletSigner: () => ({ keyType: 1, sign: async () => "0x5151" }),
}));

const gateway = chainGateway as unknown as Record<string, jest.Mock>;
const DAY = 86_400_000;
const SECOND = "0x00000000000000000000000000000000000000dd";

const identity = (wallets: string[]): ChainIdentity =>
  ({
    principalId: JOIN_PRINCIPAL,
    handle: "tester_one",
    wallets,
    profile: null,
  }) as unknown as ChainIdentity;

function renderWallets(wallets: string[], rejoinWaitMs: number | null = DAY) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { readonly children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(
    <ChainIdentityWallets
      wallet={IDENTITY_WALLET}
      config={{} as Config}
      identity={identity(wallets)}
      rejoinWaitMs={rejoinWaitMs}
      onChanged={jest.fn()}
    />,
    { wrapper: Wrapper }
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  (draftOperation as jest.Mock).mockResolvedValue({
    txId: "0x01",
    fee: { maxFee: "1000000000000" },
  });
});

it("says before signing when a removed wallet can join again, from the chain's wait", async () => {
  jest.useFakeTimers({
    now: Date.UTC(2026, 10, 25, 12, 0),
    doNotFake: ["queueMicrotask"],
  });
  try {
    renderWallets([IDENTITY_WALLET, SECOND]);
    fireEvent.click(
      screen.getByRole("button", { name: "Remove 0x000000…0000dd" })
    );
    expect(
      await screen.findByText(
        "After this, 0x000000…0000dd can't join another identity or create one until Nov 26, 2026, 12:00 PM. It can rejoin yours at any time."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Fee: at most 0.000001 $fake6529, from your identity's balance."
      )
    ).toBeInTheDocument();
  } finally {
    jest.useRealTimers();
  }
});

it("warns when removing the wallet in use, and claims no wait the chain didn't give", async () => {
  renderWallets([IDENTITY_WALLET, SECOND], null);
  fireEvent.click(
    screen.getByRole("button", { name: "Remove 0x000000…0000aa" })
  );
  expect(
    await screen.findByText(
      "This is the wallet you are using now. After this, 0x000000…0000aa no longer signs for your identity."
    )
  ).toBeInTheDocument();
});

it("checks the new wallet on the chain before anything is signed", async () => {
  gateway["getWalletMembership"]!.mockResolvedValue({
    wallet: JOINING_WALLET,
    principalId: `0x${"0c".repeat(32)}`,
  });
  renderWallets([IDENTITY_WALLET]);
  fireEvent.change(screen.getByLabelText("Wallet address"), {
    target: { value: JOINING_WALLET },
  });
  expect(
    await screen.findByText(
      "That wallet belongs to another identity. Remove it there first."
    )
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Add wallet" })).toBeDisabled();
});

it("signs a join first and leaves it with 6529.io's relay for the new wallet", async () => {
  const draft = joinDraft();
  gateway["draft"]!.mockResolvedValue(draft);
  (draftOperation as jest.Mock).mockImplementation(
    jest.requireActual("@/lib/chain-identity/operation").draftOperation
  );
  (chainRelay.get as jest.Mock).mockResolvedValue({
    tx_id: draft.txId,
    status: "PENDING",
    last_error: null,
    signers: [
      { role: 0, key_type: 1, signer: IDENTITY_WALLET, signed: true },
      { role: 4, key_type: 1, signer: JOINING_WALLET, signed: false },
    ],
  });
  gateway["getWalletMembership"]!.mockResolvedValue({
    wallet: JOINING_WALLET,
    principalId: null,
    leftAt: null,
  });
  renderWallets([IDENTITY_WALLET]);
  fireEvent.change(screen.getByLabelText("Wallet address"), {
    target: { value: JOINING_WALLET },
  });
  expect(await screen.findByText("That wallet can join.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Add wallet" }));
  fireEvent.click(
    await screen.findByRole("button", { name: "Sign with wallet" })
  );

  await waitFor(() =>
    expect(chainRelay.hold).toHaveBeenCalledWith(draft, [
      { role: 0, key_type: 1, sig: "0x5151" },
    ])
  );
  expect(mockRequestAuth).toHaveBeenCalled();
  expect(
    await screen.findByText("Signed. Now the new wallet signs.")
  ).toBeInTheDocument();
  expect(
    await screen.findByText(/^Waiting for 0x000000…0000bb to sign, until/)
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      "The join for 0x000000…0000bb is still listed above. Withdraw it, or take it off the list once it has ended, to add another wallet."
    )
  ).toBeInTheDocument();
  expect(
    JSON.parse(localStorage.getItem("6529-chain-started-joins") ?? "[]")
  ).toEqual([
    {
      txId: draft.txId,
      principalId: JOIN_PRINCIPAL,
      identityWallet: IDENTITY_WALLET,
      joiningWallet: JOINING_WALLET,
      expiresAtMs: JOIN_EXPIRES_AT,
    },
  ]);
});

it("lets a wallet that left this identity rejoin at once, and holds one that left another", async () => {
  gateway["getWalletMembership"]!.mockResolvedValue({
    wallet: JOINING_WALLET,
    principalId: null,
    leftAt: { leftMs: Date.now() - 1_000, from: JOIN_PRINCIPAL },
  });
  const view = renderWallets([IDENTITY_WALLET]);
  fireEvent.change(screen.getByLabelText("Wallet address"), {
    target: { value: JOINING_WALLET },
  });
  expect(await screen.findByText("That wallet can join.")).toBeInTheDocument();
  view.unmount();

  gateway["getWalletMembership"]!.mockResolvedValue({
    wallet: JOINING_WALLET,
    principalId: null,
    leftAt: { leftMs: Date.now() - 1_000, from: `0x${"0c".repeat(32)}` },
  });
  renderWallets([IDENTITY_WALLET]);
  fireEvent.change(screen.getByLabelText("Wallet address"), {
    target: { value: JOINING_WALLET },
  });
  expect(
    await screen.findByText(
      /^That wallet left another identity on .+\. It can join yours after .+\.$/
    )
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Add wallet" })).toBeDisabled();
});

it("keeps the wallet being added fixed while the fee is shown", async () => {
  gateway["draft"]!.mockResolvedValue(joinDraft());
  (draftOperation as jest.Mock).mockImplementation(
    jest.requireActual("@/lib/chain-identity/operation").draftOperation
  );
  gateway["getWalletMembership"]!.mockResolvedValue({
    wallet: JOINING_WALLET,
    principalId: null,
    leftAt: null,
  });
  renderWallets([IDENTITY_WALLET]);
  const input = screen.getByLabelText("Wallet address");
  fireEvent.change(input, { target: { value: JOINING_WALLET } });
  await screen.findByText("That wallet can join.");
  fireEvent.click(screen.getByRole("button", { name: "Add wallet" }));
  expect(
    await screen.findByText(
      "You sign first, with this wallet. Then 0x000000…0000bb signs."
    )
  ).toBeInTheDocument();
  expect(input).toBeDisabled();
});
