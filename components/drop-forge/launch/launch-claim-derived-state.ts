import { parseEther } from "viem";
import { getClaimPrimaryStatus } from "@/components/drop-forge/drop-forge-status.helpers";
import {
  findBestMatchingLaunchActionName,
  getAnimationMimeType,
  getMediaTypeLabel,
  getResearchTargetEditionSizeLimit,
  getSafeExternalUrl,
  type LaunchPhaseKey,
  normalizeHexValue,
  parseLocalDateTimeToUnixSeconds,
} from "@/components/drop-forge/launch/drop-forge-launch-claim-page-client.helpers";
import { isMissingRequiredLaunchInfo } from "@/components/drop-forge/launch/launchClaimHelpers";
import { NULL_MERKLE } from "@/constants/constants";
import type { ApiMintingClaimAction } from "@/generated/models/ApiMintingClaimAction";
import type { MintingClaim } from "@/generated/models/MintingClaim";
import type { PhaseAirdrop } from "@/generated/models/PhaseAirdrop";
import type { ManifoldClaim } from "@/hooks/useManifoldClaim";

export type ClaimTxModalStatus =
  | "confirm_wallet"
  | "submitted"
  | "success"
  | "error";

export interface ClaimTxModalState {
  status: ClaimTxModalStatus;
  message?: string | undefined;
  txHash?: `0x${string}` | undefined;
  actionLabel?: string | undefined;
}

export const DEFAULT_PHASE_PRICE_ETH = "0.06529";
export type LaunchMediaTab = "image" | "animation";

export function formatEditableEthValue(
  value: number | null | undefined
): string {
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized < 0) {
    return "";
  }
  return normalized.toString();
}

interface SelectedPhaseComparableConfig {
  startDate: number | null;
  endDate: number | null;
  merkleRoot: string | null;
  costWei: bigint | null;
}

export function getClaimPresentationState({
  claim,
  manifoldClaim,
  onChainClaimFetching,
  activeMediaTab,
}: Readonly<{
  claim: MintingClaim | null;
  manifoldClaim: ManifoldClaim | null | undefined;
  onChainClaimFetching: boolean;
  activeMediaTab: LaunchMediaTab;
}>) {
  const metadataLocation = claim?.metadata_location;
  const hasPublishedMetadata =
    typeof metadataLocation === "string" && metadataLocation.trim() !== "";
  return {
    isInitialized: manifoldClaim?.instanceId != null,
    hasPublishedMetadata,
    missingRequiredInfo: Boolean(claim && isMissingRequiredLaunchInfo(claim)),
    researchTargetEditionSizeLimit: getResearchTargetEditionSizeLimit(
      claim?.edition_size,
      manifoldClaim?.totalMax
    ),
    primaryStatus: claim
      ? getClaimPrimaryStatus({
          claim,
          manifoldClaim: manifoldClaim ?? null,
          isCraftContext: false,
          isManifoldClaimFetching: onChainClaimFetching,
        })
      : null,
    hasImage: Boolean(claim?.image_url),
    hasAnimation: Boolean(claim?.animation_url),
    animationMimeType: claim ? getAnimationMimeType(claim) : null,
    activeMediaTypeLabel: claim
      ? getMediaTypeLabel(claim, activeMediaTab)
      : "—",
    safeClaimExternalUrl: claim ? getSafeExternalUrl(claim.external_url) : null,
  };
}

export function getSubscriptionAirdropSectionConfigs(
  selectedPhase: "" | LaunchPhaseKey
): Array<{ phaseKey: LaunchPhaseKey; title: string }> {
  if (selectedPhase === "phase0") {
    return [
      {
        phaseKey: "phase0",
        title: "Phase 0 Subscription Airdrops",
      },
    ];
  }

  if (selectedPhase === "phase1") {
    return [
      {
        phaseKey: "phase1",
        title: "Phase 1 Subscription Airdrops",
      },
    ];
  }

  if (selectedPhase === "phase2") {
    return [
      {
        phaseKey: "phase2",
        title: "Phase 2 Subscription Airdrops",
      },
      {
        phaseKey: "publicphase",
        title: "Public Phase Subscription Airdrops",
      },
    ];
  }

  return [];
}

