import { useEffect, useMemo } from "react";
import { isAddress, parseEther } from "viem";
import {
  buildSubscriptionAirdropSelection,
  formatDateTimeLocalInput,
  getAutoSelectedLaunchPhase,
  getLaunchListStatus,
  getRootForPhase,
  clampResearchTargetEditionSize,
  mergeAirdropsByWallet,
  summarizeAirdrops,
} from "@/components/drop-forge/launch/drop-forge-launch-claim-page-client.helpers";
import {
  DEFAULT_PHASE_PRICE_ETH,
  getLaunchActionCompletionState,
  getPayArtistAddressError,
  getSelectedPhaseActionDisabled,
  getSelectedPhaseActionLabel,
  getSelectedPhaseComparableConfig,
  getSelectedPhaseDiffs,
  getSelectedPhaseIsUpdateAction,
  getSelectedPhaseMatchesOnChainConfig,
  getSubscriptionAirdropSectionConfigs,
} from "@/components/drop-forge/launch/launch-claim-derived-state";
import type { LaunchClaimState } from "@/components/drop-forge/launch/useLaunchClaimState";
import { getMintTimelineDetails as getClaimTimelineDetails } from "@/components/meme-calendar/meme-calendar.helpers";
import type { ApiMintingClaimAction } from "@/generated/models/ApiMintingClaimAction";
import { Time } from "@/helpers/time";
import { buildMemesPhases as buildClaimPhases } from "@/hooks/useManifoldClaim";
import type { ManifoldClaim } from "@/hooks/useManifoldClaim";

interface UseLaunchClaimViewModelParams {
  claimId: number;
  state: LaunchClaimState;
  manifoldClaim: ManifoldClaim | null | undefined;
  primaryStatus: ReturnType<
    typeof import("@/components/drop-forge/launch/launch-claim-derived-state").getClaimPresentationState
  >["primaryStatus"];
  hasPublishedMetadata: boolean;
  isInitialized: boolean;
  missingRequiredInfo: boolean;
  claimWrite: { isPending: boolean };
  waitClaimWrite: { isLoading: boolean };
  payArtistWrite: { isPending: boolean };
  waitPayArtistWrite: { isLoading: boolean };
}

