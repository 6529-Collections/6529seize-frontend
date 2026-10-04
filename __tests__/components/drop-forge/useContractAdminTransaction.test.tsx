import { act, renderHook, waitFor } from "@testing-library/react";
import { mainnet } from "viem/chains";
import { useContractAdminTransaction } from "@/components/drop-forge/contract-admins/useContractAdminTransaction";

const owner = "0x0000000000000000000000000000000000000001";
const admin = "0x0000000000000000000000000000000000000002";
const hash = `0x${"1".repeat(64)}`;
const mockWrite = jest.fn();
const mockReceipt = jest.fn();
const mockWallet = jest.fn();
const mockInvalidate = jest.fn();
jest.mock("@wagmi/core", () => ({
  getWalletClient: (...args: unknown[]) => mockWallet(...args),
}));
jest.mock("wagmi", () => ({
  useConfig: () => ({}),
  usePublicClient: () => ({ waitForTransactionReceipt: mockReceipt }),
  useWriteContract: () => ({ writeContractAsync: mockWrite }),
}));
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidate }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: owner }),
}));
jest.mock("@/components/auth/useConnectedAction", () => ({
  useConnectedAction: () => (action: () => void) => action(),
}));
const operation = { functionName: "approveAdmin" as const, address: admin };
const options = {
  contract: owner,
  chain: mainnet,
  canManage: true,
  contextFingerprint: "initial",
};
beforeEach(() => {
  jest.clearAllMocks();
  mockWallet.mockResolvedValue({ account: { address: owner } });
  mockWrite.mockResolvedValue(hash);
  mockReceipt.mockResolvedValue({ status: "success", transactionHash: hash });
  mockInvalidate.mockResolvedValue(undefined);
});
it.each(["approveAdmin", "revokeAdmin"] as const)(
  "writes %s on the configured creator then refreshes after mining",
  async (functionName) => {
    const { result } = renderHook(() => useContractAdminTransaction(options));
    act(() => result.current.submit({ ...operation, functionName }));
    await waitFor(() =>
      expect(result.current.transaction?.status).toBe("success")
    );
    expect(mockWrite).toHaveBeenCalledWith(
      expect.objectContaining({
        address: owner,
        chainId: 1,
        functionName,
        args: [admin],
        account: { address: owner },
      })
    );
    expect(mockWallet).toHaveBeenCalledWith(expect.anything(), {
      chainId: 1,
      account: owner,
    });
    expect(mockReceipt).toHaveBeenCalledWith(expect.objectContaining({ hash }));
    expect(mockInvalidate).toHaveBeenCalledTimes(1);
  }
);
it("prevents duplicate submissions", async () => {
  const { result } = renderHook(() => useContractAdminTransaction(options));
  act(() => {
    result.current.submit(operation);
    result.current.submit(operation);
  });
  await waitFor(() => expect(result.current.busy).toBe(false));
  expect(mockWrite).toHaveBeenCalledTimes(1);
});
it("does not write without management permission", () => {
  const { result } = renderHook(() =>
    useContractAdminTransaction({ ...options, canManage: false })
  );
  act(() => result.current.submit(operation));
  expect(mockWallet).not.toHaveBeenCalled();
  expect(mockWrite).not.toHaveBeenCalled();
});
it("rejects a signer different from the active wallet", async () => {
  mockWallet.mockResolvedValue({ account: { address: admin } });
  const { result } = renderHook(() => useContractAdminTransaction(options));
  act(() => result.current.submit(operation));
  await waitFor(() => expect(result.current.transaction?.status).toBe("error"));
  expect(mockWrite).not.toHaveBeenCalled();
});
it("cancels before signing if transaction context changes while finding a signer", async () => {
  let resolveWallet!: (value: unknown) => void;
  mockWallet.mockReturnValue(
    new Promise((resolve) => {
      resolveWallet = resolve;
    })
  );
  const { result, rerender } = renderHook(
    (props) => useContractAdminTransaction(props),
    { initialProps: options }
  );
  act(() => result.current.submit(operation));
  rerender({ ...options, contextFingerprint: "different-network-or-wallet" });
  await act(async () => resolveWallet({ account: { address: owner } }));
  expect(result.current.transaction?.status).toBe("error");
  expect(mockWrite).not.toHaveBeenCalled();
});
it.each(["reverted", "rejected"])(
  "reports %s transactions without refreshing permissions",
  async (failure) => {
    if (failure === "reverted")
      mockReceipt.mockResolvedValue({
        status: "reverted",
        transactionHash: hash,
      });
    else mockWrite.mockRejectedValue(new Error("User rejected request"));
    const { result } = renderHook(() => useContractAdminTransaction(options));
    act(() => result.current.submit(operation));
    await waitFor(() =>
      expect(result.current.transaction?.status).toBe("error")
    );
    expect(mockInvalidate).not.toHaveBeenCalled();
  }
);
it("does not report a cancellation replacement as a successful admin change", async () => {
  mockReceipt.mockImplementation(async ({ onReplaced }) => {
    onReplaced({
      reason: "cancelled",
      transactionReceipt: { transactionHash: hash },
    });
    return { status: "success", transactionHash: hash };
  });
  const { result } = renderHook(() => useContractAdminTransaction(options));
  act(() => result.current.submit(operation));
  await waitFor(() => expect(result.current.transaction?.status).toBe("error"));
});
