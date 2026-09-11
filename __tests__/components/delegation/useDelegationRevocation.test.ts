import { useDelegationRevocation } from "@/components/delegation/collection-delegation/useDelegationRevocation";
import type { ContractDelegation } from "@/components/delegation/CollectionDelegation.utils";
import { act, renderHook } from "@testing-library/react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";

jest.mock("wagmi", () => ({
  useWaitForTransactionReceipt: jest.fn(),
  useWriteContract: jest.fn(),
}));

const mockUseWaitForTransactionReceipt =
  useWaitForTransactionReceipt as jest.Mock;
const mockUseWriteContract = useWriteContract as jest.Mock;

describe("useDelegationRevocation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWriteContract.mockReturnValue({
      data: undefined,
      error: undefined,
      isPending: false,
      reset: jest.fn(),
      writeContract: jest.fn(),
    });
    mockUseWaitForTransactionReceipt.mockReturnValue({
      error: undefined,
      isError: false,
      isLoading: false,
      isSuccess: false,
    });
  });

  it("clears bulk selections with the rest of the revocation state", () => {
    const delegation: ContractDelegation = {
      useCase: { use_case: 3, display: "Airdrops" },
      wallets: [],
    };
    const { result } = renderHook(() =>
      useDelegationRevocation({ showDelegationToast: jest.fn() })
    );

    act(() => {
      result.current.addToBulkRevocations(delegation, "0x1");
      result.current.addToBulkRevocations(delegation, "0x2");
    });
    expect(result.current.bulkRevocations).toHaveLength(2);

    act(() => {
      result.current.resetRevocationState();
    });
    expect(result.current.bulkRevocations).toEqual([]);
  });
});
