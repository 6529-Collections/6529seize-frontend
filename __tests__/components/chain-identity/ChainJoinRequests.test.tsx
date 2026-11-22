import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { Config } from "wagmi";
import ChainJoinRequests from "@/components/chain-identity/ChainJoinRequests";
import { chainGateway } from "@/lib/chain-identity/gateway";
import { awaitFinal } from "@/lib/chain-identity/operation";
import { chainRelay } from "@/lib/chain-identity/relay";
import { getAuthJwt, getWalletAddress } from "@/services/auth/auth.utils";
import {
  heldJoin,
  JOIN_PRINCIPAL,
  JOINING_WALLET,
} from "../../lib/chain-identity/joinFixture";

const mockRequestAuth = jest.fn(async () => ({ success: true }));
jest.mock("@/components/auth/authContext", () => ({
  useAuth: () => ({ requestAuth: mockRequestAuth }),
}));
jest.mock("@/services/auth/auth.utils", () => ({
  getAuthJwt: jest.fn(),
  getWalletAddress: jest.fn(),
}));
jest.mock("@/lib/chain-identity/gateway", () => ({
  ...jest.requireActual("@/lib/chain-identity/gateway"),
  chainGateway: { getIdentity: jest.fn(), getWalletMembership: jest.fn() },
}));
jest.mock("@/lib/chain-identity/operation", () => ({
  ...jest.requireActual("@/lib/chain-identity/operation"),
  awaitFinal: jest.fn(async () => ({ status: "final" })),
}));
jest.mock("@/lib/chain-identity/relay", () => ({
  chainRelay: { waiting: jest.fn(), sign: jest.fn(), cancel: jest.fn() },
}));
jest.mock("@/lib/chain-identity/signers", () => ({
  walletSigner: () => ({ keyType: 1, sign: async () => "0x5252" }),
}));

const gateway = chainGateway as unknown as Record<string, jest.Mock>;
const relay = chainRelay as unknown as Record<string, jest.Mock>;

function renderRequests() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { readonly children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(
    <ChainJoinRequests
      wallet={JOINING_WALLET}
      config={{} as Config}
      rejoinWaitMs={86_400_000}
      onChanged={jest.fn()}
    />,
    { wrapper: Wrapper }
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  (getWalletAddress as jest.Mock).mockReturnValue(JOINING_WALLET);
  (getAuthJwt as jest.Mock).mockReturnValue("jwt");
  gateway["getIdentity"]!.mockResolvedValue({
    principalId: JOIN_PRINCIPAL,
    handle: "tester_one",
  });
  gateway["getWalletMembership"]!.mockResolvedValue({
    wallet: JOINING_WALLET,
    principalId: null,
    leftAt: null,
  });
  relay["waiting"]!.mockResolvedValue([heldJoin()]);
});

it("asks the wallet to sign in before it can see requests", async () => {
  (getAuthJwt as jest.Mock).mockReturnValue(null);
  renderRequests();
  expect(
    screen.getByText(
      "Asked to add this wallet to an identity? Sign in to 6529.io with it to see the request."
    )
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  await waitFor(() => expect(mockRequestAuth).toHaveBeenCalled());
  expect(relay["waiting"]).not.toHaveBeenCalled();
});

it("signs a held join after showing who asks and the fee, then waits for the chain", async () => {
  const op = heldJoin();
  relay["sign"]!.mockResolvedValue({ ...op, status: "SUBMITTED" });
  renderRequests();
  expect(
    await screen.findByText(
      /^tester_one asks to add this wallet\. Signed by 0x000000…0000aa\. Open until/
    )
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Review and sign" }));
  expect(
    await screen.findByText(
      "Fee: at most 0.003 $fake6529, from that identity's balance."
    )
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Sign with wallet" }));
  await waitFor(() =>
    expect(relay["sign"]).toHaveBeenCalledWith(op.tx_id, {
      role: 4,
      key_type: 1,
      sig: "0x5252",
    })
  );
  expect(awaitFinal).toHaveBeenCalledWith(op.tx_id);
  expect(await screen.findByText("Done.")).toBeInTheDocument();
});

it("says why when the chain refuses the join through the relay", async () => {
  relay["sign"]!.mockResolvedValue({
    ...heldJoin(),
    status: "FAILED",
    last_error:
      "The 6529 Network refused the operation: 0x210E REJOIN_WAIT, detail 1",
  });
  renderRequests();
  fireEvent.click(
    await screen.findByRole("button", { name: "Review and sign" })
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Sign with wallet" })
  );
  expect(
    await screen.findByText(
      "Nothing changed. That wallet left an identity too recently to join one again yet."
    )
  ).toBeInTheDocument();
  expect(awaitFinal).not.toHaveBeenCalled();
});

it("only offers to decline when this wallet already belongs to an identity", async () => {
  gateway["getWalletMembership"]!.mockResolvedValue({
    wallet: JOINING_WALLET,
    principalId: `0x${"0c".repeat(32)}`,
  });
  relay["cancel"]!.mockResolvedValue({ ...heldJoin(), status: "CANCELLED" });
  renderRequests();
  expect(
    await screen.findByText(
      "This wallet already belongs to an identity, so it can't join this one."
    )
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Review and sign" })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Decline" }));
  await waitFor(() =>
    expect(relay["cancel"]).toHaveBeenCalledWith(heldJoin().tx_id)
  );
});

it("won't offer a held operation it can't check as this wallet's join", async () => {
  relay["waiting"]!.mockResolvedValue([
    { ...heldJoin(), tx_id: `0x${"99".repeat(32)}` },
  ]);
  renderRequests();
  expect(
    await screen.findByText(
      "This request isn't a wallet join this page can check, so it can't be signed here."
    )
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Review and sign" })
  ).not.toBeInTheDocument();
});
