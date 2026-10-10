import { useConsolidationStepWrite } from "@/components/delegation/consolidation-builder/useConsolidationStepWrite";
import { act, renderHook } from "@testing-library/react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";

jest.mock("wagmi", () => ({
  useWriteContract: jest.fn(),
  useWaitForTransactionReceipt: jest.fn(),
}));

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

const A = `0x${"a".repeat(40)}`;
const D = `0x${"d".repeat(40)}`;
const HASH = `0x${"1".repeat(64)}`;

const mockWriteContract = jest.fn();
const writeState: {
  data?: string | undefined;
  error: Error | null;
  isPending: boolean;
} = {
  error: null,
  isPending: false,
};
const receiptState = {
  isLoading: false,
  isSuccess: false,
  isError: false,
  error: null as Error | null,
};

function renderWriteHook() {
  const onConfirmed = jest.fn();
  const hook = renderHook(() => useConsolidationStepWrite({ onConfirmed }));
  return { ...hook, onConfirmed };
}

function submitStep(
  result: { current: ReturnType<typeof useConsolidationStepWrite> },
  index = 0
) {
  act(() => {
    result.current.submit({ index, signer: A, pendingTargets: [D] });
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  writeState.data = undefined;
  writeState.error = null;
  writeState.isPending = false;
  Object.assign(receiptState, {
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
  });
  jest.mocked(useWriteContract).mockImplementation(
    () =>
      ({
        writeContract: mockWriteContract,
        ...writeState,
      }) as unknown as ReturnType<typeof useWriteContract>
  );
  jest
    .mocked(useWaitForTransactionReceipt)
    .mockImplementation(
      () =>
        ({ ...receiptState }) as unknown as ReturnType<
          typeof useWaitForTransactionReceipt
        >
    );
});

describe("useConsolidationStepWrite", () => {
  it("sends the step's pending targets as one transaction and asks for the wallet", () => {
    const { result, rerender } = renderWriteHook();
    expect(result.current.toast).toBeUndefined();

    submitStep(result);
    writeState.isPending = true;
    rerender();

    expect(mockWriteContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "registerDelegationAddress",
        args: expect.arrayContaining([D]),
      }),
      expect.objectContaining({ onError: expect.any(Function) })
    );
    expect(result.current.toast).toEqual({
      status: "confirm_wallet",
      title: "Consolidation Step 1",
    });
    expect(result.current.showToast).toBe(true);
    expect(result.current.isBusy).toBe(true);
    expect(result.current.busySigner).toBe(A);
  });

  it("reports submission and confirmation, and refreshes once confirmed", () => {
    const { result, rerender, onConfirmed } = renderWriteHook();
    submitStep(result, 1);

    writeState.data = HASH;
    receiptState.isLoading = true;
    rerender();
    expect(result.current.toast).toEqual({
      status: "submitted",
      title: "Consolidation Step 2",
      transactionHash: HASH,
    });

    receiptState.isLoading = false;
    receiptState.isSuccess = true;
    rerender();
    expect(result.current.toast).toEqual({
      status: "success",
      title: "Consolidation Step 2",
      transactionHash: HASH,
    });
    expect(onConfirmed).toHaveBeenCalledTimes(1);

    rerender();
    expect(onConfirmed).toHaveBeenCalledTimes(1);
  });

  it("hides a dismissed toast until the state changes", () => {
    const { result, rerender } = renderWriteHook();
    submitStep(result);
    writeState.data = HASH;
    receiptState.isLoading = true;
    rerender();

    act(() => {
      result.current.dismissToast();
    });
    expect(result.current.showToast).toBe(false);

    receiptState.isLoading = false;
    receiptState.isSuccess = true;
    rerender();
    expect(result.current.showToast).toBe(true);
  });

  it("reports a failed confirmation", () => {
    const { result, rerender, onConfirmed } = renderWriteHook();
    submitStep(result);

    writeState.data = HASH;
    receiptState.isError = true;
    receiptState.error = new Error("reverted on-chain");
    rerender();

    expect(result.current.toast).toEqual({
      status: "error",
      title: "Consolidation Step 1 Failed",
      message: "reverted on-chain",
      transactionHash: HASH,
    });
    expect(onConfirmed).not.toHaveBeenCalled();
  });

  it("surfaces wallet errors and gas-estimation failures for the signer", () => {
    const { result, rerender } = renderWriteHook();
    submitStep(result);

    const onError = mockWriteContract.mock.calls[0]?.[1]?.onError as (
      error: Error
    ) => void;
    act(() => {
      onError(new Error("execution reverted"));
    });
    writeState.error = new Error("User rejected the request.");
    rerender();

    expect(result.current.gasError).toMatch(/^CANNOT ESTIMATE GAS/);
    expect(result.current.gasErrorSigner).toBe(A);
    expect(result.current.toast).toEqual({
      status: "error",
      title: "Consolidation Step 1 Failed",
      message: "User rejected the request.",
    });
  });

  it("shows a repeated failure again after a retry", () => {
    const { result, rerender } = renderWriteHook();
    submitStep(result);
    writeState.error = new Error("User rejected the request.");
    rerender();
    act(() => {
      result.current.dismissToast();
    });
    expect(result.current.showToast).toBe(false);

    submitStep(result);
    rerender();

    expect(result.current.showToast).toBe(true);
  });
});