export function getSubscriptionAirdropFetchState({
  selectedPhase,
  subscriptionAirdropsByPhase,
  subscriptionAirdropsLoadingByPhase,
}: Readonly<{
  selectedPhase: "" | LaunchPhaseKey;
  subscriptionAirdropsByPhase: Partial<Record<LaunchPhaseKey, PhaseAirdrop[]>>;
  subscriptionAirdropsLoadingByPhase: Partial<Record<LaunchPhaseKey, boolean>>;
}>) {
  return {
    selectedPhaseHasSubscriptionAirdrops: selectedPhase
      ? subscriptionAirdropsByPhase[selectedPhase] !== undefined
      : false,
    selectedPhaseSubscriptionAirdropsLoading: selectedPhase
      ? Boolean(subscriptionAirdropsLoadingByPhase[selectedPhase])
      : false,
    publicPhaseHasSubscriptionAirdrops:
      subscriptionAirdropsByPhase.publicphase !== undefined,
    publicPhaseSubscriptionAirdropsLoading: Boolean(
      subscriptionAirdropsLoadingByPhase.publicphase
    ),
  };
}

export function getLaunchActionCompletionState({
  mintingClaimActionsByName,
  availableMintingClaimActionNames,
}: Readonly<{
  mintingClaimActionsByName: Record<string, ApiMintingClaimAction>;
  availableMintingClaimActionNames: readonly string[];
}>) {
  const researchActionName = findBestMatchingLaunchActionName(
    availableMintingClaimActionNames,
    "research"
  );
  const payArtistActionName = findBestMatchingLaunchActionName(
    availableMintingClaimActionNames,
    "payartist"
  );

  return {
    researchAirdropCompleted: researchActionName
      ? mintingClaimActionsByName[researchActionName]?.completed === true
      : false,
    payArtistCompleted: payArtistActionName
      ? mintingClaimActionsByName[payArtistActionName]?.completed === true
      : false,
  };
}

export function getSelectedPhaseActionLabel(
  selectedPhase: "" | LaunchPhaseKey,
  isInitialized: boolean
): string {
  return selectedPhase === "phase0" && !isInitialized
    ? "Initialize On-Chain"
    : "Update On-Chain";
}

export function getSelectedPhaseIsUpdateAction(
  selectedPhaseConfig: {
    key: Exclude<LaunchPhaseKey, "research" | "payartist">;
  } | null,
  isInitialized: boolean
): boolean {
  return Boolean(
    selectedPhaseConfig &&
    !(selectedPhaseConfig.key === "phase0" && !isInitialized)
  );
}

export function getPayArtistAddressError({
  payArtistAddressHasEnsError,
  payArtistAddressMissing,
  payArtistAddressLoading,
  payArtistAddressValid,
}: Readonly<{
  payArtistAddressHasEnsError: boolean;
  payArtistAddressMissing: boolean;
  payArtistAddressLoading: boolean;
  payArtistAddressValid: boolean;
}>): string | null {
  if (payArtistAddressHasEnsError) {
    return "Could not resolve ENS name";
  }

  if (
    !payArtistAddressMissing &&
    !payArtistAddressLoading &&
    !payArtistAddressValid
  ) {
    return "Enter a valid address or ENS";
  }

  return null;
}

export function getActiveTxModalState({
  payArtistTxModal,
  claimTxModal,
  payArtistTxModalClosable,
  claimTxModalClosable,
  closePayArtistTxModal,
  closeClaimTxModal,
}: Readonly<{
  payArtistTxModal: ClaimTxModalState | null;
  claimTxModal: ClaimTxModalState | null;
  payArtistTxModalClosable: boolean;
  claimTxModalClosable: boolean;
  closePayArtistTxModal: () => void;
  closeClaimTxModal: () => void;
}>): {
  activeTxModal: ClaimTxModalState | null;
  activeTxModalClosable: boolean;
  closeActiveTxModal: () => void;
} {
  if (payArtistTxModal) {
    return {
      activeTxModal: payArtistTxModal,
      activeTxModalClosable: payArtistTxModalClosable,
      closeActiveTxModal: closePayArtistTxModal,
    };
  }

  return {
    activeTxModal: claimTxModal,
    activeTxModalClosable: claimTxModalClosable,
    closeActiveTxModal: closeClaimTxModal,
  };
}

