import { useRef, useState } from "react";
import {
  getDefaultResearchTargetEditionSize,
  type LaunchPhaseKey,
} from "@/components/drop-forge/launch/drop-forge-launch-claim-page-client.helpers";
import type {
  ClaimTxModalState,
  LaunchMediaTab,
} from "@/components/drop-forge/launch/launch-claim-derived-state";
import type { ApiMemesMintStat } from "@/generated/models/ApiMemesMintStat";
import type { ApiMintingClaimActionsResponse } from "@/generated/models/ApiMintingClaimActionsResponse";
import type { MintingClaim } from "@/generated/models/MintingClaim";
import type { MintingClaimsRootItem } from "@/generated/models/MintingClaimsRootItem";
import type { PhaseAirdrop } from "@/generated/models/PhaseAirdrop";

export function useLaunchClaimState(claimId: number) {
  const [claim, setClaim] = useState<MintingClaim | null>(null);
  const [roots, setRoots] = useState<MintingClaimsRootItem[] | null>(null);
  const [rootsLoading, setRootsLoading] = useState(false);
  const [rootsError, setRootsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMediaTab, setActiveMediaTab] = useState<LaunchMediaTab>("image");
  const [selectedPhase, setSelectedPhase] = useState<"" | LaunchPhaseKey>("");
  const [isPhaseSelectionManual, setIsPhaseSelectionManual] = useState(false);
  const [initialPhaseSelectionNowMs, setInitialPhaseSelectionNowMs] = useState(
    () => Date.now()
  );
  const [researchTargetEditionSize, setResearchTargetEditionSize] = useState(
    () => getDefaultResearchTargetEditionSize(null)
  );
  const [phaseAllowlistWindows, setPhaseAllowlistWindows] = useState<
    Record<string, { start: string; end: string }>
  >({});
  const [phasePricesEth, setPhasePricesEth] = useState<Record<string, string>>(
    {}
  );
  const [artistAirdrops, setArtistAirdrops] = useState<PhaseAirdrop[] | null>(
    null
  );
  const [teamAirdrops, setTeamAirdrops] = useState<PhaseAirdrop[] | null>(null);
  const [subscriptionAirdropsByPhase, setSubscriptionAirdropsByPhase] =
    useState<Partial<Record<LaunchPhaseKey, PhaseAirdrop[]>>>({});
  const [
    subscriptionAirdropsLoadingByPhase,
    setSubscriptionAirdropsLoadingByPhase,
  ] = useState<Partial<Record<LaunchPhaseKey, boolean>>>({});
  const [
    subscriptionAirdropsErrorByPhase,
    setSubscriptionAirdropsErrorByPhase,
  ] = useState<Partial<Record<LaunchPhaseKey, string | null>>>({});
  const [phase0AirdropsLoading, setPhase0AirdropsLoading] = useState(false);
  const [phase0AirdropsError, setPhase0AirdropsError] = useState<string | null>(
    null
  );
  const [claimTxModal, setClaimTxModal] = useState<ClaimTxModalState | null>(
    null
  );
  const [payArtistTxModal, setPayArtistTxModal] =
    useState<ClaimTxModalState | null>(null);
  const [mintingClaimActionTypes, setMintingClaimActionTypes] = useState<
    string[] | null
  >(null);
  const [mintingClaimActions, setMintingClaimActions] =
    useState<ApiMintingClaimActionsResponse | null>(null);
  const [mintingClaimActionsLoaded, setMintingClaimActionsLoaded] =
    useState(false);
  const [mintingClaimActionsLoadFailed, setMintingClaimActionsLoadFailed] =
    useState(false);
  const [mintingClaimActionPending, setMintingClaimActionPending] = useState<
    string | null
  >(null);
  const [mintStat, setMintStat] = useState<ApiMemesMintStat | null>(null);
  const [mintStatLoading, setMintStatLoading] = useState(false);
  const [mintStatError, setMintStatError] = useState<string | null>(null);
  const [payArtistAmountEth, setPayArtistAmountEth] = useState("");
  const [payArtistAddressInput, setPayArtistAddressInput] = useState("");
  const [payArtistResolvedAddress, setPayArtistResolvedAddress] = useState("");
  const [payArtistAddressLoading, setPayArtistAddressLoading] = useState(false);
  const [payArtistAddressHasEnsError, setPayArtistAddressHasEnsError] =
    useState(false);
  const handledClaimWriteSuccessTxHashRef = useRef<string | null>(null);
  const handledClaimWriteErrorTxHashRef = useRef<string | null>(null);
  const handledPayArtistWriteSuccessTxHashRef = useRef<string | null>(null);
  const handledPayArtistWriteErrorTxHashRef = useRef<string | null>(null);
  const pendingMintingClaimActionRef = useRef<string | null>(null);
  const pendingPayArtistMintingClaimActionRef = useRef<string | null>(null);
  const mintStatRequestedRef = useRef(false);
  const activeClaimIdRef = useRef(claimId);
  const lastErrorToastRef = useRef<{ message: string; ts: number } | null>(
    null
  );
  const syncedResearchTargetClaimIdRef = useRef<number | null>(null);
  const onChainClaimFetchStartedAtRef = useRef<number | null>(null);
  const onChainClaimSpinnerHideTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  return {
    claim,
    setClaim,
    roots,
    setRoots,
    rootsLoading,
    setRootsLoading,
    rootsError,
    setRootsError,
    loading,
    setLoading,
    error,
    setError,
    activeMediaTab,
    setActiveMediaTab,
    selectedPhase,
    setSelectedPhase,
    isPhaseSelectionManual,
    setIsPhaseSelectionManual,
    initialPhaseSelectionNowMs,
    setInitialPhaseSelectionNowMs,
    researchTargetEditionSize,
    setResearchTargetEditionSize,
    phaseAllowlistWindows,
    setPhaseAllowlistWindows,
    phasePricesEth,
    setPhasePricesEth,
    artistAirdrops,
    setArtistAirdrops,
    teamAirdrops,
    setTeamAirdrops,
    subscriptionAirdropsByPhase,
    setSubscriptionAirdropsByPhase,
    subscriptionAirdropsLoadingByPhase,
    setSubscriptionAirdropsLoadingByPhase,
    subscriptionAirdropsErrorByPhase,
    setSubscriptionAirdropsErrorByPhase,
    phase0AirdropsLoading,
    setPhase0AirdropsLoading,
    phase0AirdropsError,
    setPhase0AirdropsError,
    claimTxModal,
    setClaimTxModal,
    payArtistTxModal,
    setPayArtistTxModal,
    mintingClaimActionTypes,
    setMintingClaimActionTypes,
    mintingClaimActions,
    setMintingClaimActions,
    mintingClaimActionsLoaded,
    setMintingClaimActionsLoaded,
    mintingClaimActionsLoadFailed,
    setMintingClaimActionsLoadFailed,
    mintingClaimActionPending,
    setMintingClaimActionPending,
    mintStat,
    setMintStat,
    mintStatLoading,
    setMintStatLoading,
    mintStatError,
    setMintStatError,
    payArtistAmountEth,
    setPayArtistAmountEth,
    payArtistAddressInput,
    setPayArtistAddressInput,
    payArtistResolvedAddress,
    setPayArtistResolvedAddress,
    payArtistAddressLoading,
    setPayArtistAddressLoading,
    payArtistAddressHasEnsError,
    setPayArtistAddressHasEnsError,
    handledClaimWriteSuccessTxHashRef,
    handledClaimWriteErrorTxHashRef,
    handledPayArtistWriteSuccessTxHashRef,
    handledPayArtistWriteErrorTxHashRef,
    pendingMintingClaimActionRef,
    pendingPayArtistMintingClaimActionRef,
    mintStatRequestedRef,
    activeClaimIdRef,
    lastErrorToastRef,
    syncedResearchTargetClaimIdRef,
    onChainClaimFetchStartedAtRef,
    onChainClaimSpinnerHideTimeoutRef,
  };
}

export type LaunchClaimState = ReturnType<typeof useLaunchClaimState>;
