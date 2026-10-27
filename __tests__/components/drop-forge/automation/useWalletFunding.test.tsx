import { act, renderHook, waitFor } from "@testing-library/react";
import { getWalletClient } from "@wagmi/core";
import {
  getForgeSettings,
  recordForgeFunding,
} from "@/services/api/drop-forge-settings";
import { useWalletFunding } from "@/components/drop-forge/automation/useWalletFunding";
import type { ApiDropForgeSettings } from "@/generated/models/ApiDropForgeSettings";
const sender = "0x" + "11".repeat(20);
const recipient = "0x" + "22".repeat(20);
const hash = "0x" + "ab".repeat(32);
const mockSend = jest.fn();
const mockAuth = jest.fn();
const mockBalance = jest.fn();
const mockWait = jest.fn();
let mockAddress = sender;
jest.mock("@wagmi/core", () => ({ getWalletClient: jest.fn() }));
jest.mock("wagmi", () => ({
  useConfig: () => ({}),
  usePublicClient: () => ({
    estimateGas: async () => 21000n,
    estimateFeesPerGas: async () => ({ maxFeePerGas: 2n }),
    getBalance: mockBalance,
    waitForTransactionReceipt: mockWait,
  }),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ requestAuth: mockAuth }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: mockAddress }),
}));
jest.mock("@/services/api/drop-forge-settings", () => ({
  getForgeSettings: jest.fn(),
  recordForgeFunding: jest.fn(),
}));
const settings: ApiDropForgeSettings = {
  revision: 0,
  automation_enabled: false,
  pay_artist_enabled: false,
  updated_by: null,
  updated_at: 0,
  can_edit: false,
  can_top_up: true,
  chain_id: 1,
  contract: recipient,
  signer_address: recipient,
  ens_name: null,
  balance_wei: "0",
  execution_available: true,
  artist_payment_available: false,
};
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockAddress = sender;
  mockAuth.mockResolvedValue({ success: true });
  mockSend.mockResolvedValue(hash);
  mockBalance.mockResolvedValue(1000000000000000000n);
  mockWait.mockResolvedValue({ status: "success", transactionHash: hash });
  jest.mocked(getWalletClient).mockResolvedValue({
    account: { address: sender },
    sendTransaction: mockSend,
  } as unknown as Awaited<ReturnType<typeof getWalletClient>>);
  jest.mocked(getForgeSettings).mockResolvedValue(settings);
  jest.mocked(recordForgeFunding).mockResolvedValue({ accepted: true });
});
it("funds the configured wallet while automation is Off and records its hash", async () => {
  const confirmed = jest.fn();
  const view = renderHook(() => useWalletFunding(settings, "0.1", confirmed));
  await act(() => view.result.current.prepare());
  expect(view.result.current.review).not.toBeNull();
  await act(() => view.result.current.submit());
  expect(mockSend).toHaveBeenCalledTimes(1);
  expect(mockSend).toHaveBeenCalledWith(
    expect.objectContaining({ to: recipient, value: 100000000000000000n })
  );
  await waitFor(() => expect(recordForgeFunding).toHaveBeenCalledWith(hash));
  expect(confirmed).toHaveBeenCalledTimes(1);
});
it("refuses insufficient balance and never prompts a transfer", async () => {
  mockBalance.mockResolvedValue(1n);
  const view = renderHook(() => useWalletFunding(settings, "0.1", jest.fn()));
  await act(() => view.result.current.prepare());
  expect(view.result.current.error).toContain("enough ETH");
  expect(mockSend).not.toHaveBeenCalled();
});
it("rechecks the destination after review before sending funds", async () => {
  const view = renderHook(() => useWalletFunding(settings, "0.1", jest.fn()));
  await act(() => view.result.current.prepare());
  jest
    .mocked(getForgeSettings)
    .mockResolvedValue({ ...settings, signer_address: sender });
  await act(() => view.result.current.submit());
  expect(mockSend).not.toHaveBeenCalled();
  expect(view.result.current.error).toContain("changed");
});
it("retains an unacknowledged hash for reporting without sending twice", async () => {
  jest.mocked(recordForgeFunding).mockRejectedValue(new Error("offline"));
  const view = renderHook(() => useWalletFunding(settings, "0.1", jest.fn()));
  await act(() => view.result.current.prepare());
  await act(() => view.result.current.submit());
  await waitFor(() => expect(view.result.current.pending).toBe(true));
  expect(Object.values(localStorage)).toContain(hash);
  expect(mockSend).toHaveBeenCalledTimes(1);
});

it("does not label a redirected replacement as a successful top-up", async () => {
  const replacement = "0x" + "cd".repeat(32);
  mockWait.mockImplementation(async ({ onReplaced }) => {
    onReplaced({
      reason: "replaced",
      transaction: {
        hash: replacement,
        to: sender,
        value: 100000000000000000n,
        input: "0x",
      },
    });
    return { status: "success", transactionHash: replacement };
  });
  const view = renderHook(() => useWalletFunding(settings, "0.1", jest.fn()));
  await act(() => view.result.current.prepare());
  await act(() => view.result.current.submit());
  expect(view.result.current.transaction).toMatchObject({
    status: "error",
    hash: replacement,
  });
  expect(view.result.current.transaction?.message).toContain("replaced");
  await waitFor(() =>
    expect(recordForgeFunding).toHaveBeenCalledWith(replacement)
  );
  expect(mockSend).toHaveBeenCalledTimes(1);
});
