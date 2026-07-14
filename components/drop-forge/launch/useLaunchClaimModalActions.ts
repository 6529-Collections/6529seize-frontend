import { useCallback, useEffect } from "react";
import type { useAuth } from "@/components/auth/Auth";
import { MEMES_MANIFOLD_PROXY_ABI } from "@/abis/abis";
import {
  getErrorMessage,
  isNotFoundError,
} from "@/components/drop-forge/launch/drop-forge-launch-claim-page-client.helpers";
import {
  getActiveTxModalState,
  getMintingClaimActionViewState,
} from "@/components/drop-forge/launch/launch-claim-derived-state";
import type { LaunchClaimState } from "@/components/drop-forge/launch/useLaunchClaimState";
import { MANIFOLD_LAZY_CLAIM_CONTRACT } from "@/constants/constants";
import type { ApiMintingClaimAction } from "@/generated/models/ApiMintingClaimAction";
import type { ManifoldClaim } from "@/hooks/useManifoldClaim";
import {
  getClaim,
  upsertMemesMintingClaimAction,
} from "@/services/api/memes-minting-claims-api";
import { getAuthJwt } from "@/services/auth/auth.utils";

type AuthContextValue = ReturnType<typeof useAuth>;

interface UseLaunchClaimModalActionsParams {
  claimId: number;
  requestAuth: AuthContextValue["requestAuth"];
  setToast: AuthContextValue["setToast"];
  hasWallet: boolean;
  canAccessLaunchPage: boolean;
  isClaimsAdmin: boolean;
  isInitialized: boolean;
  manifoldClaim: ManifoldClaim | null | undefined;
  claimWrite: {
    writeContract: (
      args: Parameters<
        ReturnType<typeof import("wagmi").useWriteContract>["writeContract"]
      >[0]
    ) => void;
  };
  forgeMintingChain: { id: number };
  forgeMintingContract: string;
  mintingClaimActionsByName: Record<string, ApiMintingClaimAction>;
  mintingClaimActionPending: string | null;
  claimTxModalClosable: boolean;
  payArtistTxModalClosable: boolean;
  onChainClaimFetching: boolean;
  onChainClaimSpinnerVisible: boolean;
  setOnChainClaimSpinnerVisible: (visible: boolean) => void;
  showErrorToast: (message: string) => void;
  state: LaunchClaimState;
}

