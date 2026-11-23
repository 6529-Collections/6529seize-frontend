import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ChainDelegations from "@/components/chain-identity/ChainDelegations";
import { MEMES_COLLECTION } from "@/components/delegation/delegation-constants";
import { chainGateway } from "@/lib/chain-identity/gateway";
import { draftOperation } from "@/lib/chain-identity/operation";

const WALLET = "0x00000000000000000000000000000000000000aa";
const DELEGATE = "0x00000000000000000000000000000000000000bb";
const PRINCIPAL = `0x${"0a".repeat(32)}`;

jest.mock("wagmi", () => ({
  ...jest.requireActual("wagmi"),
  useAccount: () => ({ address: WALLET }),
}));
jest.mock("@/lib/chain-identity/gateway", () => ({
  ...jest.requireActual("@/lib/chain-identity/gateway"),
  chainGateway: {
    getIdentityByWallet: jest.fn(),
    getDelegationsOfWallet: jest.fn(),
  },
}));
jest.mock("@/lib/chain-identity/operation", () => ({
  ...jest.requireActual("@/lib/chain-identity/operation"),
  draftOperation: jest.fn(async () => ({ fee: { maxFee: "1" } })),
}));
jest.mock("@/lib/chain-identity/signers", () => ({
  walletSigner: () => ({ keyType: 1, sign: jest.fn() }),
}));

const gateway = chainGateway as unknown as Record<string, jest.Mock>;

beforeEach(() => {
  jest.clearAllMocks();
  gateway["getIdentityByWallet"]!.mockResolvedValue({ principalId: PRINCIPAL });
  gateway["getDelegationsOfWallet"]!.mockResolvedValue([
    {
      scope: "wallet",
      holder: `0x${"00".repeat(12)}${WALLET.slice(2)}`,
      records: [
        {
          scope: "wallet",
          holder: `0x${"00".repeat(12)}${WALLET.slice(2)}`,
          collection: MEMES_COLLECTION.contract.toLowerCase(),
          delegate: DELEGATE,
          useCase: 2,
          allTokens: 1,
          tokenId: `0x${"00".repeat(32)}`,
          expiry: "64060588800",
          expired: false,
          source: "imported",
        },
      ],
      more: false,
    },
    { scope: "identity", holder: PRINCIPAL, records: [], more: false },
  ]);
});

it("lists the wallet's delegations and revokes one from the wallet's account", async () => {
  render(<ChainDelegations />);
  fireEvent.click(
    await screen.findByRole("button", {
      name: "Revoke the Minting / Allowlist delegation to 0x000000…0000bb",
    })
  );
  await waitFor(() => expect(draftOperation).toHaveBeenCalled());
  expect((draftOperation as jest.Mock).mock.calls[0][0]).toMatchObject({
    opType: "DELEGATION_REVOKE",
    principal: null,
    signer: WALLET,
    body: {
      scope: 2,
      collection: MEMES_COLLECTION.contract.toLowerCase(),
      delegate: DELEGATE,
      useCase: 2,
      allTokens: 1,
    },
  });
  expect(
    await screen.findByText(
      "Fee: at most 0.000001 $fake6529, from this wallet's balance."
    )
  ).toBeInTheDocument();
});

it("registers a delegation for the whole identity by default, never expiring", async () => {
  render(<ChainDelegations />);
  await screen.findByText("For your identity (every wallet in it)");
  fireEvent.change(screen.getByLabelText("Delegate wallet"), {
    target: { value: DELEGATE },
  });
  fireEvent.click(screen.getByRole("button", { name: "Register delegation" }));
  await waitFor(() => expect(draftOperation).toHaveBeenCalled());
  expect((draftOperation as jest.Mock).mock.calls[0][0]).toMatchObject({
    opType: "DELEGATION_SET",
    principal: PRINCIPAL,
    body: {
      delegate: DELEGATE,
      useCase: 1,
      allTokens: 1,
      expiry: "0",
    },
  });
  expect(
    await screen.findByText(
      "Fee: at most 0.000001 $fake6529, from your identity's balance."
    )
  ).toBeInTheDocument();
});

it("says a failed read, never 'no delegations', and offers no form until it reads", async () => {
  gateway["getDelegationsOfWallet"]!.mockRejectedValue(
    Object.assign(new Error("no answer"), { status: 0 })
  );
  render(<ChainDelegations />);
  expect(
    await screen.findByRole("button", { name: "Try again" })
  ).toBeInTheDocument();
  expect(
    screen.queryByText("No delegations on the 6529 Network for this wallet.")
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Register delegation" })
  ).not.toBeInTheDocument();
});
