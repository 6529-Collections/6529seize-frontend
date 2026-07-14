import { useCallback, useEffect } from "react";
import type { useAuth } from "@/components/auth/Auth";
import {
  clampResearchTargetEditionSize,
  getDefaultResearchTargetEditionSize,
  getErrorMessage,
  getSubscriptionPhaseName,
  type LaunchPhaseKey,
  isNotFoundError,
} from "@/components/drop-forge/launch/drop-forge-launch-claim-page-client.helpers";
import {
  formatEditableEthValue,
  getClaimPresentationState,
  getSubscriptionAirdropFetchState,
} from "@/components/drop-forge/launch/launch-claim-derived-state";
import type { LaunchClaimState } from "@/components/drop-forge/launch/useLaunchClaimState";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { ManifoldClaim } from "@/hooks/useManifoldClaim";
import {
  getClaim,
  getDistributionAirdropsArtist,
  getDistributionAirdropsTeam,
  getFinalSubscriptionsByPhase,
  getMemesMintStat,
  getMemesMintingClaimActions,
  getMemesMintingClaimActionTypes,
  getMemesMintingRoots as getClaimRoots,
} from "@/services/api/memes-minting-claims-api";
import { getAuthJwt } from "@/services/auth/auth.utils";

type AuthContextValue = ReturnType<typeof useAuth>;

interface UseLaunchClaimDataEffectsParams {
  claimId: number;
  requestAuth: AuthContextValue["requestAuth"];
  setToast: AuthContextValue["setToast"];
  hasWallet: boolean;
  permissionsLoading: boolean;
  canAccessLaunchPage: boolean;
  isClaimsAdmin: boolean;
  manifoldClaim: ManifoldClaim | null | undefined;
  onChainClaimFetching: boolean;
  state: LaunchClaimState;
}

