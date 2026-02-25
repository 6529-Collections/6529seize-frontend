"use client";

import { MEMES_MANIFOLD_PROXY_ABI } from "@/abis/abis";
import { useAuth } from "@/components/auth/Auth";
import ClaimTransactionModal from "@/components/drop-forge/launch/ClaimTransactionModal";
import { useDropForgeMintingConfig } from "@/components/drop-forge/drop-forge-config";
import { getClaimPrimaryStatus } from "@/components/drop-forge/drop-forge-status.helpers";
import {
  DropForgeLaunchClaimPageView,
  DropForgeLaunchClaimPermissionFallbackView,
} from "@/components/drop-forge/launch/DropForgeLaunchClaimPageClient.view";
import {
  buildSubscriptionAirdropSelection,
  formatDateTimeLocalInput,
  getAnimationMimeType,
  getErrorMessage,
  getMediaTypeLabel,
  getRootForPhase,
  getSafeExternalUrl,
  getSubscriptionPhaseName,
  isNotFoundError,
  mergeAirdropsByWallet,
  normalizeHexValue,
  parseLocalDateTimeToUnixSeconds,
  summarizeAirdrops,
} from "@/components/drop-forge/launch/dropForgeLaunchClaimPageClient.helpers";
import { isMissingRequiredLaunchInfo } from "@/components/drop-forge/launch/launchClaimHelpers";
import { getMintTimelineDetails as getClaimTimelineDetails } from "@/components/meme-calendar/meme-calendar.helpers";
import {
  MANIFOLD_LAZY_CLAIM_CONTRACT,
  MEMES_CONTRACT,
  MEMES_DEPLOYER,
  NULL_ADDRESS,
  NULL_MERKLE,
  RESEARCH_AIRDROP_ADDRESS,
} from "@/constants/constants";
import type { MintingClaim } from "@/generated/models/MintingClaim";
import type { MintingClaimsRootItem } from "@/generated/models/MintingClaimsRootItem";
import type { PhaseAirdrop } from "@/generated/models/PhaseAirdrop";
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

const DEFAULT_PHASE_PRICE_ETH = "0.06529";
type LaunchMediaTab = "image" | "animation";

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
    selectedPhaseWindowEndValue: phaseAllowlistWindows[selectedPhase]?.end ?? "",
  };
}

function runSelectedPhaseClaimAction({
  selectedPhaseConfig,
  isInitialized,
  runClaimWriteForPhase,
}: Readonly<{
  selectedPhaseConfig: { key: Exclude<LaunchPhaseKey, "research"> } | null;
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
    setPhaseAllowlistWindows({});
    setPhasePricesEth({});
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
  const safeClaimExternalUrl = claim
    ? getSafeExternalUrl(claim.external_url)
    : null;

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

  const handleSelectedPhaseChange = useCallback((value: string) => {
    setSelectedPhase(value as "" | LaunchPhaseKey);
  }, []);

  const handleResearchTargetEditionSizeChange = useCallback((value: string) => {
    const parsed = Number(value);
    setResearchTargetEditionSize(
      Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : 0
    );
  }, []);

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
        loading={loading}
        error={error}
        rootsError={rootsError}
        claim={claim}
        claimId={claimId}
        mintTimeline={mintTimeline}
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
        researchTargetEditionSize={researchTargetEditionSize}
        onResearchTargetEditionSizeChange={
          handleResearchTargetEditionSizeChange
        }
        researchAirdropCount={researchAirdropCount}
        runResearchAirdropWrite={runResearchAirdropWrite}
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
      />
      <ClaimTransactionModal
        state={claimTxModal}
        chain={forgeMintingChain}
        onClose={closeClaimTxModal}
      />
    </>
  );
}
