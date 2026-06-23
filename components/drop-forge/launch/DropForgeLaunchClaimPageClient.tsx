"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isAddress, parseEther } from "viem";
import {
  useSendTransaction,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { MEMES_MANIFOLD_PROXY_ABI } from "@/abis/abis";
import { useAuth } from "@/components/auth/Auth";
import { useDropForgeMintingConfig } from "@/components/drop-forge/drop-forge-config";
import { getClaimPrimaryStatus } from "@/components/drop-forge/drop-forge-status.helpers";
import ClaimTransactionModal from "@/components/drop-forge/launch/ClaimTransactionModal";
import {
  buildSubscriptionAirdropSelection,
  clampResearchTargetEditionSize,
  findBestMatchingLaunchActionName,
  formatDateTimeLocalInput,
  getAutoSelectedLaunchPhase,
  getAnimationMimeType,
  getDefaultResearchTargetEditionSize,
  getErrorMessage,
  getLaunchListStatus,
  getMediaTypeLabel,
  getResearchTargetEditionSizeLimit,
  getRootForPhase,
  getSafeExternalUrl,
  getSubscriptionPhaseName,
  type LaunchPhaseKey,
  isNotFoundError,
  mergeAirdropsByWallet,
  normalizeHexValue,
  parseLocalDateTimeToUnixSeconds,
  summarizeAirdrops,
} from "@/components/drop-forge/launch/drop-forge-launch-claim-page-client.helpers";
import { isMissingRequiredLaunchInfo } from "@/components/drop-forge/launch/launchClaimHelpers";
import {
  DropForgeLaunchClaimPageView,
  DropForgeLaunchClaimPermissionFallbackView,
} from "@/components/drop-forge/launch/DropForgeLaunchClaimPageClient.view";
import { getMintTimelineDetails as getClaimTimelineDetails } from "@/components/meme-calendar/meme-calendar.helpers";
import {
  MANIFOLD_LAZY_CLAIM_CONTRACT,
  MEMES_CONTRACT,
  MEMES_DEPLOYER,
  NULL_ADDRESS,
  NULL_MERKLE,
  RESEARCH_AIRDROP_ADDRESS,
} from "@/constants/constants";
import type { ApiMemesMintStat } from "@/generated/models/ApiMemesMintStat";
import type { ApiMintingClaimAction } from "@/generated/models/ApiMintingClaimAction";
import type { ApiMintingClaimActionsResponse } from "@/generated/models/ApiMintingClaimActionsResponse";
import type { MintingClaim } from "@/generated/models/MintingClaim";
import type { MintingClaimsRootItem } from "@/generated/models/MintingClaimsRootItem";
import type { PhaseAirdrop } from "@/generated/models/PhaseAirdrop";
import { Time } from "@/helpers/time";
import { useDropForgeManifoldClaim } from "@/hooks/useDropForgeManifoldClaim";
import { useDropForgePermissions } from "@/hooks/useDropForgePermissions";
import { buildMemesPhases as buildClaimPhases } from "@/hooks/useManifoldClaim";
import {
  getClaim,
  getMemesMintStat,
  getMemesMintingClaimActions,
  getMemesMintingClaimActionTypes,
  getMemesMintingRoots as getClaimRoots,
  getDistributionAirdropsArtist,
  getDistributionAirdropsTeam,
  getFinalSubscriptionsByPhase,
  upsertMemesMintingClaimAction,
} from "@/services/api/memes-minting-claims-api";
import { getAuthJwt } from "@/services/auth/auth.utils";

interface DropForgeLaunchClaimPageClientProps {
  claimId: number;
}
type ClaimTxModalStatus = "confirm_wallet" | "submitted" | "success" | "error";

interface ClaimTxModalState {
  status: ClaimTxModalStatus;
  message?: string | undefined;
  txHash?: `0x${string}` | undefined;
  actionLabel?: string | undefined;
}

const DEFAULT_PHASE_PRICE_ETH = "0.06529";
type LaunchMediaTab = "image" | "animation";

function formatEditableEthValue(value: number | null | undefined): string {
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

function getClaimPresentationState({
  claim,
  manifoldClaim,
  onChainClaimFetching,
  activeMediaTab,
}: Readonly<{
  claim: MintingClaim | null;
  manifoldClaim: ReturnType<typeof useDropForgeManifoldClaim>["claim"];
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

function getSubscriptionAirdropSectionConfigs(
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

function getSubscriptionAirdropFetchState({
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

function getLaunchActionCompletionState({
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

function getSelectedPhaseActionLabel(
  selectedPhase: "" | LaunchPhaseKey,
  isInitialized: boolean
): string {
  return selectedPhase === "phase0" && !isInitialized
    ? "Initialize On-Chain"
    : "Update On-Chain";
}

function getSelectedPhaseIsUpdateAction(
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

function getPayArtistAddressError({
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

function getActiveTxModalState({
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

function getMintingClaimActionViewState(
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

function getSelectedPhaseComparableConfig({
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

function getSelectedPhaseMatchesOnChainConfig({
  selectedPhaseIsUpdateAction,
  selectedPhaseComparableConfig,
  claim,
  manifoldClaim,
  isInitialized,
}: Readonly<{
  selectedPhaseIsUpdateAction: boolean;
  selectedPhaseComparableConfig: SelectedPhaseComparableConfig | null;
  claim: MintingClaim | null;
  manifoldClaim: ReturnType<typeof useDropForgeManifoldClaim>["claim"];
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

function getSelectedPhaseDiffs({
  selectedPhaseIsUpdateAction,
  selectedPhaseComparableConfig,
  claim,
  manifoldClaim,
  isInitialized,
}: Readonly<{
  selectedPhaseIsUpdateAction: boolean;
  selectedPhaseComparableConfig: SelectedPhaseComparableConfig | null;
  claim: MintingClaim | null;
  manifoldClaim: ReturnType<typeof useDropForgeManifoldClaim>["claim"];
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

function getSelectedPhaseActionDisabled({
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

function getSelectedPhaseFormValues({
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

function runSelectedPhaseClaimAction({
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

export default function DropForgeLaunchClaimPageClient({
  claimId,
}: Readonly<DropForgeLaunchClaimPageClientProps>) {
  const pageTitle = `Launch Claim #${claimId}`;
  const { requestAuth, setToast } = useAuth();
  const { contract: forgeMintingContract, chain: forgeMintingChain } =
    useDropForgeMintingConfig();
  const { hasWallet, permissionsLoading, canAccessLaunchPage, isClaimsAdmin } =
    useDropForgePermissions();
  const claimWrite = useWriteContract();
  const payArtistWrite = useSendTransaction();
  const waitClaimWrite = useWaitForTransactionReceipt({
    chainId: forgeMintingChain.id,
    confirmations: 1,
    hash: claimWrite.data,
  });
  const waitPayArtistWrite = useWaitForTransactionReceipt({
    chainId: forgeMintingChain.id,
    confirmations: 1,
    hash: payArtistWrite.data,
  });
  const [onChainClaimSpinnerVisible, setOnChainClaimSpinnerVisible] =
    useState(false);
  const {
    claim: manifoldClaim,
    isFetching: onChainClaimFetching,
    refetch: refetchOnChainClaim,
  } = useDropForgeManifoldClaim(claimId);
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

  const runClaimWriteForPhase = useCallback(
    ({
      phaseKey,
      forceAction,
    }: {
      phaseKey: LaunchPhaseKey;
      forceAction?: "initialize" | "update";
    }) => {
      if (!claim) {
        setToast({
          message: "Claim details are not loaded yet.",
          type: "error",
        });
        return;
      }
      if (claim.edition_size == null || claim.edition_size <= 0) {
        setToast({
          message: "Enter a valid edition size.",
          type: "error",
        });
        return;
      }
      if (!claim.metadata_location) {
        setToast({
          message: "Add a metadata location before continuing.",
          type: "error",
        });
        return;
      }

      const phase = phaseData.find((item) => item.key === phaseKey);
      if (!phase) {
        setToast({
          message: "Phase configuration was not found.",
          type: "error",
        });
        return;
      }

      const startInput = phaseAllowlistWindows[phaseKey]?.start ?? "";
      const endInput = phaseAllowlistWindows[phaseKey]?.end ?? "";
      const startDate = parseLocalDateTimeToUnixSeconds(startInput);
      const endDate = parseLocalDateTimeToUnixSeconds(endInput);
      if (startDate == null || endDate == null) {
        setToast({
          message: "Enter valid local start and end dates.",
          type: "error",
        });
        return;
      }
      if (endDate <= startDate) {
        setToast({
          message: "Set the phase end after the phase start.",
          type: "error",
        });
        return;
      }

      const merkleRoot =
        phaseKey === "publicphase"
          ? NULL_MERKLE
          : (phase.root?.merkle_root ?? null);
      if (!merkleRoot) {
        setToast({
          message: "Add the Merkle root for this phase before continuing.",
          type: "error",
        });
        return;
      }

      const priceEth = (
        phasePricesEth[phaseKey] ?? DEFAULT_PHASE_PRICE_ETH
      ).trim();
      let cost: bigint;
      try {
        cost = parseEther(priceEth);
      } catch {
        setToast({ message: "Enter a valid ETH cost.", type: "error" });
        return;
      }

      const claimParameters = [
        claim.edition_size,
        0,
        startDate,
        endDate,
        2,
        merkleRoot,
        claim.metadata_location,
        cost,
        MEMES_DEPLOYER,
        NULL_ADDRESS,
        NULL_ADDRESS,
      ] as const;

      const action =
        forceAction ??
        (phaseKey === "phase0" && !isInitialized ? "initialize" : "update");
      const actionLabel =
        action === "initialize" ? "Initialize Claim" : "Update Claim";
      const functionName =
        action === "initialize" ? "initializeClaim" : "updateClaim";

      setClaimTxModal({
        status: "confirm_wallet",
        actionLabel,
      });
      pendingMintingClaimActionRef.current = null;
      try {
        claimWrite.writeContract({
          address: MANIFOLD_LAZY_CLAIM_CONTRACT as `0x${string}`,
          abi: MEMES_MANIFOLD_PROXY_ABI,
          chainId: forgeMintingChain.id,
          functionName,
          args: [forgeMintingContract, BigInt(claimId), claimParameters],
        });
      } catch (error) {
        pendingMintingClaimActionRef.current = null;
        setClaimTxModal({
          status: "error",
          message: getErrorMessage(error, "Failed to submit transaction"),
          actionLabel,
        });
      }
    },
    [
      claim,
      phaseData,
      phaseAllowlistWindows,
      phasePricesEth,
      isInitialized,
      claimWrite,
      forgeMintingChain.id,
      forgeMintingContract,
      claimId,
      setToast,
    ]
  );

  const runAirdropWrite = useCallback(
    ({
      entries,
      actionLabel,
      mintingClaimAction,
    }: {
      entries: PhaseAirdrop[] | null;
      actionLabel:
        | "Airdrop Artist"
        | "Airdrop Team"
        | "Airdrop Subscriptions"
        | "Airdrop to Research";
      mintingClaimAction?: string | null;
    }) => {
      if (!isInitialized) {
        setToast({
          message: "Initialize this claim before airdropping.",
          type: "error",
        });
        return;
      }

      if (!entries || entries.length === 0) {
        setToast({
          message: `${actionLabel} has no recipients`,
          type: "error",
        });
        return;
      }

      const parsedEntries = entries
        .map((entry) => ({
          wallet: (entry.wallet ?? "").trim(),
          amount: Number(entry.amount ?? 0),
        }))
        .filter(
          (entry) =>
            isAddress(entry.wallet as `0x${string}`) &&
            Number.isFinite(entry.amount) &&
            Number.isInteger(entry.amount) &&
            entry.amount > 0
        );

      if (parsedEntries.length === 0) {
        setToast({
          message: `${actionLabel} has no valid recipients/amounts`,
          type: "error",
        });
        return;
      }

      const recipients = parsedEntries.map(
        (entry) => entry.wallet as `0x${string}`
      );
      const amounts = parsedEntries.map((entry) => BigInt(entry.amount));

      setClaimTxModal({
        status: "confirm_wallet",
        actionLabel,
      });
      pendingMintingClaimActionRef.current = mintingClaimAction ?? null;

      try {
        claimWrite.writeContract({
          address: MANIFOLD_LAZY_CLAIM_CONTRACT as `0x${string}`,
          abi: MEMES_MANIFOLD_PROXY_ABI,
          chainId: forgeMintingChain.id,
          functionName: "airdrop",
          args: [forgeMintingContract, BigInt(claimId), recipients, amounts],
        });
      } catch (error) {
        pendingMintingClaimActionRef.current = null;
        setClaimTxModal({
          status: "error",
          message: getErrorMessage(error, "Failed to submit transaction"),
          actionLabel,
        });
      }
    },
    [
      isInitialized,
      setToast,
      claimWrite,
      forgeMintingChain.id,
      forgeMintingContract,
      claimId,
    ]
  );
  const runResearchAirdropWrite = useCallback(
    (mintingClaimAction: string | null) => {
      if (!isInitialized) {
        setToast({
          message: "Initialize this claim before airdropping.",
          type: "error",
        });
        return;
      }
      if (researchAirdropCount <= 0) {
        setToast({
          message: "No research airdrop is needed.",
          type: "error",
        });
        return;
      }

      runAirdropWrite({
        entries: [
          { wallet: RESEARCH_AIRDROP_ADDRESS, amount: researchAirdropCount },
        ],
        actionLabel: "Airdrop to Research",
        mintingClaimAction,
      });
    },
    [isInitialized, researchAirdropCount, runAirdropWrite, setToast]
  );
  const runPayArtistWrite = useCallback(
    (mintingClaimAction: string | null) => {
      if (payArtistAddressLoading) {
        setToast({
          message: "Wait for the payment address to finish resolving.",
          type: "error",
        });
        return;
      }
      if (!payArtistAmountEth.trim() || payArtistAmountWei == null) {
        setToast({
          message: "Enter a valid artist payment in ETH.",
          type: "error",
        });
        return;
      }
      if (payArtistAddressHasEnsError) {
        setToast({
          message: "Couldn't resolve the payment address ENS.",
          type: "error",
        });
        return;
      }
      if (!payArtistResolvedAddressTrimmed) {
        setToast({
          message: "Enter a payment address.",
          type: "error",
        });
        return;
      }
      if (!payArtistAddressValid) {
        setToast({
          message: "Enter a valid payment address.",
          type: "error",
        });
        return;
      }

      setPayArtistTxModal({
        status: "confirm_wallet",
        actionLabel: "Pay Artist",
      });
      pendingPayArtistMintingClaimActionRef.current =
        mintingClaimAction ?? null;
      payArtistWrite.reset();

      try {
        payArtistWrite.sendTransaction({
          chainId: forgeMintingChain.id,
          to: payArtistResolvedAddressTrimmed as `0x${string}`,
          value: payArtistAmountWei,
        });
      } catch (error) {
        pendingPayArtistMintingClaimActionRef.current = null;
        setPayArtistTxModal({
          status: "error",
          message: getErrorMessage(error, "Failed to submit transaction"),
          actionLabel: "Pay Artist",
        });
      }
    },
    [
      payArtistAmountEth,
      payArtistAmountWei,
      payArtistAddressLoading,
      payArtistAddressHasEnsError,
      payArtistResolvedAddressTrimmed,
      payArtistAddressValid,
      setToast,
      payArtistWrite,
      forgeMintingChain.id,
    ]
  );

  const handleSelectedPhaseChange = useCallback((value: LaunchPhaseKey) => {
    setIsPhaseSelectionManual(true);
    setSelectedPhase(value);
  }, []);

  const handleResearchTargetEditionSizeChange = useCallback(
    (value: string) => {
      const parsed = Number(value);
      const editionSizeLimit = getResearchTargetEditionSizeLimit(
        claim?.edition_size,
        manifoldClaim?.totalMax
      );
      if (
        editionSizeLimit != null &&
        Number.isFinite(parsed) &&
        parsed > editionSizeLimit
      ) {
        setResearchTargetEditionSize(editionSizeLimit);
        setToast({
          message: `Target edition size cannot exceed claim max (${editionSizeLimit})`,
          type: "error",
        });
        return;
      }

      setResearchTargetEditionSize(
        clampResearchTargetEditionSize(
          Number.isFinite(parsed) && parsed >= 0 ? parsed : 0,
          claim?.edition_size,
          manifoldClaim?.totalMax
        )
      );
    },
    [claim?.edition_size, manifoldClaim?.totalMax, setToast]
  );

  const handleSelectedPhasePriceChange = useCallback(
    (value: string) => {
      if (!selectedPhase) return;
      setPhasePricesEth((prev) => ({
        ...prev,
        [selectedPhase]: value,
      }));
    },
    [selectedPhase]
  );
  const handlePayArtistAmountChange = useCallback((value: string) => {
    setPayArtistAmountEth(value);
  }, []);

  const handleSelectedPhaseStartChange = useCallback(
    (value: string) => {
      if (!selectedPhase) return;
      setPhaseAllowlistWindows((prev) => ({
        ...prev,
        [selectedPhase]: {
          start: value,
          end: prev[selectedPhase]?.end ?? "",
        },
      }));
    },
    [selectedPhase]
  );

  const handleSelectedPhaseEndChange = useCallback(
    (value: string) => {
      if (!selectedPhase) return;
      setPhaseAllowlistWindows((prev) => ({
        ...prev,
        [selectedPhase]: {
          start: prev[selectedPhase]?.start ?? "",
          end: value,
        },
      }));
    },
    [selectedPhase]
  );

  const handleSelectedPhaseAction = useCallback(() => {
    runSelectedPhaseClaimAction({
      selectedPhaseConfig,
      isInitialized,
      runClaimWriteForPhase,
    });
  }, [selectedPhaseConfig, runClaimWriteForPhase, isInitialized]);
  const {
    selectedPhasePriceValue,
    selectedPhaseWindowStartValue,
    selectedPhaseWindowEndValue,
  } = getSelectedPhaseFormValues({
    selectedPhase,
    phasePricesEth,
    phaseAllowlistWindows,
  });

  useEffect(() => {
    if (claimWrite.error) {
      pendingMintingClaimActionRef.current = null;
      setClaimTxModal((prev) => ({
        status: "error",
        message: getErrorMessage(
          claimWrite.error,
          "Failed to submit transaction"
        ),
        txHash: prev?.txHash,
        actionLabel: prev?.actionLabel,
      }));
    }
  }, [claimWrite.error]);

  useEffect(() => {
    if (payArtistWrite.error) {
      pendingPayArtistMintingClaimActionRef.current = null;
      setPayArtistTxModal((prev) => ({
        status: "error",
        message: getErrorMessage(
          payArtistWrite.error,
          "Failed to submit transaction"
        ),
        txHash: prev?.txHash,
        actionLabel: prev?.actionLabel,
      }));
    }
  }, [payArtistWrite.error]);

  useEffect(() => {
    const txHash = claimWrite.data;
    if (!txHash) return;
    setClaimTxModal((prev) => ({
      status: "submitted",
      message: prev?.message,
      txHash,
      actionLabel: prev?.actionLabel,
    }));
  }, [claimWrite.data]);

  useEffect(() => {
    const txHash = payArtistWrite.data;
    if (!txHash) return;
    setPayArtistTxModal((prev) => ({
      status: "submitted",
      message: prev?.message,
      txHash,
      actionLabel: prev?.actionLabel,
    }));
  }, [payArtistWrite.data]);

  useEffect(() => {
    const txHash = claimWrite.data;
    if (!txHash || !waitClaimWrite.isSuccess) return;
    if (handledClaimWriteSuccessTxHashRef.current === txHash) return;
    handledClaimWriteSuccessTxHashRef.current = txHash;
    const pendingMintingClaimAction = pendingMintingClaimActionRef.current;
    pendingMintingClaimActionRef.current = null;
    refetchOnChainClaim().catch(() => undefined);
    setClaimTxModal((prev) => ({
      status: "success",
      txHash,
      actionLabel: prev?.actionLabel,
    }));
    if (pendingMintingClaimAction) {
      updateMintingClaimAction({
        action: pendingMintingClaimAction,
        completed: true,
      }).catch(() => undefined);
    }
  }, [
    claimWrite.data,
    waitClaimWrite.isSuccess,
    refetchOnChainClaim,
    updateMintingClaimAction,
  ]);

  useEffect(() => {
    const txHash = payArtistWrite.data;
    if (!txHash || !waitPayArtistWrite.isSuccess) return;
    if (handledPayArtistWriteSuccessTxHashRef.current === txHash) return;
    handledPayArtistWriteSuccessTxHashRef.current = txHash;
    const pendingMintingClaimAction =
      pendingPayArtistMintingClaimActionRef.current;
    pendingPayArtistMintingClaimActionRef.current = null;
    setPayArtistTxModal((prev) => ({
      status: "success",
      txHash,
      actionLabel: prev?.actionLabel,
    }));
    if (pendingMintingClaimAction) {
      updateMintingClaimAction({
        action: pendingMintingClaimAction,
        completed: true,
      }).catch(() => undefined);
    }
  }, [
    payArtistWrite.data,
    waitPayArtistWrite.isSuccess,
    updateMintingClaimAction,
  ]);

  useEffect(() => {
    const txHash = claimWrite.data;
    if (!txHash || !waitClaimWrite.error) return;
    if (handledClaimWriteErrorTxHashRef.current === txHash) return;
    handledClaimWriteErrorTxHashRef.current = txHash;
    pendingMintingClaimActionRef.current = null;
    setClaimTxModal((prev) => ({
      status: "error",
      txHash,
      message: getErrorMessage(waitClaimWrite.error, "Transaction failed"),
      actionLabel: prev?.actionLabel,
    }));
  }, [claimWrite.data, waitClaimWrite.error]);

  useEffect(() => {
    const txHash = payArtistWrite.data;
    if (!txHash || !waitPayArtistWrite.error) return;
    if (handledPayArtistWriteErrorTxHashRef.current === txHash) return;
    handledPayArtistWriteErrorTxHashRef.current = txHash;
    pendingPayArtistMintingClaimActionRef.current = null;
    setPayArtistTxModal((prev) => ({
      status: "error",
      txHash,
      message: getErrorMessage(waitPayArtistWrite.error, "Transaction failed"),
      actionLabel: prev?.actionLabel,
    }));
  }, [payArtistWrite.data, waitPayArtistWrite.error]);

  if (shouldShowPermissionFallback) {
    return (
      <DropForgeLaunchClaimPermissionFallbackView
        pageTitle={pageTitle}
        permissionsLoading={permissionsLoading}
        hasWallet={hasWallet}
        canAccessLaunchPage={canAccessLaunchPage}
      />
    );
  }

  return (
    <>
      <DropForgeLaunchClaimPageView
        pageTitle={pageTitle}
        craftHref={`/drop-forge/craft/${claimId}`}
        loading={loading}
        error={error}
        rootsError={rootsError}
        claim={claim}
        claimId={claimId}
        mintTimeline={mintTimeline}
        headerStatus={headerStatus}
        primaryStatus={primaryStatus}
        hasImage={hasImage}
        hasAnimation={hasAnimation}
        activeMediaTab={activeMediaTab}
        setActiveMediaTab={setActiveMediaTab}
        animationMimeType={animationMimeType}
        activeMediaTypeLabel={activeMediaTypeLabel}
        safeClaimExternalUrl={safeClaimExternalUrl}
        isInitialized={isInitialized}
        onChainClaimSpinnerVisible={onChainClaimSpinnerVisible}
        manifoldClaim={manifoldClaim ?? null}
        hasPublishedMetadata={hasPublishedMetadata}
        isMetadataOnlyUpdateMode={isMetadataOnlyUpdateMode}
        claimWritePending={claimWritePending}
        runMetadataLocationOnlyUpdate={runMetadataLocationOnlyUpdate}
        selectedPhase={selectedPhase}
        onSelectedPhaseChange={handleSelectedPhaseChange}
        totalMinted={totalMinted}
        researchTargetEditionSize={cappedResearchTargetEditionSize}
        researchTargetEditionSizeMax={researchTargetEditionSizeLimit}
        onResearchTargetEditionSizeChange={
          handleResearchTargetEditionSizeChange
        }
        researchAirdropCount={researchAirdropCount}
        runResearchAirdropWrite={runResearchAirdropWrite}
        mintStat={mintStat}
        mintStatLoading={mintStatLoading}
        mintStatError={mintStatError}
        payArtistAmountEth={payArtistAmountEth}
        onPayArtistAmountChange={handlePayArtistAmountChange}
        payArtistAddressInput={payArtistAddressInput}
        payArtistAddressLoading={payArtistAddressLoading}
        payArtistAddressMissing={payArtistAddressMissing}
        payArtistAddressError={payArtistAddressError}
        onPayArtistResolvedAddressChange={setPayArtistResolvedAddress}
        onPayArtistAddressLoadingChange={setPayArtistAddressLoading}
        onPayArtistAddressEnsErrorChange={setPayArtistAddressHasEnsError}
        payArtistActionDisabled={
          launchActionPending ||
          mintingClaimActionPending !== null ||
          mintStatLoading ||
          !!mintStatError ||
          payArtistAddressLoading ||
          !payArtistAddressValid ||
          payArtistAmountWei == null
        }
        payArtistWritePending={payArtistWritePending}
        runPayArtistWrite={runPayArtistWrite}
        selectedPhaseDiffs={selectedPhaseDiffs}
        changedFieldBoxClassName={changedFieldBoxClassName}
        changedFieldBoxLabelClassName={changedFieldBoxLabelClassName}
        selectedPhasePriceValue={selectedPhasePriceValue}
        onSelectedPhasePriceChange={handleSelectedPhasePriceChange}
        isPublicPhaseSelected={isPublicPhaseSelected}
        rootsLoading={rootsLoading}
        selectedPhaseConfig={selectedPhaseConfig}
        selectedPhaseWindowStartValue={selectedPhaseWindowStartValue}
        selectedPhaseWindowEndValue={selectedPhaseWindowEndValue}
        onSelectedPhaseStartChange={handleSelectedPhaseStartChange}
        onSelectedPhaseEndChange={handleSelectedPhaseEndChange}
        selectedPhaseActionDisabled={selectedPhaseActionDisabled}
        onSelectedPhaseAction={handleSelectedPhaseAction}
        selectedPhaseActionLabel={selectedPhaseActionLabel}
        showPhase0AirdropSections={showPhase0AirdropSections}
        phase0AirdropsError={phase0AirdropsError}
        phase0AirdropsLoading={phase0AirdropsLoading}
        artistAirdropSummary={artistAirdropSummary}
        teamAirdropSummary={teamAirdropSummary}
        artistAirdrops={artistAirdrops}
        teamAirdrops={teamAirdrops}
        runAirdropWrite={runAirdropWrite}
        subscriptionAirdropSections={subscriptionAirdropSections}
        mintingClaimActionsByName={
          mintingClaimActionViewState.mintingClaimActionsByName
        }
        mintingClaimActionPending={
          mintingClaimActionViewState.mintingClaimActionPending
        }
        onMintingClaimActionToggle={handleMintingClaimActionToggle}
      />
      <ClaimTransactionModal
        state={activeTxModal}
        chain={forgeMintingChain}
        onClose={closeActiveTxModal}
      />
    </>
  );
}