export function getMintingClaimActionViewState(
  isClaimsAdmin: boolean,
  mintingClaimActionsByName: Record<string, ApiMintingClaimAction>,
  mintingClaimActionPending: string | null
): {
  mintingClaimActionsByName: Record<string, ApiMintingClaimAction>;
  mintingClaimActionPending: string | null;
} {
  if (!isClaimsAdmin) {
    return {
      mintingClaimActionsByName: {},
      mintingClaimActionPending: null,
    };
  }

  return {
    mintingClaimActionsByName,
    mintingClaimActionPending,
  };
}

export function getSelectedPhaseComparableConfig({
  selectedPhaseConfig,
  phaseAllowlistWindows,
  phasePricesEth,
}: Readonly<{
  selectedPhaseConfig: {
    key: Exclude<LaunchPhaseKey, "research" | "payartist">;
    root?: {
      merkle_root?: string | null;
    } | null;
  } | null;
  phaseAllowlistWindows: Record<string, { start: string; end: string }>;
  phasePricesEth: Record<string, string>;
}>): SelectedPhaseComparableConfig | null {
  if (!selectedPhaseConfig) {
    return null;
  }

  const phaseKey = selectedPhaseConfig.key;
  const startInput = phaseAllowlistWindows[phaseKey]?.start ?? "";
  const endInput = phaseAllowlistWindows[phaseKey]?.end ?? "";
  const startDate = parseLocalDateTimeToUnixSeconds(startInput);
  const endDate = parseLocalDateTimeToUnixSeconds(endInput);
  const merkleRoot =
    phaseKey === "publicphase"
      ? NULL_MERKLE
      : (selectedPhaseConfig.root?.merkle_root ?? null);
  const costEth = (phasePricesEth[phaseKey] ?? DEFAULT_PHASE_PRICE_ETH).trim();

  let costWei: bigint | null = null;
  try {
    costWei = parseEther(costEth);
  } catch {
    costWei = null;
  }

  return {
    startDate,
    endDate,
    merkleRoot,
    costWei,
  };
}

export function getSelectedPhaseMatchesOnChainConfig({
  selectedPhaseIsUpdateAction,
  selectedPhaseComparableConfig,
  claim,
  manifoldClaim,
  isInitialized,
}: Readonly<{
  selectedPhaseIsUpdateAction: boolean;
  selectedPhaseComparableConfig: SelectedPhaseComparableConfig | null;
  claim: MintingClaim | null;
  manifoldClaim: ManifoldClaim | null | undefined;
  isInitialized: boolean;
}>): boolean {
  if (
    !selectedPhaseIsUpdateAction ||
    !selectedPhaseComparableConfig ||
    !claim ||
    !manifoldClaim ||
    !isInitialized
  ) {
    return false;
  }

  if (
    claim.edition_size == null ||
    selectedPhaseComparableConfig.startDate == null ||
    selectedPhaseComparableConfig.endDate == null ||
    selectedPhaseComparableConfig.merkleRoot == null ||
    selectedPhaseComparableConfig.costWei == null ||
    manifoldClaim.costWei == null ||
    manifoldClaim.merkleRoot == null
  ) {
    return false;
  }

  return (
    claim.edition_size === manifoldClaim.totalMax &&
    selectedPhaseComparableConfig.startDate === manifoldClaim.startDate &&
    selectedPhaseComparableConfig.endDate === manifoldClaim.endDate &&
    selectedPhaseComparableConfig.costWei === manifoldClaim.costWei &&
    normalizeHexValue(selectedPhaseComparableConfig.merkleRoot) ===
      normalizeHexValue(manifoldClaim.merkleRoot)
  );
}