export function useLaunchClaimViewModel({
  claimId,
  state,
  manifoldClaim,
  primaryStatus,
  hasPublishedMetadata,
  isInitialized,
  missingRequiredInfo,
  claimWrite,
  waitClaimWrite,
  payArtistWrite,
  waitPayArtistWrite,
}: Readonly<UseLaunchClaimViewModelParams>) {
  const {
    claim,
    roots,
    selectedPhase,
    setSelectedPhase,
    isPhaseSelectionManual,
    initialPhaseSelectionNowMs,
    phaseAllowlistWindows,
    setPhaseAllowlistWindows,
    phasePricesEth,
    setPhasePricesEth,
    artistAirdrops,
    teamAirdrops,
    subscriptionAirdropsByPhase,
    subscriptionAirdropsLoadingByPhase,
    subscriptionAirdropsErrorByPhase,
    mintingClaimActionTypes,
    mintingClaimActions,
    mintingClaimActionsLoaded,
    mintingClaimActionsLoadFailed,
    claimTxModal,
    payArtistTxModal,
    researchTargetEditionSize,
    payArtistAmountEth,
    payArtistResolvedAddress,
    payArtistAddressLoading,
    payArtistAddressHasEnsError,
  } = state;

  const artistAirdropSummary = useMemo(
    () => summarizeAirdrops(artistAirdrops),
    [artistAirdrops]
  );
  const teamAirdropSummary = useMemo(
    () => summarizeAirdrops(teamAirdrops),
    [teamAirdrops]
  );
  const remainingEditionsForSubscriptions = Math.max(
    0,
    Number(manifoldClaim?.remaining ?? 0)
  );
  const subscriptionAirdropSectionConfigs = useMemo(() => {
    return getSubscriptionAirdropSectionConfigs(selectedPhase);
  }, [selectedPhase]);
  const subscriptionAirdropSections = useMemo(
    () =>
      subscriptionAirdropSectionConfigs.map((section) => {
        const rawEntries =
          subscriptionAirdropsByPhase[section.phaseKey] ?? null;
        const mergedEntries = mergeAirdropsByWallet(rawEntries);
        const summary = summarizeAirdrops(mergedEntries);
        const capped = buildSubscriptionAirdropSelection(
          mergedEntries,
          remainingEditionsForSubscriptions
        );

        return {
          ...section,
          loading: Boolean(
            subscriptionAirdropsLoadingByPhase[section.phaseKey]
          ),
          error: subscriptionAirdropsErrorByPhase[section.phaseKey] ?? null,
          addresses: summary.addresses,
          totalAirdrops: summary.totalAirdrops,
          airdropEntries: capped.selected,
          airdropCount: capped.selectedTotal,
        };
      }),
    [
      subscriptionAirdropSectionConfigs,
      subscriptionAirdropsByPhase,
      subscriptionAirdropsLoadingByPhase,
      subscriptionAirdropsErrorByPhase,
      remainingEditionsForSubscriptions,
    ]
  );
  const renderedMintingClaimActions = useMemo<ApiMintingClaimAction[]>(() => {
    if (!mintingClaimActionTypes || mintingClaimActionTypes.length === 0) {
      return [];
    }

    const currentActions = mintingClaimActions?.actions;
    if (!currentActions) {
      return [];
    }

    const supportedTypes = new Set(mintingClaimActionTypes);
    const seenActions = new Set<string>();
    const orderedActions = currentActions.filter((action) => {
      if (
        !supportedTypes.has(action.action) ||
        seenActions.has(action.action)
      ) {
        return false;
      }
      seenActions.add(action.action);
      return true;
    });

    const missingActions = mintingClaimActionTypes
      .filter((action) => !seenActions.has(action))
      .map(
        (action) =>
          ({
            action,
            completed: false,
          }) as ApiMintingClaimAction
      );

    return [...orderedActions, ...missingActions];
  }, [mintingClaimActions, mintingClaimActionTypes]);
  const mintingClaimActionsByName = useMemo(
    () =>
      Object.fromEntries(
        renderedMintingClaimActions.map((action) => [action.action, action])
      ) as Record<string, ApiMintingClaimAction>,
    [renderedMintingClaimActions]
  );
  const availableMintingClaimActionNames = useMemo(
    () => Object.keys(mintingClaimActionsByName),
    [mintingClaimActionsByName]
  );
  const { researchAirdropCompleted, payArtistCompleted } = useMemo(
    () =>
      getLaunchActionCompletionState({
        mintingClaimActionsByName,
        availableMintingClaimActionNames,
      }),
    [mintingClaimActionsByName, availableMintingClaimActionNames]
  );
  const headerStatus = useMemo(() => {
    if (!primaryStatus) return null;
    if (mintingClaimActionsLoadFailed) {
      return primaryStatus;
    }
    return getLaunchListStatus({
      primaryStatus,
      manifoldClaim,
      researchAirdropCompleted,
      payArtistCompleted,
      actionsLoaded: mintingClaimActionsLoaded,
    });
  }, [
    primaryStatus,
    manifoldClaim,
    researchAirdropCompleted,
    payArtistCompleted,
    mintingClaimActionsLoaded,
    mintingClaimActionsLoadFailed,
  ]);
  const mintTimeline = useMemo(
    () => (claimId > 0 ? getClaimTimelineDetails(claimId) : null),
    [claimId]
  );

  const phaseData = useMemo(() => {
    const scheduleByPhaseId = new Map(
      (mintTimeline
        ? buildClaimPhases(Time.millis(mintTimeline.instantUtc.getTime()))
        : []
      ).map((phase) => [phase.id, phase])
    );

    return [
      {
        key: "phase0" as const,
        title: "Phase 0 - Initialize Claim",
        root: getRootForPhase(roots, "phase0"),
        schedule: scheduleByPhaseId.get("0"),
      },
      {
        key: "phase1" as const,
        title: "Phase 1",
        root: getRootForPhase(roots, "phase1"),
        schedule: scheduleByPhaseId.get("1"),
      },
      {
        key: "phase2" as const,
        title: "Phase 2",
        root: getRootForPhase(roots, "phase2"),
        schedule: scheduleByPhaseId.get("2"),
      },
      {
        key: "publicphase" as const,
        title: "Public Phase",
        root: getRootForPhase(roots, "publicphase"),
        schedule: scheduleByPhaseId.get("public"),
      },
    ];
  }, [mintTimeline, roots]);
  const autoSelectedPhase = useMemo(
    () =>
      getAutoSelectedLaunchPhase({
        hasPublishedMetadata,
        isInitialized,
        nowMs: initialPhaseSelectionNowMs,
        researchAirdropCompleted,
        payArtistCompleted,
        phases: phaseData.map((phase) => ({
          key: phase.key,
          schedule: phase.schedule
            ? {
                startMs: phase.schedule.start.toMillis(),
                endMs: phase.schedule.end.toMillis(),
              }
            : null,
        })),
      }),
    [
      hasPublishedMetadata,
      initialPhaseSelectionNowMs,
      isInitialized,
      researchAirdropCompleted,
      payArtistCompleted,
      phaseData,
    ]
  );
  useEffect(() => {
    if (isPhaseSelectionManual) {
      return;
    }

    if (!mintingClaimActionsLoaded && autoSelectedPhase === "research") {
      return;
    }

    if (
      !selectedPhase ||
      (selectedPhase === "research" && autoSelectedPhase === "payartist")
    ) {
      setSelectedPhase(autoSelectedPhase);
    }
  }, [
    autoSelectedPhase,
    hasPublishedMetadata,
    isPhaseSelectionManual,
    mintingClaimActionsLoaded,
    selectedPhase,
  ]);
  const selectedPhaseConfig = useMemo(
    () => phaseData.find((phase) => phase.key === selectedPhase) ?? null,
    [phaseData, selectedPhase]
  );
  const isMetadataOnlyUpdateMode = primaryStatus?.key === "live_needs_update";

  useEffect(() => {
    setPhaseAllowlistWindows((prev) => {
      const next = { ...prev };
      for (const phase of phaseData) {
        if (!next[phase.key]) {
          next[phase.key] = {
            start: phase.schedule
              ? formatDateTimeLocalInput(phase.schedule.start.toDate())
              : "",
            end: phase.schedule
              ? formatDateTimeLocalInput(phase.schedule.end.toDate())
              : "",
          };
        }
      }
      return next;
    });
  }, [phaseData]);
  useEffect(() => {
    setPhasePricesEth((prev) => {
      const next = { ...prev };
      for (const phase of phaseData) {
        if (!next[phase.key]) {
          next[phase.key] = DEFAULT_PHASE_PRICE_ETH;
        }
      }
      return next;
    });
  }, [phaseData]);
  const selectedPhaseActionLabel = getSelectedPhaseActionLabel(
    selectedPhase,
    isInitialized
  );
  const claimWritePending = claimWrite.isPending || waitClaimWrite.isLoading;
  const payArtistWritePending =
    payArtistWrite.isPending || waitPayArtistWrite.isLoading;
  const launchActionPending = claimWritePending || payArtistWritePending;
  const selectedPhaseIsUpdateAction = getSelectedPhaseIsUpdateAction(
    selectedPhaseConfig,
    isInitialized
  );
  const selectedPhaseComparableConfig = useMemo(() => {
    return getSelectedPhaseComparableConfig({
      selectedPhaseConfig,
      phaseAllowlistWindows,
      phasePricesEth,
    });
  }, [selectedPhaseConfig, phaseAllowlistWindows, phasePricesEth]);
  const selectedPhaseMatchesOnChainConfig = useMemo(() => {
    return getSelectedPhaseMatchesOnChainConfig({
      selectedPhaseIsUpdateAction,
      selectedPhaseComparableConfig,
      claim,
      manifoldClaim,
      isInitialized,
    });
  }, [
    selectedPhaseIsUpdateAction,
    selectedPhaseComparableConfig,
    claim,
    manifoldClaim,
    isInitialized,
  ]);
  const selectedPhaseDiffs = useMemo(() => {
    return getSelectedPhaseDiffs({
      selectedPhaseIsUpdateAction,
      selectedPhaseComparableConfig,
      claim,
      manifoldClaim,
      isInitialized,
    });
  }, [
    selectedPhaseIsUpdateAction,
    selectedPhaseComparableConfig,
    claim,
    manifoldClaim,
    isInitialized,
  ]);
  const changedFieldBoxClassName =
    "tw-ring-rose-500/70 hover:tw-ring-rose-400/70";
  const changedFieldBoxLabelClassName = "tw-text-rose-300 tw-ring-rose-500/70";
  const selectedPhaseActionDisabled = getSelectedPhaseActionDisabled({
    launchActionPending,
    selectedPhaseConfig,
    isInitialized,
    missingRequiredInfo,
    selectedPhaseIsUpdateAction,
    selectedPhaseMatchesOnChainConfig,
  });
  const isPublicPhaseSelected = selectedPhaseConfig?.key === "publicphase";
  const showPhase0AirdropSections = selectedPhaseConfig?.key === "phase0";
  const claimTxModalClosable =
    claimTxModal?.status === "success" || claimTxModal?.status === "error";
  const payArtistTxModalClosable =
    payArtistTxModal?.status === "success" ||
    payArtistTxModal?.status === "error";
  const totalMinted = Number(manifoldClaim?.total ?? 0);
  const cappedResearchTargetEditionSize = clampResearchTargetEditionSize(
    researchTargetEditionSize,
    claim?.edition_size,
    manifoldClaim?.totalMax
  );
  const researchAirdropCount = Math.max(
    0,
    cappedResearchTargetEditionSize - totalMinted
  );
  const payArtistAmountWei = useMemo(() => {
    const trimmed = payArtistAmountEth.trim();
    if (!trimmed) {
      return null;
    }

    try {
      const value = parseEther(trimmed);
      return value > 0n ? value : null;
    } catch {
      return null;
    }
  }, [payArtistAmountEth]);
  const payArtistResolvedAddressTrimmed = payArtistResolvedAddress.trim();
  const payArtistAddressMissing = payArtistResolvedAddressTrimmed.length === 0;
  const payArtistAddressValid = isAddress(
    payArtistResolvedAddressTrimmed as `0x${string}`
  );
  const payArtistAddressError = getPayArtistAddressError({
    payArtistAddressHasEnsError,
    payArtistAddressMissing,
    payArtistAddressLoading,
    payArtistAddressValid,
  });

  return {
    artistAirdropSummary,
    teamAirdropSummary,
    subscriptionAirdropSections,
    mintingClaimActionsByName,
    headerStatus,
    mintTimeline,
    phaseData,
    selectedPhaseConfig,
    isMetadataOnlyUpdateMode,
    selectedPhaseActionLabel,
    claimWritePending,
    payArtistWritePending,
    launchActionPending,
    selectedPhaseDiffs,
    changedFieldBoxClassName,
    changedFieldBoxLabelClassName,
    selectedPhaseActionDisabled,
    isPublicPhaseSelected,
    showPhase0AirdropSections,
    claimTxModalClosable,
    payArtistTxModalClosable,
    totalMinted,
    cappedResearchTargetEditionSize,
    researchAirdropCount,
    payArtistAmountWei,
    payArtistResolvedAddressTrimmed,
    payArtistAddressMissing,
    payArtistAddressValid,
    payArtistAddressError,
  };
}