export function useLaunchClaimDataEffects({
  claimId,
  requestAuth,
  setToast,
  hasWallet,
  permissionsLoading,
  canAccessLaunchPage,
  isClaimsAdmin,
  manifoldClaim,
  onChainClaimFetching,
  state,
}: Readonly<UseLaunchClaimDataEffectsParams>) {
  const {
    claim,
    setClaim,
    setRoots,
    setRootsLoading,
    setRootsError,
    setLoading,
    setError,
    activeMediaTab,
    setActiveMediaTab,
    selectedPhase,
    setSelectedPhase,
    setIsPhaseSelectionManual,
    setInitialPhaseSelectionNowMs,
    setResearchTargetEditionSize,
    setPhaseAllowlistWindows,
    setPhasePricesEth,
    artistAirdrops,
    setArtistAirdrops,
    teamAirdrops,
    setTeamAirdrops,
    subscriptionAirdropsByPhase,
    setSubscriptionAirdropsByPhase,
    subscriptionAirdropsLoadingByPhase,
    setSubscriptionAirdropsLoadingByPhase,
    setSubscriptionAirdropsErrorByPhase,
    setPhase0AirdropsLoading,
    setPhase0AirdropsError,
    setPayArtistTxModal,
    setMintingClaimActionTypes,
    setMintingClaimActions,
    setMintingClaimActionsLoaded,
    setMintingClaimActionsLoadFailed,
    setMintingClaimActionPending,
    setMintStat,
    setMintStatLoading,
    setMintStatError,
    setPayArtistAmountEth,
    setPayArtistAddressInput,
    setPayArtistResolvedAddress,
    setPayArtistAddressLoading,
    setPayArtistAddressHasEnsError,
    pendingMintingClaimActionRef,
    pendingPayArtistMintingClaimActionRef,
    mintStatRequestedRef,
    activeClaimIdRef,
    lastErrorToastRef,
    syncedResearchTargetClaimIdRef,
  } = state;

  const showErrorToast = useCallback(
    (message: string) => {
      const now = Date.now();
      const last = lastErrorToastRef.current;
      const lastTs = last?.ts;
      if (
        last?.message === message &&
        lastTs !== undefined &&
        now - lastTs < 2000
      ) {
        return;
      }
      lastErrorToastRef.current = { message, ts: now };
      setToast({ message, type: "error" });
    },
    [setToast]
  );

  useEffect(() => {
    activeClaimIdRef.current = claimId;
  }, [claimId]);

  const shouldShowPermissionFallback =
    permissionsLoading || !hasWallet || !canAccessLaunchPage;

  useEffect(() => {
    if (!hasWallet || !canAccessLaunchPage) return;
    let cancelled = false;
    setClaim(null);
    setRoots(null);
    setLoading(true);
    setError(null);
    setRootsLoading(true);
    setRootsError(null);
    getClaim(claimId)
      .then((res) => {
        if (!cancelled) {
          setClaim(res);
        }
      })
      .catch((e) => {
        const msg = getErrorMessage(e, "Failed to load claim");
        if (!cancelled) {
          if (isNotFoundError(msg)) {
            setError("Claim not found");
          } else {
            setError(msg);
            showErrorToast(msg);
          }
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    getClaimRoots(claimId)
      .then((res) => {
        if (!cancelled) {
          setRoots(res);
        }
      })
      .catch((e) => {
        const msg = getErrorMessage(e, "Failed to load roots");
        if (!cancelled) {
          if (isNotFoundError(msg)) {
            setRootsError(null);
          } else {
            setRootsError(msg);
            showErrorToast(msg);
          }
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRootsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hasWallet, canAccessLaunchPage, claimId, showErrorToast]);

  useEffect(() => {
    if (!hasWallet || !canAccessLaunchPage || claim?.media_uploading !== true)
      return;
    let cancelled = false;
    const id = setInterval(() => {
      getClaim(claimId)
        .then((res) => {
          if (!cancelled) {
            setClaim(res);
          }
        })
        .catch((e) => {
          const msg = getErrorMessage(e, "Failed to refresh claim status");
          if (!cancelled) {
            if (isNotFoundError(msg)) {
              setError("Claim not found");
            } else {
              setError(msg);
              showErrorToast(msg);
            }
          }
        });
    }, 10000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [
    hasWallet,
    canAccessLaunchPage,
    claim?.media_uploading,
    claimId,
    showErrorToast,
  ]);

  const {
    isInitialized,
    hasPublishedMetadata,
    missingRequiredInfo,
    researchTargetEditionSizeLimit,
    primaryStatus,
    hasImage,
    hasAnimation,
    animationMimeType,
    activeMediaTypeLabel,
    safeClaimExternalUrl,
  } = getClaimPresentationState({
    claim,
    manifoldClaim,
    onChainClaimFetching,
    activeMediaTab,
  });

  useEffect(() => {
    setActiveMediaTab("image");
  }, [claimId]);

  useEffect(() => {
    const claimMatchesCurrentClaimId = claim?.claim_id === claimId;

    if (
      syncedResearchTargetClaimIdRef.current !== claimId &&
      !claimMatchesCurrentClaimId
    ) {
      syncedResearchTargetClaimIdRef.current = null;
      setResearchTargetEditionSize(getDefaultResearchTargetEditionSize(null));
      return;
    }

    if (!claim || !claimMatchesCurrentClaimId) return;

    setResearchTargetEditionSize((current) => {
      if (syncedResearchTargetClaimIdRef.current !== claimId) {
        syncedResearchTargetClaimIdRef.current = claimId;
        return getDefaultResearchTargetEditionSize(
          claim.edition_size,
          manifoldClaim?.totalMax
        );
      }

      return clampResearchTargetEditionSize(
        current,
        claim.edition_size,
        manifoldClaim?.totalMax
      );
    });
  }, [claim, claimId, manifoldClaim?.totalMax]);

  useEffect(() => {
    setSelectedPhase("");
    setIsPhaseSelectionManual(false);
    setInitialPhaseSelectionNowMs(Date.now());
    setPhaseAllowlistWindows({});
    setPhasePricesEth({});
    setArtistAirdrops(null);
    setTeamAirdrops(null);
    setPhase0AirdropsError(null);
    setPhase0AirdropsLoading(false);
    setSubscriptionAirdropsByPhase({});
    setSubscriptionAirdropsLoadingByPhase({});
    setSubscriptionAirdropsErrorByPhase({});
    setMintingClaimActionTypes(null);
    setMintingClaimActions(null);
    setMintingClaimActionsLoaded(false);
    setMintingClaimActionsLoadFailed(false);
    setMintingClaimActionPending(null);
    setMintStat(null);
    setMintStatLoading(false);
    setMintStatError(null);
    setPayArtistAmountEth("");
    setPayArtistAddressInput("");
    setPayArtistResolvedAddress("");
    setPayArtistAddressLoading(false);
    setPayArtistAddressHasEnsError(false);
    setPayArtistTxModal(null);
    pendingMintingClaimActionRef.current = null;
    pendingPayArtistMintingClaimActionRef.current = null;
    mintStatRequestedRef.current = false;
  }, [claimId]);

  useEffect(() => {
    if (!hasWallet || !canAccessLaunchPage || !isClaimsAdmin) return;

    let cancelled = false;
    setMintingClaimActionsLoaded(false);
    setMintingClaimActionsLoadFailed(false);

    (async () => {
      try {
        if (!getAuthJwt()) {
          const { success } = await requestAuth();
          if (!success || cancelled) {
            return;
          }
        }

        const typesResponse = await getMemesMintingClaimActionTypes();
        if (cancelled) return;
        setMintingClaimActionTypes(typesResponse.action_types ?? []);
      } catch {
        if (!cancelled) {
          setMintingClaimActionTypes(null);
          setMintingClaimActions(null);
          setMintingClaimActionsLoadFailed(true);
          setMintingClaimActionsLoaded(true);
        }
        return;
      }

      try {
        const actionsResponse = await getMemesMintingClaimActions(claimId);
        if (cancelled) return;
        setMintingClaimActions(actionsResponse);
        setMintingClaimActionsLoaded(true);
      } catch {
        if (!cancelled) {
          setMintingClaimActions(null);
          setMintingClaimActionsLoadFailed(true);
          setMintingClaimActionsLoaded(true);
        }
      }
    })().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [hasWallet, canAccessLaunchPage, isClaimsAdmin, claimId, requestAuth]);

  useEffect(() => {
    if (permissionsLoading || isClaimsAdmin) return;
    setMintingClaimActionTypes(null);
    setMintingClaimActions(null);
    setMintingClaimActionsLoaded(false);
    setMintingClaimActionsLoadFailed(true);
    setMintingClaimActionPending(null);
    pendingMintingClaimActionRef.current = null;
  }, [permissionsLoading, isClaimsAdmin]);

  useEffect(() => {
    if (!hasWallet || !canAccessLaunchPage) return;
    if (selectedPhase !== "phase0") return;
    if (artistAirdrops !== null && teamAirdrops !== null) return;

    let cancelled = false;
    setPhase0AirdropsLoading(true);
    setPhase0AirdropsError(null);

    Promise.all([
      getDistributionAirdropsArtist(MEMES_CONTRACT, claimId),
      getDistributionAirdropsTeam(MEMES_CONTRACT, claimId),
    ])
      .then(([artist, team]) => {
        if (cancelled) return;
        setArtistAirdrops(artist);
        setTeamAirdrops(team);
      })
      .catch((e) => {
        const msg = getErrorMessage(
          e,
          "Failed to load artist/team airdrop data"
        );
        if (cancelled) return;
        setPhase0AirdropsError(msg);
      })
      .finally(() => {
        if (!cancelled) {
          setPhase0AirdropsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    hasWallet,
    canAccessLaunchPage,
    selectedPhase,
    artistAirdrops,
    teamAirdrops,
    claimId,
  ]);

  const fetchSubscriptionAirdropsForPhase = useCallback(
    async (phaseKey: LaunchPhaseKey) => {
      setSubscriptionAirdropsLoadingByPhase((prev) => ({
        ...prev,
        [phaseKey]: true,
      }));
      setSubscriptionAirdropsErrorByPhase((prev) => ({
        ...prev,
        [phaseKey]: null,
      }));

      try {
        const entries = await getFinalSubscriptionsByPhase(
          MEMES_CONTRACT,
          claimId,
          getSubscriptionPhaseName(phaseKey)
        );
        setSubscriptionAirdropsByPhase((prev) => ({
          ...prev,
          [phaseKey]: entries,
        }));
      } catch (e) {
        const msg = getErrorMessage(
          e,
          `Failed to load ${getSubscriptionPhaseName(phaseKey)} subscriptions`
        );
        setSubscriptionAirdropsByPhase((prev) => ({
          ...prev,
          [phaseKey]: [],
        }));
        setSubscriptionAirdropsErrorByPhase((prev) => ({
          ...prev,
          [phaseKey]: msg,
        }));
      } finally {
        setSubscriptionAirdropsLoadingByPhase((prev) => ({
          ...prev,
          [phaseKey]: false,
        }));
      }
    },
    [claimId]
  );

  const {
    selectedPhaseHasSubscriptionAirdrops,
    selectedPhaseSubscriptionAirdropsLoading,
    publicPhaseHasSubscriptionAirdrops,
    publicPhaseSubscriptionAirdropsLoading,
  } = getSubscriptionAirdropFetchState({
    selectedPhase,
    subscriptionAirdropsByPhase,
    subscriptionAirdropsLoadingByPhase,
  });

  useEffect(() => {
    if (!hasWallet || !canAccessLaunchPage || !selectedPhase) return;
    const maybeFetch = (
      phaseKey: LaunchPhaseKey,
      hasValue: boolean,
      isLoading: boolean
    ) => {
      if (!hasValue && !isLoading) {
        fetchSubscriptionAirdropsForPhase(phaseKey).catch(() => undefined);
      }
    };

    if (selectedPhase === "phase0" || selectedPhase === "phase1") {
      maybeFetch(
        selectedPhase,
        selectedPhaseHasSubscriptionAirdrops,
        selectedPhaseSubscriptionAirdropsLoading
      );
      return;
    }

    if (selectedPhase === "phase2") {
      maybeFetch(
        "phase2",
        selectedPhaseHasSubscriptionAirdrops,
        selectedPhaseSubscriptionAirdropsLoading
      );
      maybeFetch(
        "publicphase",
        publicPhaseHasSubscriptionAirdrops,
        publicPhaseSubscriptionAirdropsLoading
      );
    }
  }, [
    hasWallet,
    canAccessLaunchPage,
    selectedPhase,
    selectedPhaseHasSubscriptionAirdrops,
    selectedPhaseSubscriptionAirdropsLoading,
    publicPhaseHasSubscriptionAirdrops,
    publicPhaseSubscriptionAirdropsLoading,
    fetchSubscriptionAirdropsForPhase,
  ]);

  useEffect(() => {
    if (!hasWallet || !canAccessLaunchPage) return;
    if (selectedPhase !== "payartist") {
      mintStatRequestedRef.current = false;
      setMintStatLoading(false);
      return;
    }
    if (mintStatRequestedRef.current) return;
    mintStatRequestedRef.current = true;

    let cancelled = false;
    setMintStatLoading(true);
    setMintStatError(null);

    getMemesMintStat(claimId)
      .then((response) => {
        if (cancelled) return;
        const paymentAddress = (
          response.payment_details?.payment_address ?? ""
        ).trim();
        setMintStat(response);
        setPayArtistAmountEth(
          formatEditableEthValue(response.artist_split_eth)
        );
        setPayArtistAddressInput(paymentAddress);
        setPayArtistResolvedAddress(paymentAddress);
        setPayArtistAddressHasEnsError(false);
      })
      .catch((e) => {
        if (cancelled) return;
        mintStatRequestedRef.current = false;
        const msg = getErrorMessage(e, "Failed to load mint stats");
        setMintStatError(msg);
        showErrorToast(msg);
      })
      .finally(() => {
        if (!cancelled) {
          setMintStatLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hasWallet, canAccessLaunchPage, selectedPhase, claimId, showErrorToast]);

  return {
    showErrorToast,
    shouldShowPermissionFallback,
    isInitialized,
    hasPublishedMetadata,
    missingRequiredInfo,
    researchTargetEditionSizeLimit,
    primaryStatus,
    hasImage,
    hasAnimation,
    animationMimeType,
    activeMediaTypeLabel,
    safeClaimExternalUrl,
  };
}
