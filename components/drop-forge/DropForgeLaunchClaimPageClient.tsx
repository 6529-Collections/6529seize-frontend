"use client";

import { MEMES_MANIFOLD_PROXY_ABI } from "@/abis/abis";
import { useAuth } from "@/components/auth/Auth";
import DropForgeLaunchIcon from "@/components/common/icons/DropForgeLaunchIcon";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { getClaimSeason } from "@/components/drop-forge/claimTraitsData";
import { useDropForgeMintingConfig } from "@/components/drop-forge/drop-forge-config";
import {
  getClaimPrimaryStatus,
  getPrimaryStatusPillClassName,
} from "@/components/drop-forge/drop-forge-status.helpers";
import DropForgeExplorerLink from "@/components/drop-forge/DropForgeExplorerLink";
import DropForgeFieldBox from "@/components/drop-forge/DropForgeFieldBox";
import DropForgeMediaTypePill from "@/components/drop-forge/DropForgeMediaTypePill";
import { DropForgePermissionFallback } from "@/components/drop-forge/DropForgePermissionFallback";
import DropForgeStatusPill from "@/components/drop-forge/DropForgeStatusPill";
import DropForgeTestnetIndicator from "@/components/drop-forge/DropForgeTestnetIndicator";
import DropForgeAccordionSection from "@/components/drop-forge/DropForgeAccordionSection";
import ClaimTransactionModal from "@/components/drop-forge/ClaimTransactionModal";
import {
  buildSubscriptionAirdropSelection,
  formatDateTimeLocalInput,
  formatLocalDateTime,
  formatScheduledLabel,
  getAnimationMimeType,
  getErrorMessage,
  getMediaTypeLabel,
  getRootAddressesCount,
  getRootForPhase,
  getRootTotalSpots,
  getSafeExternalUrl,
  getSubscriptionPhaseName,
  isNotFoundError,
  mergeAirdropsByWallet,
  normalizeHexValue,
  parseLocalDateTimeToUnixSeconds,
  summarizeAirdrops,
  toArweaveUrl,
} from "@/components/drop-forge/dropForgeLaunchClaimPageClient.helpers";
import { isMissingRequiredLaunchInfo } from "@/components/drop-forge/launchClaimHelpers";
import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import { getMintTimelineDetails as getClaimTimelineDetails } from "@/components/meme-calendar/meme-calendar.helpers";
import {
  MANIFOLD_LAZY_CLAIM_CONTRACT,
  MEMES_CONTRACT,
  MEMES_DEPLOYER,
  NULL_ADDRESS,
  NULL_MERKLE,
} from "@/constants/constants";
import type { MintingClaim } from "@/generated/models/MintingClaim";
import type { MintingClaimsRootItem } from "@/generated/models/MintingClaimsRootItem";
import type { PhaseAirdrop } from "@/generated/models/PhaseAirdrop";
import {
  capitalizeEveryWord,
  fromGWEI,
} from "@/helpers/Helpers";
import { Time } from "@/helpers/time";
import { useDropForgeManifoldClaim } from "@/hooks/useDropForgeManifoldClaim";
import { useDropForgePermissions } from "@/hooks/useDropForgePermissions";
import { buildMemesPhases as buildClaimPhases } from "@/hooks/useManifoldClaim";
import {
  getClaim,
  getMemesMintingRoots as getClaimRoots,
  getDistributionAirdropsArtist,
  getDistributionAirdropsTeam,
  getFinalSubscriptionsByPhase,
} from "@/services/api/memes-minting-claims-api";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isAddress, parseEther } from "viem";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";

interface DropForgeLaunchClaimPageClientProps {
  claimId: number;
}
type LaunchPhaseKey =
  | "phase0"
  | "phase1"
  | "phase2"
  | "publicphase"
  | "research";
type ClaimTxModalStatus = "confirm_wallet" | "submitted" | "success" | "error";

interface ClaimTxModalState {
  status: ClaimTxModalStatus;
  message?: string | undefined;
  txHash?: `0x${string}` | undefined;
  actionLabel?: string | undefined;
}

const BTN_SUBSCRIPTIONS_AIRDROP =
  "tw-h-12 tw-w-full sm:tw-w-64 tw-rounded-lg tw-border-0 tw-ring-1 tw-ring-inset tw-ring-primary-400/60 tw-bg-primary-500 tw-px-5 tw-text-base tw-font-semibold tw-text-white tw-transition-colors tw-duration-150 enabled:hover:tw-bg-primary-600 enabled:hover:tw-ring-primary-300 enabled:active:tw-bg-primary-700 enabled:active:tw-ring-primary-300 disabled:tw-cursor-not-allowed disabled:tw-opacity-50";
const BTN_METADATA_UPDATE_ACTION =
  "tw-h-12 tw-w-full sm:tw-w-64 tw-rounded-lg tw-border-0 tw-bg-orange-600 tw-px-5 tw-text-base tw-font-semibold tw-text-orange-50 tw-ring-1 tw-ring-inset tw-ring-orange-300/60 tw-shadow-[0_8px_18px_rgba(234,88,12,0.25)] tw-transition-colors tw-duration-150 enabled:hover:tw-bg-orange-500 enabled:active:tw-bg-orange-700 disabled:tw-cursor-not-allowed disabled:tw-opacity-50";
const DEFAULT_PHASE_PRICE_ETH = "0.06529";
const RESEARCH_AIRDROP_ADDRESS = "0xc2ce4ccef11a8171f443745cea3bceeaadd750c7";

type LaunchMediaTab = "image" | "animation";

