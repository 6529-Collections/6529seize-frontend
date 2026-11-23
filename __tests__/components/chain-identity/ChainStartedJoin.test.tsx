import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import ChainStartedJoin from "@/components/chain-identity/ChainStartedJoin";
import { chainGateway, type ChainIdentity } from "@/lib/chain-identity/gateway";
import {
  snapshotStartedJoins,
  startedJoins,
  type StartedJoin,
} from "@/lib/chain-identity/pendingJoin";
import { chainRelay } from "@/lib/chain-identity/relay";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import {
  heldJoin,
  IDENTITY_WALLET,
  JOIN_EXPIRES_AT,
  JOIN_PRINCIPAL,
  JOINING_WALLET,
} from "../../lib/chain-identity/joinFixture";

const mockRequestAuth = jest.fn(async () => ({ success: true }));
jest.mock("@/components/auth/authContext", () => ({
  useAuth: () => ({ requestAuth: mockRequestAuth }),
}));
jest.mock("@/lib/chain-identity/gateway", () => ({
  ...jest.requireActual("@/lib/chain-identity/gateway"),
  chainGateway: { getTx: jest.fn() },
}));
jest.mock("@/lib/chain-identity/relay", () => ({
  ...jest.requireActual("@/lib/chain-identity/relay"),
  chainRelay: { get: jest.fn(), retry: jest.fn(), cancel: jest.fn() },
}));

const relay = chainRelay as unknown as Record<string, jest.Mock>;
const gateway = chainGateway as unknown as Record<string, jest.Mock>;
const op = heldJoin();
const join: StartedJoin = {
  txId: op.tx_id,
  principalId: JOIN_PRINCIPAL,
  identityWallet: IDENTITY_WALLET,
  joiningWallet: JOINING_WALLET,
  expiresAtMs: JOIN_EXPIRES_AT,
};
const identity = (wallets: string[]) =>
  ({ principalId: JOIN_PRINCIPAL, wallets }) as unknown as ChainIdentity;

function renderRow(onChanged = jest.fn(), wallets = [IDENTITY_WALLET]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { readonly children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <ul>{children}</ul>
    </QueryClientProvider>
  );
  const view = render(
    <ChainStartedJoin
      join={join}
      identity={identity(wallets)}
      onChanged={onChanged}
    />,
    { wrapper: Wrapper }
  );
  return { ...view, onChanged };
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  startedJoins.save(join);
});

it("follows a sent join on the chain and refreshes the identity once when it is final", async () => {
  relay["get"]!.mockResolvedValue({ ...op, status: "SUBMITTED" });
  gateway["getTx"]!.mockResolvedValue({ status: "final", height: 9 });
  const { onChanged, rerender } = renderRow();
  expect(
    await screen.findByText(
      "Both wallets signed. Waiting for the 6529 Network to add 0x000000…0000bb."
    )
  ).toBeInTheDocument();
  await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
  // A new render with a new callback doesn't refresh again.
  const again = jest.fn();
  rerender(
    <ChainStartedJoin
      join={join}
      identity={identity([IDENTITY_WALLET])}
      onChanged={again}
    />
  );
  expect(again).not.toHaveBeenCalled();
  // Once the wallet is in the identity the row goes, and so does the record.
  rerender(
    <ChainStartedJoin
      join={join}
      identity={identity([IDENTITY_WALLET, JOINING_WALLET])}
      onChanged={again}
    />
  );
  await waitFor(() => expect(snapshotStartedJoins()).toEqual([]));
  expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
});

