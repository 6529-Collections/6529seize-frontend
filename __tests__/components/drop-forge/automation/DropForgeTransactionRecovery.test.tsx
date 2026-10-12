import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import DropForgeTransactionRecovery from "@/components/drop-forge/launch/DropForgeTransactionRecovery";
import { requestForgeRecovery } from "@/services/api/drop-forge-api";
import type { ApiDropForgeLaunch } from "@/generated/models/ApiDropForgeLaunch";
import type { ApiDropForgeAction } from "@/generated/models/ApiDropForgeAction";
jest.mock("@/services/api/drop-forge-api", () => ({
  requestForgeRecovery: jest.fn(),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ requestAuth: async () => ({ success: true }) }),
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
const original = "0x" + "a".repeat(64);
function fixture() {
  const action = {
    id: "phase0-batch1",
    kind: "AIRDROP",
    state: "SIGNED",
    phase: 0,
    due: 1,
    deadline: Math.floor(Date.now() / 1000) + 1000,
    hash: original,
    recipients: 1,
    recovery: {
      nonce: 12,
      cancel_requested: false,
      attempts: [
        {
          id: "original",
          operation: "ORIGINAL",
          hash: original,
          requested_by: "scheduler",
          requested_at: 0,
        },
      ],
      allocations: [{ address: "recipient", amount: 7 }],
    },
  } as ApiDropForgeAction;
  const launch = {
    id: "launch",
    revision: 9,
    claim_id: 123,
    contract: "creator",
    signer: "operational-wallet",
    chain_id: 1,
    phases: [{ end: 1 }],
    actions: [action],
  } as ApiDropForgeLaunch;
  return { launch, action, onChange: jest.fn().mockResolvedValue(undefined) };
}
beforeEach(() => jest.clearAllMocks());
it("shows the exact nonce, wallet, original hash and amounts before requiring an explicit cancellation request", async () => {
  const f = fixture();
  render(<DropForgeTransactionRecovery {...f} />);
  expect(screen.getByText(/operational-wallet.*Nonce: 12/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: original })).toHaveAttribute(
    "href",
    `https://etherscan.io/tx/${original}`
  );
  fireEvent.click(screen.getByText("Inspect action allocations"));
  expect(screen.getByText("recipient: 7")).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Cancel pending transaction" })
  );
  expect(requestForgeRecovery).not.toHaveBeenCalled();
  expect(screen.getByText(/original may still win/)).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Confirm recovery request" })
  );
  await waitFor(() =>
    expect(requestForgeRecovery).toHaveBeenCalledWith(
      "creator",
      123,
      expect.objectContaining({
        revision: 9,
        action_id: "phase0-batch1",
        expected_hash: original,
        operation: "CANCEL",
        request_id: expect.any(String),
      })
    )
  );
});
it("reuses the exact request ID after an uncertain API result", async () => {
  const f = fixture();
  jest
    .mocked(requestForgeRecovery)
    .mockRejectedValueOnce(new Error("network timeout"))
    .mockResolvedValueOnce(f.launch);
  render(<DropForgeTransactionRecovery {...f} />);
  fireEvent.click(screen.getByRole("button", { name: "Speed up transaction" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Confirm recovery request" })
  );
  await screen.findByRole("alert");
  const first = jest.mocked(requestForgeRecovery).mock.calls[0][2];
  fireEvent.click(
    screen.getByRole("button", { name: "Confirm recovery request" })
  );
  await waitFor(() => expect(requestForgeRecovery).toHaveBeenCalledTimes(2));
  expect(jest.mocked(requestForgeRecovery).mock.calls[1][2]).toEqual(first);
});
it("offers no replay when the original action won, including a late winner after cancellation", () => {
  const f = fixture();
  f.action.state = "CONFIRMED" as ApiDropForgeAction["state"];
  f.action.recovery!.outcome = "EXECUTED" as NonNullable<
    ApiDropForgeAction["recovery"]
  >["outcome"];
  render(<DropForgeTransactionRecovery {...f} />);
  expect(
    screen.getByText(/allocations will not be replayed/)
  ).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
it("shows cancelled allocations as outstanding and offers explicit late delivery", () => {
  const f = fixture();
  f.action.state = "CANCELLED" as ApiDropForgeAction["state"];
  f.action.deadline = 1;
  f.action.recovery!.outcome = "CANCELLED" as NonNullable<
    ApiDropForgeAction["recovery"]
  >["outcome"];
  render(<DropForgeTransactionRecovery {...f} />);
  expect(
    screen.getByText(/allocations remain outstanding/)
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", {
      name: "Deliver outstanding allocations after minting",
    })
  ).toBeEnabled();
  expect(
    screen.queryByRole("button", { name: "Retry outstanding action" })
  ).not.toBeInTheDocument();
});
it("does not offer speed-up after the window closes or once cancellation is requested", () => {
  const f = fixture();
  f.action.recovery!.cancel_requested = true;
  render(<DropForgeTransactionRecovery {...f} />);
  expect(
    screen.queryByRole("button", { name: "Speed up transaction" })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Cancel pending transaction" })
  ).toBeEnabled();
});
