import { act, renderHook, waitFor } from "@testing-library/react";
import { ConnectorNotConnectedError } from "@wagmi/core";
import { useLaunchClaimState } from "@/components/drop-forge/launch/useLaunchClaimState";
import { useLaunchClaimWrites } from "@/components/drop-forge/launch/useLaunchClaimWrites";
import { RESEARCH_AIRDROP_ADDRESS } from "@/constants/constants";

type WriteParams = Parameters<typeof useLaunchClaimWrites>[0];
interface HarnessOptions {
  researchAirdropCount?: number;
  data?: `0x${string}`;
  error?: WriteParams["claimWrite"]["error"];
  receiptSuccess?: boolean;
  receiptError?: Error;
  failManual?: boolean;
}

const WALLET_A = "0x0000000000000000000000000000000000000001";
const WALLET_B = "0x0000000000000000000000000000000000000002";
const writeContract = jest.fn();
const setToast = jest.fn();
const refetchOnChainClaim = jest.fn(async () => undefined);
const updateMintingClaimAction = jest.fn(async () => undefined);

function testClaimWrite(
  data: HarnessOptions["data"],
  error: HarnessOptions["error"]
): WriteParams["claimWrite"] {
  const variables = {
    abi: [],
    address: WALLET_A,
    functionName: "airdrop",
  } as const;
  const idle = {
    writeContract,
    writeContractAsync: jest.fn(),
    reset: jest.fn(),
    context: undefined,
    submittedAt: 0,
    variables: undefined,
    data: undefined,
    error: null,
    status: "idle",
    isIdle: true,
    isError: false,
    isPending: false,
    isSuccess: false,
    isPaused: false,
    failureCount: 0,
    failureReason: null,
  } as const;
  if (error) {
    return {
      ...idle,
      variables,
      error,
      status: "error",
      isIdle: false,
      isError: true,
    };
  }
  if (data) {
    return {
      ...idle,
      data,
      variables,
      status: "success",
      isIdle: false,
      isSuccess: true,
    };
  }
  return idle;
}

function useTestWrites({
  researchAirdropCount = 18,
  data,
  error,
  receiptSuccess = false,
  receiptError,
  failManual = false,
}: HarnessOptions = {}) {
  const state = useLaunchClaimState(42);
  const actions = useLaunchClaimWrites({
    claimId: 42,
    state,
    setToast,
    forgeMintingChain: { id: 11155111 },
    forgeMintingContract: WALLET_A,
    claimWrite: testClaimWrite(data, error),
    payArtistWrite: { error: null } as WriteParams["payArtistWrite"],
    waitClaimWrite: {
      isSuccess: receiptSuccess,
      error: receiptError,
    } as WriteParams["waitClaimWrite"],
    waitPayArtistWrite: {
      isSuccess: false,
      error: null,
    } as WriteParams["waitPayArtistWrite"],
    refetchOnChainClaim,
    updateMintingClaimAction,
    manifoldClaim: null,
    phaseData: [],
    selectedPhaseConfig: null,
    isInitialized: true,
    researchAirdropCount,
    payArtistAmountWei: null,
    payArtistResolvedAddressTrimmed: "",
    payArtistAddressValid: false,
    executeManual: async (write) => {
      if (failManual) throw new Error("Manual coordination failed");
      write();
    },
    executePayment: async (write) => write(),
    runConnectedAction: (action) => action(),
  });
  return { actions, state };
}

describe("airdrop transaction summaries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(["Airdrop Artist", "Airdrop Team", "Airdrop Subscriptions"] as const)(
    "counts the copies and distinct wallets actually sent by %s",
    (actionLabel) => {
      const { result } = renderHook(() => useTestWrites());
      act(() => {
        result.current.actions.runAirdropWrite({
          actionLabel,
          entries: [
            { wallet: WALLET_A, amount: 1 },
            { wallet: WALLET_B, amount: 3 },
            { wallet: WALLET_A, amount: 2 },
            { wallet: "invalid", amount: 50 },
            { wallet: WALLET_B, amount: 0 },
          ],
        });
      });
      expect(result.current.state.claimTxModal?.airdrop).toEqual({
        quantity: "6",
        walletCount: 2,
      });
      expect(writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: "airdrop",
          args: [WALLET_A, 42n, [WALLET_A, WALLET_B, WALLET_A], [1n, 3n, 2n]],
        })
      );
    }
  );

  it("keeps Research's selected quantity fixed through submission and success", () => {
    const initialProps: HarnessOptions = {};
    const { result, rerender } = renderHook(useTestWrites, {
      initialProps,
    });
    act(() => result.current.actions.runResearchAirdropWrite(null));
    expect(writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        args: [WALLET_A, 42n, [RESEARCH_AIRDROP_ADDRESS], [18n]],
      })
    );
    for (const props of [
      { researchAirdropCount: 10 },
      { researchAirdropCount: 10, data: "0x123" as const },
      { researchAirdropCount: 0, data: "0x123" as const, receiptSuccess: true },
    ]) {
      rerender(props);
      expect(result.current.state.claimTxModal?.airdrop).toEqual({
        quantity: "18",
        walletCount: 1,
      });
    }
    expect(result.current.state.claimTxModal?.status).toBe("success");
  });

  it.each(["wallet", "receipt", "coordination"] as const)(
    "retains the quantity after a %s failure",
    async (failure) => {
      const initialProps: HarnessOptions = {
        failManual: failure === "coordination",
      };
      const { result, rerender } = renderHook(useTestWrites, {
        initialProps,
      });
      act(() => result.current.actions.runResearchAirdropWrite(null));
      if (failure === "wallet") {
        const error = Object.assign(new ConnectorNotConnectedError(), {
          name: "ConnectorNotConnectedError" as const,
        });
        rerender({ error });
      }
      if (failure === "receipt") {
        rerender({ data: "0x123", receiptError: new Error("Reverted") });
      }
      await waitFor(() => {
        expect(result.current.state.claimTxModal?.status).toBe("error");
      });
      expect(result.current.state.claimTxModal?.airdrop).toEqual({
        quantity: "18",
        walletCount: 1,
      });
    }
  );
});