export function getSelectedPhaseDiffs({
  selectedPhaseIsUpdateAction,
  selectedPhaseComparableConfig,
  claim,
  manifoldClaim,
  isInitialized,
}: Readonly<{
  selectedPhaseIsUpdateAction: boolean;
  selectedPhaseComparableConfig: SelectedPhaseComparableConfig | null;
  claim: MintingClaim | null;
  manifoldClaim: ManifoldClaim | null | undefined;
  isInitialized: boolean;
}>): {
  editionSize: boolean;
  cost: boolean;
  merkleRoot: boolean;
  startDate: boolean;
  endDate: boolean;
} {
  if (
    !selectedPhaseIsUpdateAction ||
    !selectedPhaseComparableConfig ||
    !claim ||
    !manifoldClaim ||
    !isInitialized
  ) {
    return {
      editionSize: false,
      cost: false,
      merkleRoot: false,
      startDate: false,
      endDate: false,
    };
  }

  return {
    editionSize:
      claim.edition_size != null && manifoldClaim.totalMax != null
        ? claim.edition_size !== manifoldClaim.totalMax
        : false,
    cost:
      selectedPhaseComparableConfig.costWei != null &&
      manifoldClaim.costWei != null
        ? selectedPhaseComparableConfig.costWei !== manifoldClaim.costWei
        : false,
    merkleRoot:
      selectedPhaseComparableConfig.merkleRoot != null &&
      manifoldClaim.merkleRoot != null
        ? normalizeHexValue(selectedPhaseComparableConfig.merkleRoot) !==
          normalizeHexValue(manifoldClaim.merkleRoot)
        : false,
    startDate:
      selectedPhaseComparableConfig.startDate != null &&
      manifoldClaim.startDate != null
        ? selectedPhaseComparableConfig.startDate !== manifoldClaim.startDate
        : false,
    endDate:
      selectedPhaseComparableConfig.endDate != null &&
      manifoldClaim.endDate != null
        ? selectedPhaseComparableConfig.endDate !== manifoldClaim.endDate
        : false,
  };
}

export function getSelectedPhaseActionDisabled({
  launchActionPending,
  selectedPhaseConfig,
  isInitialized,
  missingRequiredInfo,
  selectedPhaseIsUpdateAction,
  selectedPhaseMatchesOnChainConfig,
}: Readonly<{
  launchActionPending: boolean;
  selectedPhaseConfig: {
    key: Exclude<LaunchPhaseKey, "research" | "payartist">;
    root?: unknown;
  } | null;
  isInitialized: boolean;
  missingRequiredInfo: boolean;
  selectedPhaseIsUpdateAction: boolean;
  selectedPhaseMatchesOnChainConfig: boolean;
}>): boolean {
  const missingPhaseConfig = (() => {
    if (launchActionPending || !selectedPhaseConfig) {
      return true;
    }

    if (selectedPhaseConfig.key === "phase0") {
      if (!isInitialized) {
        return !selectedPhaseConfig.root || missingRequiredInfo;
      }
      return !selectedPhaseConfig.root;
    }

    if (selectedPhaseConfig.key === "publicphase") {
      return !isInitialized;
    }

    return !isInitialized || !selectedPhaseConfig.root;
  })();

  return (
    missingPhaseConfig ||
    (selectedPhaseIsUpdateAction && selectedPhaseMatchesOnChainConfig)
  );
}

export function getSelectedPhaseFormValues({
  selectedPhase,
  phasePricesEth,
  phaseAllowlistWindows,
}: Readonly<{
  selectedPhase: "" | LaunchPhaseKey;
  phasePricesEth: Record<string, string>;
  phaseAllowlistWindows: Record<string, { start: string; end: string }>;
}>): {
  selectedPhasePriceValue: string;
  selectedPhaseWindowStartValue: string;
  selectedPhaseWindowEndValue: string;
} {
  if (!selectedPhase) {
    return {
      selectedPhasePriceValue: "",
      selectedPhaseWindowStartValue: "",
      selectedPhaseWindowEndValue: "",
    };
  }

  return {
    selectedPhasePriceValue: phasePricesEth[selectedPhase] ?? "",
    selectedPhaseWindowStartValue:
      phaseAllowlistWindows[selectedPhase]?.start ?? "",
    selectedPhaseWindowEndValue:
      phaseAllowlistWindows[selectedPhase]?.end ?? "",
  };
}

export function runSelectedPhaseClaimAction({
  selectedPhaseConfig,
  isInitialized,
  runClaimWriteForPhase,
}: Readonly<{
  selectedPhaseConfig: {
    key: Exclude<LaunchPhaseKey, "research" | "payartist">;
  } | null;
  isInitialized: boolean;
  runClaimWriteForPhase: (args: {
    phaseKey: LaunchPhaseKey;
    forceAction?: "initialize" | "update";
  }) => void;
}>) {
  if (!selectedPhaseConfig) return;
  runClaimWriteForPhase({
    phaseKey: selectedPhaseConfig.key,
    forceAction:
      selectedPhaseConfig.key === "phase0" && !isInitialized
        ? "initialize"
        : "update",
  });
}