it("says the fee was charged when the chain ran the join and it failed", async () => {
  relay["get"]!.mockResolvedValue({ ...op, status: "SUBMITTED" });
  gateway["getTx"]!.mockResolvedValue({
    status: "failed",
    result: { code: 0x2101, name: "ADDRESS_BOUND", detail: 1 },
  });
  renderRow();
  expect(
    await screen.findByText(
      "The join didn't go through, and its fee was still charged to your identity. That wallet already belongs to an identity. Take it off this list to start again."
    )
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Take off this list" }));
  expect(snapshotStartedJoins()).toEqual([]);
});

it("can always be taken off the list when the relay no longer has the join", async () => {
  relay["get"]!.mockRejectedValue(
    Object.assign(new Error("Not found"), { status: 404 })
  );
  renderRow();
  expect(
    await screen.findByText(
      "This join has ended: it expired, or a wallet withdrew it."
    )
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Take off this list" }));
  expect(snapshotStartedJoins()).toEqual([]);
});

it("asks to sign in when 6529.io's session is gone", async () => {
  relay["get"]!.mockRejectedValueOnce(
    Object.assign(new Error("Unauthorized"), { status: 401 })
  );
  relay["get"]!.mockResolvedValue(op);
  renderRow();
  fireEvent.click(await screen.findByRole("button", { name: "Sign in" }));
  await waitFor(() => expect(mockRequestAuth).toHaveBeenCalled());
  expect(
    await screen.findByText(/^Waiting for 0x000000…0000bb to sign, until/)
  ).toBeInTheDocument();
});

it("sends a fully signed join again after the network was unreachable, or withdraws it", async () => {
  relay["get"]!.mockResolvedValue({
    ...op,
    last_error: "The 6529 Network could not be reached: timeout",
    signers: op.signers.map((entry) => ({ ...entry, signed: true })),
  });
  relay["retry"]!.mockResolvedValue({ ...op, status: "SUBMITTED" });
  relay["cancel"]!.mockResolvedValue({ ...op, status: "CANCELLED" });
  renderRow();
  expect(
    await screen.findByText(
      "Both wallets signed, but 6529.io couldn't reach the 6529 Network."
    )
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Send again" }));
  await waitFor(() => expect(relay["retry"]).toHaveBeenCalledWith(op.tx_id));
  // The row is busy until the relay is read again.
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Withdraw" })).toBeEnabled()
  );
  fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));
  await waitFor(() => expect(relay["cancel"]).toHaveBeenCalledWith(op.tx_id));
  expect(snapshotStartedJoins()).toEqual([]);
});

it("ends a sent join the network no longer knows once it has expired", async () => {
  const expiredJoin = { ...join, expiresAtMs: Date.now() - 1_000 };
  gateway["getTx"]!.mockResolvedValue(null);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  // The relay's answer from before the expiry is still in the cache.
  client.setQueryData([QueryKey.CHAIN_IDENTITY, "relay", op.tx_id], {
    ...op,
    status: "SUBMITTED",
  });
  render(
    <QueryClientProvider client={client}>
      <ul>
        <ChainStartedJoin
          join={expiredJoin}
          identity={identity([IDENTITY_WALLET])}
          onChanged={jest.fn()}
        />
      </ul>
    </QueryClientProvider>
  );
  expect(
    await screen.findByText(
      "This join has ended: it expired, or a wallet withdrew it."
    )
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Take off this list" })
  ).toBeInTheDocument();
});

it("words a refusal the network didn't name as the general one", async () => {
  relay["get"]!.mockResolvedValue({ ...op, status: "SUBMITTED" });
  gateway["getTx"]!.mockResolvedValue({ status: "failed" });
  renderRow();
  expect(
    await screen.findByText(
      "The join didn't go through, and its fee was still charged to your identity. The 6529 Network didn't say why. Take it off this list to start again."
    )
  ).toBeInTheDocument();
});

it("keeps waiting while the network doesn't know a sent join that hasn't expired", async () => {
  relay["get"]!.mockResolvedValue({ ...op, status: "SUBMITTED" });
  gateway["getTx"]!.mockResolvedValueOnce({ status: "pending" });
  gateway["getTx"]!.mockResolvedValue(null);
  renderRow();
  expect(
    await screen.findByText(
      "Both wallets signed. Waiting for the 6529 Network to add 0x000000…0000bb."
    )
  ).toBeInTheDocument();
  await waitFor(() => expect(gateway["getTx"]).toHaveBeenCalledTimes(2), {
    timeout: 8000,
  });
  expect(
    screen.getByText(
      "Both wallets signed. Waiting for the 6529 Network to add 0x000000…0000bb."
    )
  ).toBeInTheDocument();
}, 15000);
