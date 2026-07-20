import { useLaunchClaimModalActions } from "@/components/drop-forge/launch/useLaunchClaimModalActions";
import { useLaunchClaimState } from "@/components/drop-forge/launch/useLaunchClaimState";
import type { MintingClaim } from "@/generated/models/MintingClaim";
import { getClaim } from "@/services/api/memes-minting-claims-api";
import { act, renderHook, waitFor } from "@testing-library/react";

jest.mock("@/services/api/memes-minting-claims-api", () => ({
  getClaim: jest.fn(),
  upsertMemesMintingClaimAction: jest.fn(),
}));

const getClaimMock = jest.mocked(getClaim);
const requestAuth = jest.fn(async () => ({ success: true }));
const setToast = jest.fn();
const showErrorToast = jest.fn();

function useTestLaunchClaimModalActions() {
  const state = useLaunchClaimState(42);
  const actions = useLaunchClaimModalActions({
    claimId: 42,
    requestAuth,
    setToast,
    hasWallet: true,
    canAccessLaunchPage: true,
    isClaimsAdmin: true,
    isInitialized: false,
    manifoldClaim: null,
    claimWrite: { writeContract: jest.fn() },
    forgeMintingChain: { id: 11155111 },
    forgeMintingContract: "0x0000000000000000000000000000000000000529",
    mintingClaimActionsByName: {},
    mintingClaimActionPending: null,
    claimTxModalClosable: true,
    payArtistTxModalClosable: true,
    onChainClaimFetching: false,
    onChainClaimSpinnerVisible: false,
    setOnChainClaimSpinnerVisible: jest.fn(),
    showErrorToast,
    state,
  });

  return { actions, state };
}

describe("useLaunchClaimModalActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("prioritizes pay-artist state, routes each close, and refreshes after claim close", async () => {
    const refreshedClaim: MintingClaim = {
      drop_id: "drop-42",
      contract: "0x0000000000000000000000000000000000000529",
      claim_id: 42,
      description: "Refreshed claim",
      name: "Claim 42",
      attributes: [],
    };
    getClaimMock.mockResolvedValue(refreshedClaim);
    const { result } = renderHook(() => useTestLaunchClaimModalActions());

    act(() => {
      result.current.state.setClaimTxModal({
        status: "success",
        actionLabel: "Update Claim",
      });
      result.current.state.setPayArtistTxModal({
        status: "success",
        actionLabel: "Pay Artist",
      });
    });

    expect(result.current.actions.activeTxModal?.actionLabel).toBe(
      "Pay Artist"
    );

    act(() => {
      result.current.actions.closeActiveTxModal();
    });

    expect(result.current.state.payArtistTxModal).toBeNull();
    expect(result.current.actions.activeTxModal?.actionLabel).toBe(
      "Update Claim"
    );
    expect(getClaimMock).not.toHaveBeenCalled();

    act(() => {
      result.current.actions.closeActiveTxModal();
    });

    expect(result.current.state.claimTxModal).toBeNull();
    await waitFor(() => {
      expect(getClaimMock).toHaveBeenCalledWith(42);
      expect(result.current.state.claim).toEqual(refreshedClaim);
    });
  });
});