export function useLaunchClaimModalActions({
  claimId,
  requestAuth,
  setToast,
  hasWallet,
  canAccessLaunchPage,
  isClaimsAdmin,
  isInitialized,
  manifoldClaim,
  claimWrite,
  forgeMintingChain,
  forgeMintingContract,
  mintingClaimActionsByName,
  mintingClaimActionPending,
  claimTxModalClosable,
  payArtistTxModalClosable,
  onChainClaimFetching,
  onChainClaimSpinnerVisible,
  setOnChainClaimSpinnerVisible,
  showErrorToast,
  state,
}: Readonly<UseLaunchClaimModalActionsParams>) {
  const {
    claim,
    setClaim,
    setError,
    claimTxModal,
    setClaimTxModal,
    payArtistTxModal,
    setPayArtistTxModal,
    mintingClaimActionTypes,
    setMintingClaimActionTypes,
    setMintingClaimActions,
    setMintingClaimActionsLoaded,
    setMintingClaimActionsLoadFailed,
    setMintingClaimActionPending,
    activeClaimIdRef,
    pendingMintingClaimActionRef,
    onChainClaimFetchStartedAtRef,
    onChainClaimSpinnerHideTimeoutRef,
  } = state;

  const runMetadataLocationOnlyUpdate = useCallback(() => {
    if (!claim) {
      setToast({ message: "Claim details are not loaded yet.", type: "error" });
      return;
    }
    if (!claim.metadata_location) {
      setToast({
        message: "Add the updated metadata location before continuing.",
        type: "error",
      });
      return;
    }
    if (!isInitialized || !manifoldClaim) {
      setToast({
        message: "Initialize the on-chain claim before continuing.",
        type: "error",
      });
      return;
    }
    if (
      manifoldClaim.walletMax == null ||
      manifoldClaim.storageProtocol == null ||
      manifoldClaim.merkleRoot == null ||
      manifoldClaim.costWei == null ||
      manifoldClaim.paymentReceiver == null ||
      manifoldClaim.erc20 == null ||
      manifoldClaim.signingAddress == null ||
      manifoldClaim.totalMax == null ||
      manifoldClaim.startDate == null ||
      manifoldClaim.endDate == null
    ) {
      setToast({
        message: "On-chain claim parameters are not available yet.",
        type: "error",
      });
      return;
    }

    const claimParameters = [
      manifoldClaim.totalMax,
      manifoldClaim.walletMax,
      manifoldClaim.startDate,
      manifoldClaim.endDate,
      manifoldClaim.storageProtocol,
      manifoldClaim.merkleRoot,
      claim.metadata_location,
      manifoldClaim.costWei,
      manifoldClaim.paymentReceiver,
      manifoldClaim.erc20,
      manifoldClaim.signingAddress,
    ] as const;

    setClaimTxModal({
      status: "confirm_wallet",
      actionLabel: "Update Claim",
    });
    pendingMintingClaimActionRef.current = null;
    try {
      claimWrite.writeContract({
        address: MANIFOLD_LAZY_CLAIM_CONTRACT as `0x${string}`,
        abi: MEMES_MANIFOLD_PROXY_ABI,
        chainId: forgeMintingChain.id,
        functionName: "updateClaim",
        args: [forgeMintingContract, BigInt(claimId), claimParameters],
      });
    } catch (error) {
      pendingMintingClaimActionRef.current = null;
      setClaimTxModal({
        status: "error",
        message: getErrorMessage(error, "Failed to submit transaction"),
        actionLabel: "Update Claim",
      });
    }
  }, [
    claim,
    isInitialized,
    manifoldClaim,
    claimWrite,
    forgeMintingChain.id,
    forgeMintingContract,
    claimId,
    setToast,
  ]);

  const refreshLaunchClaimData = useCallback(async () => {
    if (!hasWallet || !canAccessLaunchPage) return;

    try {
      const refreshedClaim = await getClaim(claimId);
      setClaim(refreshedClaim);
      setError(null);
    } catch (e) {
      const msg = getErrorMessage(e, "Failed to refresh claim");
      if (isNotFoundError(msg)) {
        setError("Claim not found");
      } else {
        setError(msg);
        showErrorToast(msg);
      }
    }
  }, [hasWallet, canAccessLaunchPage, claimId, showErrorToast]);

  const updateMintingClaimAction = useCallback(
    async ({ action, completed }: { action: string; completed: boolean }) => {
      const currentClaimId = claimId;
      const isStaleClaimActionRequest = (): boolean =>
        activeClaimIdRef.current !== currentClaimId;

      if (!isClaimsAdmin) {
        return;
      }

      if (
        mintingClaimActionTypes &&
        mintingClaimActionTypes.length > 0 &&
        !mintingClaimActionTypes.includes(action)
      ) {
        return;
      }

      if (!getAuthJwt()) {
        const { success } = await requestAuth();
        if (!success || isStaleClaimActionRequest()) {
          return;
        }
      }

      if (isStaleClaimActionRequest()) {
        return;
      }

      setMintingClaimActionPending(action);

      try {
        const response = await upsertMemesMintingClaimAction(currentClaimId, {
          action,
          completed,
        });
        if (isStaleClaimActionRequest()) {
          return;
        }
        setMintingClaimActions(response);
        setMintingClaimActionsLoaded(true);
        setMintingClaimActionsLoadFailed(false);
        setMintingClaimActionTypes(
          (prev) =>
            prev ??
            response.actions
              .map((item) => item.action)
              .filter((value, index, source) => source.indexOf(value) === index)
        );
      } catch (e) {
        if (isStaleClaimActionRequest()) {
          return;
        }
        const msg = getErrorMessage(e, `Failed to update ${action}`);
        showErrorToast(msg);
      } finally {
        if (!isStaleClaimActionRequest()) {
          setMintingClaimActionPending((current) =>
            current === action ? null : current
          );
        }
      }
    },
    [
      claimId,
      isClaimsAdmin,
      mintingClaimActionTypes,
      requestAuth,
      showErrorToast,
    ]
  );

  const handleMintingClaimActionToggle = useCallback(
    async (action: string, completed: boolean) => {
      await updateMintingClaimAction({
        action,
        completed: !completed,
      });
    },
    [updateMintingClaimAction]
  );

  const closeClaimTxModal = useCallback(() => {
    if (!claimTxModalClosable) return;
    setClaimTxModal(null);
    refreshLaunchClaimData().catch(() => undefined);
  }, [claimTxModalClosable, refreshLaunchClaimData]);
  const closePayArtistTxModal = useCallback(() => {
    if (!payArtistTxModalClosable) return;
    setPayArtistTxModal(null);
  }, [payArtistTxModalClosable]);
  const { activeTxModal, activeTxModalClosable, closeActiveTxModal } =
    getActiveTxModalState({
      payArtistTxModal,
      claimTxModal,
      payArtistTxModalClosable,
      claimTxModalClosable,
      closePayArtistTxModal,
      closeClaimTxModal,
    });

  const mintingClaimActionViewState = getMintingClaimActionViewState(
    isClaimsAdmin,
    mintingClaimActionsByName,
    mintingClaimActionPending
  );

  useEffect(() => {
    if (!activeTxModal) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [activeTxModal]);

  useEffect(() => {
    if (!activeTxModalClosable) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeActiveTxModal();
      }
    };
    globalThis.addEventListener("keydown", onKeyDown);
    return () => globalThis.removeEventListener("keydown", onKeyDown);
  }, [activeTxModalClosable, closeActiveTxModal]);

  useEffect(() => {
    if (onChainClaimFetching) {
      onChainClaimFetchStartedAtRef.current = Date.now();
      setOnChainClaimSpinnerVisible(true);
      if (onChainClaimSpinnerHideTimeoutRef.current) {
        clearTimeout(onChainClaimSpinnerHideTimeoutRef.current);
        onChainClaimSpinnerHideTimeoutRef.current = null;
      }
      return;
    }

    if (!onChainClaimSpinnerVisible) return;

    const startedAt = onChainClaimFetchStartedAtRef.current ?? Date.now();
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(1500 - elapsed, 0);

    if (remaining === 0) {
      setOnChainClaimSpinnerVisible(false);
      return;
    }

    onChainClaimSpinnerHideTimeoutRef.current = setTimeout(() => {
      setOnChainClaimSpinnerVisible(false);
      onChainClaimSpinnerHideTimeoutRef.current = null;
    }, remaining);

    return () => {
      if (onChainClaimSpinnerHideTimeoutRef.current) {
        clearTimeout(onChainClaimSpinnerHideTimeoutRef.current);
        onChainClaimSpinnerHideTimeoutRef.current = null;
      }
    };
  }, [onChainClaimFetching, onChainClaimSpinnerVisible]);

  return {
    runMetadataLocationOnlyUpdate,
    updateMintingClaimAction,
    handleMintingClaimActionToggle,
    activeTxModal,
    closeActiveTxModal,
    mintingClaimActionViewState,
  };
}