export default function DropForgeLaunchClaimPageClient({
  claimId,
}: Readonly<DropForgeLaunchClaimPageClientProps>) {
  const pageTitle = `Launch Claim #${claimId}`;
  const { setToast } = useAuth();
  const { contract: forgeMintingContract, chain: forgeMintingChain } =
    useDropForgeMintingConfig();
  const { hasWallet, permissionsLoading, canAccessLaunchPage } =
    useDropForgePermissions();
  const claimWrite = useWriteContract();
  const waitClaimWrite = useWaitForTransactionReceipt({
    chainId: forgeMintingChain.id,
    confirmations: 1,
    hash: claimWrite.data,
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
  const [researchTargetEditionSize, setResearchTargetEditionSize] =
    useState(310);
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
  const handledClaimWriteSuccessTxHashRef = useRef<string | null>(null);
  const handledClaimWriteErrorTxHashRef = useRef<string | null>(null);
  const lastErrorToastRef = useRef<{ message: string; ts: number } | null>(
    null
  );
  const onChainClaimFetchStartedAtRef = useRef<number | null>(null);
  const onChainClaimSpinnerHideTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const showErrorToast = useCallback(
    (message: string) => {
      const now = Date.now();
      const last = lastErrorToastRef.current;
      const lastTs = last?.ts;
      if (last?.message === message && lastTs !== undefined && now - lastTs < 2000) {
        return;
      }
      lastErrorToastRef.current = { message, ts: now };
      setToast({ message, type: "error" });
    },
    [setToast]
  );

  const shouldShowPermissionFallback =
    permissionsLoading || !hasWallet || !canAccessLaunchPage;

  useEffect(() => {
    if (!hasWallet || !canAccessLaunchPage) return;
    let cancelled = false;
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

  const isInitialized = Boolean(manifoldClaim?.instanceId);
  const hasPublishedMetadata = Boolean(claim?.metadata_location != null);
  const missingRequiredInfo = Boolean(
    claim && isMissingRequiredLaunchInfo(claim)
  );
  const primaryStatus = claim
    ? getClaimPrimaryStatus({ claim, manifoldClaim: manifoldClaim ?? null })
    : null;
  const hasImage = Boolean(claim?.image_url);
  const hasAnimation = Boolean(claim?.animation_url);
  const animationMimeType = claim ? getAnimationMimeType(claim) : null;
  const activeMediaTypeLabel = claim
    ? getMediaTypeLabel(claim, activeMediaTab)
    : "—";

  useEffect(() => {
    setActiveMediaTab("image");
  }, [claimId]);

  useEffect(() => {
    if (!hasPublishedMetadata) {
      setSelectedPhase("");
      return;
    }
    if (!isInitialized) {
      setSelectedPhase("phase0");
      return;
    }
    setSelectedPhase((prev) => prev || "phase0");
  }, [hasPublishedMetadata, isInitialized]);

  useEffect(() => {
    setArtistAirdrops(null);
    setTeamAirdrops(null);
    setPhase0AirdropsError(null);
    setPhase0AirdropsLoading(false);
    setSubscriptionAirdropsByPhase({});
    setSubscriptionAirdropsLoadingByPhase({});
    setSubscriptionAirdropsErrorByPhase({});
  }, [claimId]);

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

  const selectedPhaseHasSubscriptionAirdrops = selectedPhase
    ? subscriptionAirdropsByPhase[selectedPhase] !== undefined
    : false;
  const selectedPhaseSubscriptionAirdropsLoading = selectedPhase
    ? Boolean(subscriptionAirdropsLoadingByPhase[selectedPhase])
    : false;
  const publicPhaseHasSubscriptionAirdrops =
    subscriptionAirdropsByPhase.publicphase !== undefined;
  const publicPhaseSubscriptionAirdropsLoading = Boolean(
    subscriptionAirdropsLoadingByPhase.publicphase
  );

  useEffect(() => {
    if (!hasWallet || !canAccessLaunchPage || !selectedPhase) return;
    const maybeFetch = (phaseKey: LaunchPhaseKey, hasValue: boolean, isLoading: boolean) => {
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
    if (selectedPhase === "phase0") {
      return [
        {
          phaseKey: "phase0" as LaunchPhaseKey,
          title: "Phase 0 Subscription Airdrops",
        },
      ];
    }
    if (selectedPhase === "phase1") {
      return [
        {
          phaseKey: "phase1" as LaunchPhaseKey,
          title: "Phase 1 Subscription Airdrops",
        },
      ];
    }
    if (selectedPhase === "phase2") {
      return [
        {
          phaseKey: "phase2" as LaunchPhaseKey,
          title: "Phase 2 Subscription Airdrops",
        },
        {
          phaseKey: "publicphase" as LaunchPhaseKey,
          title: "Public Phase Subscription Airdrops",
        },
      ];
    }
    return [];
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
  const selectedPhaseConfig = useMemo(
    () => phaseData.find((phase) => phase.key === selectedPhase) ?? null,
    [phaseData, selectedPhase]
  );
  const isMetadataOnlyUpdateMode = primaryStatus?.key === "live_needs_update";
  const safeClaimExternalUrl = claim ? getSafeExternalUrl(claim.external_url) : null;

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
  const selectedPhaseActionLabel =
    selectedPhase === "phase0" && !isInitialized
      ? "Initialize On-Chain"
      : "Update On-Chain";
  const claimWritePending = claimWrite.isPending || waitClaimWrite.isLoading;
  const selectedPhaseIsUpdateAction = Boolean(
    selectedPhaseConfig &&
    !(selectedPhaseConfig.key === "phase0" && !isInitialized)
  );
  const selectedPhaseComparableConfig = useMemo(() => {
    if (!selectedPhaseConfig) return null;
    const phaseKey = selectedPhaseConfig.key;
    const startInput = phaseAllowlistWindows[phaseKey]?.start ?? "";
    const endInput = phaseAllowlistWindows[phaseKey]?.end ?? "";
    const startDate = parseLocalDateTimeToUnixSeconds(startInput);
    const endDate = parseLocalDateTimeToUnixSeconds(endInput);
    const merkleRoot =
      phaseKey === "publicphase"
        ? NULL_MERKLE
        : (selectedPhaseConfig.root?.merkle_root ?? null);
    const costEth = (
      phasePricesEth[phaseKey] ?? DEFAULT_PHASE_PRICE_ETH
    ).trim();

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
  }, [selectedPhaseConfig, phaseAllowlistWindows, phasePricesEth]);
  const selectedPhaseMatchesOnChainConfig = useMemo(() => {
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
  }, [
    selectedPhaseIsUpdateAction,
    selectedPhaseComparableConfig,
    claim,
    manifoldClaim,
    isInitialized,
  ]);
  const selectedPhaseDiffs = useMemo(() => {
    const emptyDiffs = {
      editionSize: false,
      cost: false,
      merkleRoot: false,
      startDate: false,
      endDate: false,
    };

    if (
      !selectedPhaseIsUpdateAction ||
      !selectedPhaseComparableConfig ||
      !claim ||
      !manifoldClaim ||
      !isInitialized
    ) {
      return emptyDiffs;
    }

    return {
      editionSize:
        claim.edition_size != null && manifoldClaim.totalMax != null
          ? claim.edition_size !== manifoldClaim.totalMax
          : false,
      cost:
        selectedPhaseComparableConfig.costWei != null && manifoldClaim.costWei != null
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
  }, [
    selectedPhaseIsUpdateAction,
    selectedPhaseComparableConfig,
    claim,
    manifoldClaim,
    isInitialized,
  ]);
  const changedFieldBoxClassName =
    "tw-ring-rose-500/70 hover:tw-ring-rose-400/70";
  const changedFieldBoxLabelClassName =
    "tw-text-rose-300 tw-ring-rose-500/70";
  const selectedPhaseActionDisabled =
    (() => {
      if (claimWritePending || !selectedPhaseConfig) {
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
    })() ||
    (selectedPhaseIsUpdateAction && selectedPhaseMatchesOnChainConfig);
  const isPublicPhaseSelected = selectedPhaseConfig?.key === "publicphase";
  const showPhase0AirdropSections = selectedPhaseConfig?.key === "phase0";
  const claimTxModalClosable =
    claimTxModal?.status === "success" || claimTxModal?.status === "error";
  const totalMinted = Number(manifoldClaim?.total ?? 0);
  const researchAirdropCount = Math.max(
    0,
    Math.trunc(researchTargetEditionSize) - totalMinted
  );

  const runMetadataLocationOnlyUpdate = useCallback(() => {
    if (!claim) {
      setToast({ message: "Claim not loaded", type: "error" });
      return;
    }
    if (!claim.metadata_location) {
      setToast({
        message: "Updated metadata location is missing",
        type: "error",
      });
      return;
    }
    if (!isInitialized || !manifoldClaim) {
      setToast({ message: "On-chain claim is not initialized", type: "error" });
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
        message: "On-chain claim parameters are not available yet",
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
    try {
      claimWrite.writeContract({
        address: MANIFOLD_LAZY_CLAIM_CONTRACT as `0x${string}`,
        abi: MEMES_MANIFOLD_PROXY_ABI,
        chainId: forgeMintingChain.id,
        functionName: "updateClaim",
        args: [forgeMintingContract, BigInt(claimId), claimParameters],
      });
    } catch (error) {
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

  const closeClaimTxModal = useCallback(() => {
    if (!claimTxModalClosable) return;
    setClaimTxModal(null);
    refreshLaunchClaimData().catch(() => undefined);
  }, [claimTxModalClosable, refreshLaunchClaimData]);

  useEffect(() => {
    if (!claimTxModal) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [claimTxModal]);

  useEffect(() => {
    if (!claimTxModalClosable) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeClaimTxModal();
      }
    };
    globalThis.addEventListener("keydown", onKeyDown);
    return () => globalThis.removeEventListener("keydown", onKeyDown);
  }, [claimTxModalClosable, closeClaimTxModal]);

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
        setToast({ message: "Claim not loaded", type: "error" });
        return;
      }
      if (claim.edition_size == null || claim.edition_size <= 0) {
        setToast({
          message: "Edition size is missing or invalid",
          type: "error",
        });
        return;
      }
      if (!claim.metadata_location) {
        setToast({ message: "Metadata location is missing", type: "error" });
        return;
      }

      const phase = phaseData.find((item) => item.key === phaseKey);
      if (!phase) {
        setToast({ message: "Phase configuration not found", type: "error" });
        return;
      }

      const startInput = phaseAllowlistWindows[phaseKey]?.start ?? "";
      const endInput = phaseAllowlistWindows[phaseKey]?.end ?? "";
      const startDate = parseLocalDateTimeToUnixSeconds(startInput);
      const endDate = parseLocalDateTimeToUnixSeconds(endInput);
      if (startDate == null || endDate == null) {
        setToast({
          message: "Phase start/end must be valid local date-time values",
          type: "error",
        });
        return;
      }
      if (endDate <= startDate) {
        setToast({
          message: "Phase end must be after phase start",
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
          message: "Merkle root is missing for this phase",
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
        setToast({ message: "Cost (ETH) is invalid", type: "error" });
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
      try {
        claimWrite.writeContract({
          address: MANIFOLD_LAZY_CLAIM_CONTRACT as `0x${string}`,
          abi: MEMES_MANIFOLD_PROXY_ABI,
          chainId: forgeMintingChain.id,
          functionName,
          args: [forgeMintingContract, BigInt(claimId), claimParameters],
        });
      } catch (error) {
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
    }: {
      entries: PhaseAirdrop[] | null;
      actionLabel:
        | "Airdrop Artist"
        | "Airdrop Team"
        | "Airdrop Subscriptions"
        | "Airdrop to Research";
    }) => {
      if (!isInitialized) {
        setToast({
          message: "Claim must be initialized before airdropping",
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
      const amounts = parsedEntries.map((entry) =>
        BigInt(Math.trunc(entry.amount))
      );

      setClaimTxModal({
        status: "confirm_wallet",
        actionLabel,
      });

      try {
        claimWrite.writeContract({
          address: MANIFOLD_LAZY_CLAIM_CONTRACT as `0x${string}`,
          abi: MEMES_MANIFOLD_PROXY_ABI,
          chainId: forgeMintingChain.id,
          functionName: "airdrop",
          args: [forgeMintingContract, BigInt(claimId), recipients, amounts],
        });
      } catch (error) {
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
  const runResearchAirdropWrite = useCallback(() => {
    if (!isInitialized) {
      setToast({
        message: "Claim must be initialized before airdropping",
        type: "error",
      });
      return;
    }
    if (researchAirdropCount <= 0) {
      setToast({
        message: "No research airdrop needed",
        type: "error",
      });
      return;
    }

    runAirdropWrite({
      entries: [
        { wallet: RESEARCH_AIRDROP_ADDRESS, amount: researchAirdropCount },
      ],
      actionLabel: "Airdrop to Research",
    });
  }, [isInitialized, researchAirdropCount, runAirdropWrite, setToast]);

  useEffect(() => {
    if (claimWrite.error) {
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
    const txHash = claimWrite.data;
    if (!txHash || !waitClaimWrite.isSuccess) return;
    if (handledClaimWriteSuccessTxHashRef.current === txHash) return;
    handledClaimWriteSuccessTxHashRef.current = txHash;
    refetchOnChainClaim().catch(() => undefined);
    setClaimTxModal((prev) => ({
      status: "success",
      txHash,
      actionLabel: prev?.actionLabel,
    }));
  }, [claimWrite.data, waitClaimWrite.isSuccess, refetchOnChainClaim]);

  useEffect(() => {
    const txHash = claimWrite.data;
    if (!txHash || !waitClaimWrite.error) return;
    if (handledClaimWriteErrorTxHashRef.current === txHash) return;
    handledClaimWriteErrorTxHashRef.current = txHash;
    setClaimTxModal((prev) => ({
      status: "error",
      txHash,
      message: getErrorMessage(waitClaimWrite.error, "Transaction failed"),
      actionLabel: prev?.actionLabel,
    }));
  }, [claimWrite.data, waitClaimWrite.error]);

  if (shouldShowPermissionFallback) {
    return (
      <DropForgePermissionFallback
        title={pageTitle}
        permissionsLoading={permissionsLoading}
        hasWallet={hasWallet}
        hasAccess={canAccessLaunchPage}
        titleIcon={DropForgeLaunchIcon}
        titleRight={
          <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-2">
            <DropForgeExplorerLink />
            <DropForgeTestnetIndicator />
          </div>
        }
      />
    );
  }

  return (
    <div className="tw-px-2 tw-pb-16 tw-pt-2 lg:tw-px-6 lg:tw-pt-8 xl:tw-px-8">
      <div className="tw-mb-6">
        <Link
          href="/drop-forge/launch"
          className="tw-inline-flex tw-items-center tw-gap-2 tw-text-iron-400 tw-no-underline hover:tw-text-iron-50"
        >
          <ArrowLeftIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
          Back to Claims list
        </Link>
        <div className="tw-mt-2 tw-flex tw-items-start tw-justify-between tw-gap-3">
          <h1 className="tw-mb-0 tw-inline-flex tw-items-center tw-gap-3 tw-text-3xl tw-font-semibold tw-text-iron-50">
            <DropForgeLaunchIcon className="tw-h-8 tw-w-8 tw-flex-shrink-0" />
            {pageTitle}
          </h1>
          <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-2">
            <DropForgeExplorerLink />
            <DropForgeTestnetIndicator />
          </div>
        </div>
      </div>
      {loading && <p className="tw-text-iron-400">Loading…</p>}
      {error && (
        <p className="tw-text-red-400 tw-mb-4" role="alert">
          {error}
        </p>
      )}
      {rootsError && (
        <p className="tw-text-red-400 tw-mb-4" role="alert">
          {rootsError}
        </p>
      )}
      {claim && (
        <div className="tw-flex tw-flex-col tw-gap-5 sm:tw-gap-6">
          {mintTimeline && (
            <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
              <p className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-iron-100">
                Scheduled for {formatScheduledLabel(mintTimeline.instantUtc)}
              </p>
              <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                {primaryStatus && (
                  <DropForgeStatusPill
                    className={getPrimaryStatusPillClassName(
                      primaryStatus.tone
                    )}
                    label={primaryStatus.label}
                    showLoader={primaryStatus.key === "publishing"}
                    tooltipText={primaryStatus.reason ?? ""}
                  />
                )}
              </div>
            </div>
          )}
          {(hasImage || hasAnimation) && (
            <DropForgeAccordionSection
              title="Media Preview"
              subtitle=""
              tone="neutral"
              defaultOpen={false}
              headerRight={
                hasAnimation ? (
                  <div className="tw-inline-flex tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-iron-700">
                    <button
                      type="button"
                      onClick={() => setActiveMediaTab("image")}
                      className={`tw-border-0 tw-px-3 tw-py-1.5 tw-text-sm tw-transition-colors ${
                        activeMediaTab === "image"
                          ? "tw-bg-primary-500 tw-text-white"
                          : "tw-bg-transparent tw-text-iron-400 hover:tw-text-iron-200"
                      }`}
                    >
                      Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMediaTab("animation")}
                      className={`tw-border-0 tw-px-3 tw-py-1.5 tw-text-sm tw-transition-colors ${
                        activeMediaTab === "animation"
                          ? "tw-bg-primary-500 tw-text-white"
                          : "tw-bg-transparent tw-text-iron-400 hover:tw-text-iron-200"
                      }`}
                    >
                      Animation
                    </button>
                  </div>
                ) : null
              }
              showHeaderRightWhenOpen
              childrenClassName="tw-space-y-5"
            >
              <div className="tw-relative tw-h-64 tw-w-full tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-iron-800 sm:tw-h-80 lg:tw-h-[23.5rem]">
                {(() => {
                  if (activeMediaTab === "animation" && hasAnimation && animationMimeType) {
                    return (
                      <MediaDisplay
                        media_mime_type={animationMimeType}
                        media_url={claim.animation_url ?? ""}
                      />
                    );
                  }
                  if (activeMediaTab === "image" && hasImage) {
                    const imageMimeType = claim.image_details?.format
                      ? `image/${String(claim.image_details.format).toLowerCase()}`
                      : "image/jpeg";
                    return (
                      <MediaDisplay
                        media_mime_type={imageMimeType}
                        media_url={claim.image_url ?? ""}
                      />
                    );
                  }
                  return activeMediaTab === "image" ? (
                    <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-text-sm tw-text-iron-400">
                      Image missing
                    </div>
                  ) : (
                    <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-text-sm tw-text-iron-400">
                      Animation missing
                    </div>
                  );
                })()}
              </div>
              <div className="tw-flex tw-justify-center">
                <DropForgeMediaTypePill label={activeMediaTypeLabel} />
              </div>
            </DropForgeAccordionSection>
          )}
          <DropForgeAccordionSection
            title="Details"
            subtitle=""
            tone="neutral"
            defaultOpen={false}
            headerRight={
              <div className="tw-inline-flex tw-flex-wrap tw-items-center tw-gap-2">
                <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-700/30 tw-px-3 tw-py-1 tw-text-sm tw-font-medium tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-500/40">
                  SZN {getClaimSeason(claim) || "—"}
                </span>
                <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-700/30 tw-px-3 tw-py-1 tw-text-sm tw-font-medium tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-500/40">
                  Edition Size {claim.edition_size ?? "—"}
                </span>
              </div>
            }
            childrenClassName="tw-space-y-5"
          >
            <div className="tw-grid tw-grid-cols-1 tw-gap-x-4 tw-gap-y-6 sm:tw-grid-cols-2">
              <DropForgeFieldBox
                label="Artwork Title"
                className="sm:tw-col-span-2"
              >
                <span className="tw-break-words">{claim.name || "—"}</span>
              </DropForgeFieldBox>
              <DropForgeFieldBox
                label="Description"
                className="sm:tw-col-span-2"
              >
                <span className="tw-whitespace-pre-wrap tw-break-words">
                  {claim.description || "—"}
                </span>
              </DropForgeFieldBox>
              <DropForgeFieldBox
                label="External URL"
                className="sm:tw-col-span-2"
              >
                {(() => {
                  if (!claim.external_url) {
                    return "—";
                  }
                  if (!safeClaimExternalUrl) {
                    return (
                      <span className="tw-break-all">{claim.external_url}</span>
                    );
                  }
                  return (
                    <a
                      href={safeClaimExternalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:tw-text-primary-200 tw-break-all tw-text-primary-300 tw-no-underline"
                    >
                      {claim.external_url}
                    </a>
                  );
                })()}
              </DropForgeFieldBox>
            </div>
          </DropForgeAccordionSection>
          <DropForgeAccordionSection
            title="Traits"
            subtitle=""
            tone="neutral"
            defaultOpen={false}
            childrenClassName="tw-space-y-5"
          >
            {claim.attributes?.length ? (
              <div className="tw-grid tw-grid-cols-1 tw-gap-x-4 tw-gap-y-6 sm:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-4">
                {claim.attributes.map((attribute, index) => (
                  <DropForgeFieldBox
                    key={`${attribute.trait_type ?? "trait"}-${index}`}
                    label={attribute.trait_type || "Trait"}
                  >
                    {attribute.value !== null &&
                    attribute.value !== undefined &&
                    String(attribute.value).trim()
                      ? String(attribute.value)
                      : "—"}
                  </DropForgeFieldBox>
                ))}
              </div>
            ) : (
              <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
                No traits found.
              </p>
            )}
          </DropForgeAccordionSection>
          <DropForgeAccordionSection
            title={
              isInitialized
                ? "On-Chain Claim"
                : "On-Chain Claim - Not Initialized"
            }
            subtitle=""
            tone={isInitialized ? "neutral" : "warning"}
            defaultOpen={false}
            disabled={!isInitialized}
            headerRight={
              onChainClaimSpinnerVisible ? (
                <span aria-label="Refreshing on-chain claim">
                  <CircleLoader size={CircleLoaderSize.MEDIUM} />
                </span>
              ) : null
            }
            childrenClassName="tw-space-y-5"
          >
            {manifoldClaim ? (
              <div className="tw-grid tw-grid-cols-1 tw-gap-x-4 tw-gap-y-6 sm:tw-grid-cols-2">
                <DropForgeFieldBox label="Instance ID">
                  {manifoldClaim.instanceId.toLocaleString()}
                </DropForgeFieldBox>
                <DropForgeFieldBox label="Cost (ETH)">
                  {fromGWEI(manifoldClaim.cost).toFixed(5)}
                </DropForgeFieldBox>
                <DropForgeFieldBox label="Claim Phase">
                  {manifoldClaim.memePhase?.name ?? "—"}
                </DropForgeFieldBox>
                <DropForgeFieldBox label="Status">
                  {capitalizeEveryWord(manifoldClaim.status)}
                </DropForgeFieldBox>
                <DropForgeFieldBox label="Total Minted">
                  {manifoldClaim.total.toLocaleString()}
                </DropForgeFieldBox>
                <DropForgeFieldBox label="Total Max">
                  {manifoldClaim.totalMax.toLocaleString()}
                </DropForgeFieldBox>
                <DropForgeFieldBox label="Remaining Editions">
                  {manifoldClaim.remaining.toLocaleString()}
                </DropForgeFieldBox>
                <DropForgeFieldBox
                  label="Metadata Location"
                  contentClassName="tw-text-sm"
                >
                  <span className="tw-break-all">
                    {toArweaveUrl(manifoldClaim.location) ? (
                      <a
                        href={toArweaveUrl(manifoldClaim.location)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:tw-text-primary-200 tw-text-primary-300 tw-no-underline"
                      >
                        {manifoldClaim.location}
                      </a>
                    ) : (
                      manifoldClaim.location || "—"
                    )}
                  </span>
                </DropForgeFieldBox>
                <DropForgeFieldBox label="Start Date">
                  {formatLocalDateTime(
                    Time.seconds(manifoldClaim.startDate).toDate()
                  )}
                </DropForgeFieldBox>
                <DropForgeFieldBox label="End Date">
                  {formatLocalDateTime(
                    Time.seconds(manifoldClaim.endDate).toDate()
                  )}
                </DropForgeFieldBox>
              </div>
            ) : (
              <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
                On-chain claim data is not available.
              </p>
            )}
          </DropForgeAccordionSection>
          <div className="tw-flex tw-flex-col tw-gap-3">
            {hasPublishedMetadata && isMetadataOnlyUpdateMode && (
                <div className="tw-space-y-4">
                  <div className="tw-text-base tw-font-semibold tw-text-white">
                    Metadata Changed
                  </div>
                  <div className="tw-grid tw-grid-cols-1 tw-gap-3 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:tw-items-start lg:tw-gap-x-5">
                    <DropForgeFieldBox
                      label="On-Chain Metadata"
                      contentClassName="tw-text-sm"
                    >
                      <span className="tw-block tw-max-w-full tw-truncate">
                        {toArweaveUrl(manifoldClaim?.location) ? (
                          <a
                            href={toArweaveUrl(manifoldClaim?.location)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:tw-text-primary-200 tw-block tw-max-w-full tw-truncate tw-text-primary-300 tw-no-underline"
                            title={manifoldClaim?.location ?? undefined}
                          >
                            {manifoldClaim?.location}
                          </a>
                        ) : (
                          manifoldClaim?.location || "—"
                        )}
                      </span>
                    </DropForgeFieldBox>
                    <DropForgeFieldBox
                      label="Updated Metadata"
                      contentClassName="tw-text-sm"
                    >
                      <span className="tw-block tw-max-w-full tw-truncate">
                        {toArweaveUrl(claim.metadata_location) ? (
                          <a
                            href={toArweaveUrl(claim.metadata_location)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:tw-text-primary-200 tw-block tw-max-w-full tw-truncate tw-text-primary-300 tw-no-underline"
                            title={claim.metadata_location ?? undefined}
                          >
                            {claim.metadata_location}
                          </a>
                        ) : (
                          claim.metadata_location || "—"
                        )}
                      </span>
                    </DropForgeFieldBox>
                    <button
                      type="button"
                      disabled={
                        claimWritePending ||
                        !isInitialized ||
                        !manifoldClaim ||
                        !claim.metadata_location
                      }
                      onClick={runMetadataLocationOnlyUpdate}
                      className={`${BTN_METADATA_UPDATE_ACTION} lg:tw-self-end`}
                    >
                      {claimWritePending ? "Processing..." : "Update On-Chain"}
                    </button>
                  </div>
                </div>
            )}
            {hasPublishedMetadata && !isMetadataOnlyUpdateMode && (
                <>
                  <label
                    htmlFor="phase-selection"
                    className="tw-text-base tw-font-semibold tw-text-iron-50"
                  >
                    Phase Selection
                  </label>
                  <div className="tw-relative">
                    <select
                      id="phase-selection"
                      value={selectedPhase}
                      onChange={(e) =>
                        setSelectedPhase(
                          e.target.value as
                            | ""
                            | "phase0"
                            | "phase1"
                            | "phase2"
                            | "publicphase"
                            | "research"
                        )
                      }
                      className="tw-h-16 tw-w-full tw-appearance-none tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-pl-4 tw-pr-12 tw-text-white tw-ring-1 tw-ring-inset tw-ring-iron-800 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-iron-600"
                    >
                      <option value="" disabled>
                        Phase Selection
                      </option>
                      <option value="phase0">Phase 0 - Initialize Claim</option>
                      <option value="phase1" disabled={!isInitialized}>
                        Phase 1
                      </option>
                      <option value="phase2" disabled={!isInitialized}>
                        Phase 2
                      </option>
                      <option value="publicphase" disabled={!isInitialized}>
                        Public Phase
                      </option>
                      <option value="research" disabled={!isInitialized}>
                        Airdrop to Research
                      </option>
                    </select>
                    <ChevronDownIcon className="tw-pointer-events-none tw-absolute tw-right-4 tw-top-1/2 tw-h-5 tw-w-5 -tw-translate-y-1/2 tw-text-iron-300" />
                  </div>
                  {selectedPhase === "research" ? (
                    <div className="tw-grid tw-grid-cols-1 tw-gap-3 tw-pt-4 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:tw-items-start lg:tw-gap-x-5">
                      <DropForgeFieldBox label="Total Minted">
                        {totalMinted.toLocaleString()}
                      </DropForgeFieldBox>
                      <DropForgeFieldBox label="Target Edition Size">
                        <input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          step="1"
                          value={researchTargetEditionSize}
                          onChange={(e) => {
                            const parsed = Number(e.target.value);
                            setResearchTargetEditionSize(
                              Number.isFinite(parsed) && parsed >= 0
                                ? Math.trunc(parsed)
                                : 0
                            );
                          }}
                          className="tw-w-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-white [color-scheme:dark] focus:tw-outline-none focus:tw-ring-0"
                        />
                      </DropForgeFieldBox>
                      <button
                        type="button"
                        disabled={
                          claimWritePending ||
                          !isInitialized ||
                          researchAirdropCount <= 0
                        }
                        onClick={runResearchAirdropWrite}
                        className={`${BTN_SUBSCRIPTIONS_AIRDROP} lg:tw-self-end`}
                      >
                        {claimWritePending
                          ? "Processing..."
                          : `Airdrop to Research x${researchAirdropCount.toLocaleString()}`}
                      </button>
                    </div>
                  ) : (
                    <div className="tw-space-y-5 tw-pt-2">
                      <div className="tw-text-base tw-font-medium tw-text-white">
                        Phase Configuration
                      </div>
                      <div className="tw-grid tw-grid-cols-1 tw-gap-3 lg:tw-grid-cols-2 lg:tw-gap-x-5">
                        <DropForgeFieldBox label="Remaining Editions">
                          {manifoldClaim?.remaining ?? "—"}
                        </DropForgeFieldBox>
                        <DropForgeFieldBox
                          label="Cost (ETH)"
                          className={selectedPhaseDiffs.cost ? changedFieldBoxClassName : ""}
                          labelClassName={
                            selectedPhaseDiffs.cost
                              ? changedFieldBoxLabelClassName
                              : ""
                          }
                        >
                          <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.00001"
                            value={
                              selectedPhase
                                ? (phasePricesEth[selectedPhase] ?? "")
                                : ""
                            }
                            onChange={(e) => {
                              if (!selectedPhase) return;
                              setPhasePricesEth((prev) => ({
                                ...prev,
                                [selectedPhase]: e.target.value,
                              }));
                            }}
                            disabled={!selectedPhase}
                            className="tw-w-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-white [color-scheme:dark] focus:tw-outline-none focus:tw-ring-0 disabled:tw-cursor-not-allowed disabled:tw-text-iron-500"
                          />
                        </DropForgeFieldBox>
                      </div>
                      {isPublicPhaseSelected ? null : (
                        <div className="tw-grid tw-grid-cols-1 tw-gap-3 tw-pt-3 lg:tw-grid-cols-2 lg:tw-gap-x-5">
                          <DropForgeFieldBox
                            label="Merkle Root"
                            className={
                              selectedPhaseDiffs.merkleRoot
                                ? changedFieldBoxClassName
                                : ""
                            }
                            labelClassName={
                              selectedPhaseDiffs.merkleRoot
                                ? changedFieldBoxLabelClassName
                                : ""
                            }
                            contentClassName="tw-break-all tw-text-sm"
                          >
                            <span>
                              {rootsLoading && !selectedPhaseConfig?.root ? (
                                <span className="tw-text-iron-400">loading</span>
                              ) : (
                                selectedPhaseConfig?.root?.merkle_root ?? (
                                  <span className="tw-text-rose-300">
                                    missing
                                  </span>
                                )
                              )}
                            </span>
                          </DropForgeFieldBox>
                          <DropForgeFieldBox label="Address Count / Total Spots">
                            {rootsLoading && !selectedPhaseConfig?.root ? (
                              <span className="tw-text-iron-400">
                                loading / loading
                              </span>
                            ) : (
                              <span className="tw-inline-flex tw-items-center">
                                <span>
                                  {getRootAddressesCount(
                                    selectedPhaseConfig?.root
                                  ) ?? (
                                    <span className="tw-text-rose-300">
                                      missing
                                    </span>
                                  )}
                                </span>
                                <span className="tw-px-1">/</span>
                                <span>
                                  {getRootTotalSpots(
                                    selectedPhaseConfig?.root
                                  ) ?? (
                                    <span className="tw-text-rose-300">
                                      missing
                                    </span>
                                  )}
                                </span>
                              </span>
                            )}
                          </DropForgeFieldBox>
                        </div>
                      )}
                      <div className="tw-grid tw-grid-cols-1 tw-gap-3 tw-pt-3 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:tw-items-start lg:tw-gap-x-5">
                        <DropForgeFieldBox
                          label="Phase Start"
                          className={
                            selectedPhaseDiffs.startDate
                              ? changedFieldBoxClassName
                              : ""
                          }
                          labelClassName={
                            selectedPhaseDiffs.startDate
                              ? changedFieldBoxLabelClassName
                              : ""
                          }
                        >
                          <input
                            type="datetime-local"
                            value={
                              selectedPhase
                                ? (phaseAllowlistWindows[selectedPhase]
                                    ?.start ?? "")
                                : ""
                            }
                            onChange={(e) => {
                              if (!selectedPhase) return;
                              setPhaseAllowlistWindows((prev) => ({
                                ...prev,
                                [selectedPhase]: {
                                  start: e.target.value,
                                  end: prev[selectedPhase]?.end ?? "",
                                },
                              }));
                            }}
                            disabled={!selectedPhase}
                            className="tw-w-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-white [color-scheme:dark] focus:tw-outline-none focus:tw-ring-0 disabled:tw-cursor-not-allowed disabled:tw-text-iron-500"
                          />
                        </DropForgeFieldBox>
                        <DropForgeFieldBox
                          label="Phase End"
                          className={
                            selectedPhaseDiffs.endDate
                              ? changedFieldBoxClassName
                              : ""
                          }
                          labelClassName={
                            selectedPhaseDiffs.endDate
                              ? changedFieldBoxLabelClassName
                              : ""
                          }
                        >
                          <input
                            type="datetime-local"
                            value={
                              selectedPhase
                                ? (phaseAllowlistWindows[selectedPhase]?.end ??
                                  "")
                                : ""
                            }
                            onChange={(e) => {
                              if (!selectedPhase) return;
                              setPhaseAllowlistWindows((prev) => ({
                                ...prev,
                                [selectedPhase]: {
                                  start: prev[selectedPhase]?.start ?? "",
                                  end: e.target.value,
                                },
                              }));
                            }}
                            disabled={!selectedPhase}
                            className="tw-w-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-white [color-scheme:dark] focus:tw-outline-none focus:tw-ring-0 disabled:tw-cursor-not-allowed disabled:tw-text-iron-500"
                          />
                        </DropForgeFieldBox>
                        <button
                          type="button"
                          disabled={selectedPhaseActionDisabled}
                          onClick={() => {
                            if (!selectedPhaseConfig) return;
                            runClaimWriteForPhase({
                              phaseKey: selectedPhaseConfig.key,
                              forceAction:
                                selectedPhaseConfig.key === "phase0" &&
                                !isInitialized
                                  ? "initialize"
                                  : "update",
                            });
                          }}
                          className={`${BTN_SUBSCRIPTIONS_AIRDROP} lg:tw-self-end`}
                        >
                          {claimWritePending
                            ? "Processing..."
                            : selectedPhaseActionLabel}
                        </button>
                      </div>
                      {showPhase0AirdropSections && (
                        <div className="tw-space-y-5 tw-pt-3">
                          {phase0AirdropsError && (
                            <p className="tw-mb-0 tw-text-sm tw-text-rose-300">
                              {phase0AirdropsError}
                            </p>
                          )}

                          <div className="tw-space-y-5">
                            <div className="tw-text-base tw-font-medium tw-text-white">
                              Artist Airdrops
                            </div>
                            <div className="tw-grid tw-grid-cols-1 tw-gap-3 lg:tw-grid-cols-[minmax(0,1fr)_auto] lg:tw-items-start lg:tw-gap-x-5">
                              <DropForgeFieldBox label="Address Count / Total Airdrops">
                                {phase0AirdropsLoading
                                  ? "loading / loading"
                                  : `${artistAirdropSummary.addresses.toLocaleString()} / ${artistAirdropSummary.totalAirdrops.toLocaleString()}`}
                              </DropForgeFieldBox>
                              <button
                                type="button"
                                disabled={
                                  !isInitialized ||
                                  claimWritePending ||
                                  phase0AirdropsLoading ||
                                  artistAirdropSummary.totalAirdrops <= 0
                                }
                                onClick={() =>
                                  runAirdropWrite({
                                    entries: artistAirdrops,
                                    actionLabel: "Airdrop Artist",
                                  })
                                }
                                className={`${BTN_SUBSCRIPTIONS_AIRDROP} lg:tw-self-end`}
                              >
                                {`Airdrop Artist x${artistAirdropSummary.totalAirdrops.toLocaleString()}`}
                              </button>
                            </div>
                          </div>

                          <div className="tw-space-y-5">
                            <div className="tw-text-base tw-font-medium tw-text-white">
                              Team Airdrops
                            </div>
                            <div className="tw-grid tw-grid-cols-1 tw-gap-3 lg:tw-grid-cols-[minmax(0,1fr)_auto] lg:tw-items-start lg:tw-gap-x-5">
                              <DropForgeFieldBox label="Address Count / Total Airdrops">
                                {phase0AirdropsLoading
                                  ? "loading / loading"
                                  : `${teamAirdropSummary.addresses.toLocaleString()} / ${teamAirdropSummary.totalAirdrops.toLocaleString()}`}
                              </DropForgeFieldBox>
                              <button
                                type="button"
                                disabled={
                                  !isInitialized ||
                                  claimWritePending ||
                                  phase0AirdropsLoading ||
                                  teamAirdropSummary.totalAirdrops <= 0
                                }
                                onClick={() =>
                                  runAirdropWrite({
                                    entries: teamAirdrops,
                                    actionLabel: "Airdrop Team",
                                  })
                                }
                                className={`${BTN_SUBSCRIPTIONS_AIRDROP} lg:tw-self-end`}
                              >
                                {`Airdrop Team x${teamAirdropSummary.totalAirdrops.toLocaleString()}`}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      {subscriptionAirdropSections.length > 0 ? (
                        <div className="tw-space-y-5 tw-pt-3">
                          {subscriptionAirdropSections.map((section) => (
                            <div
                              key={section.phaseKey}
                              className="tw-space-y-5"
                            >
                              {section.error ? (
                                <p className="tw-mb-0 tw-text-sm tw-text-rose-300">
                                  {section.error}
                                </p>
                              ) : null}
                              <div className="tw-text-base tw-font-medium tw-text-white">
                                {section.title}
                              </div>
                              <div className="tw-grid tw-grid-cols-1 tw-gap-3 lg:tw-grid-cols-[minmax(0,1fr)_auto] lg:tw-items-start lg:tw-gap-x-5">
                                <DropForgeFieldBox label="Address Count / Total Airdrops">
                                  {section.loading
                                    ? "loading / loading"
                                    : `${section.addresses.toLocaleString()} / ${section.totalAirdrops.toLocaleString()}`}
                                </DropForgeFieldBox>
                                <button
                                  type="button"
                                  disabled={
                                    !isInitialized ||
                                    claimWritePending ||
                                    section.loading ||
                                    section.airdropCount <= 0
                                  }
                                  onClick={() =>
                                    runAirdropWrite({
                                      entries: section.airdropEntries,
                                      actionLabel: "Airdrop Subscriptions",
                                    })
                                  }
                                  className={`${BTN_SUBSCRIPTIONS_AIRDROP} lg:tw-self-end`}
                                >
                                  {section.airdropCount > 0
                                    ? `Airdrop Subscriptions x${section.airdropCount.toLocaleString()}`
                                    : "Airdrop Subscriptions"}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}
                </>
            )}
            {!hasPublishedMetadata && (
              <p className="tw-mb-0 tw-text-white">
                {primaryStatus?.key === "publishing"
                  ? "Publishing to Arweave: "
                  : "Finish claim crafting before launching: "}
                <Link
                  href={`/drop-forge/craft/${claimId}`}
                  className="hover:tw-text-primary-200 tw-text-primary-300 tw-no-underline"
                >
                  Craft Claim #{claimId}
                </Link>
              </p>
            )}
          </div>
        </div>
      )}
      <ClaimTransactionModal
        state={claimTxModal}
        chain={forgeMintingChain}
        onClose={closeClaimTxModal}
      />
    </div>
  );
}
