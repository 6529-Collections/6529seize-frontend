import { useCallback, useEffect } from "react";
import { isAddress, parseEther } from "viem";
import type {
  useSendTransaction,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { MEMES_MANIFOLD_PROXY_ABI } from "@/abis/abis";
import type { useAuth } from "@/components/auth/Auth";
import {
  clampResearchTargetEditionSize,
  getErrorMessage,
  getResearchTargetEditionSizeLimit,
  parseLocalDateTimeToUnixSeconds,
  type LaunchPhaseKey,
} from "@/components/drop-forge/launch/drop-forge-launch-claim-page-client.helpers";
import {
  DEFAULT_PHASE_PRICE_ETH,
  getSelectedPhaseFormValues,
  runSelectedPhaseClaimAction,
} from "@/components/drop-forge/launch/launch-claim-derived-state";
import type { LaunchClaimState } from "@/components/drop-forge/launch/useLaunchClaimState";
import {
  MANIFOLD_LAZY_CLAIM_CONTRACT,
  MEMES_DEPLOYER,
  NULL_ADDRESS,
  NULL_MERKLE,
  RESEARCH_AIRDROP_ADDRESS,
} from "@/constants/constants";
import type { PhaseAirdrop } from "@/generated/models/PhaseAirdrop";
import type { ManifoldClaim } from "@/hooks/useManifoldClaim";

type AuthContextValue = ReturnType<typeof useAuth>;
type ClaimWriteResult = ReturnType<typeof useWriteContract>;
type PayArtistWriteResult = ReturnType<typeof useSendTransaction>;
type WaitReceiptResult = ReturnType<typeof useWaitForTransactionReceipt>;

interface UseLaunchClaimWritesParams {
  claimId: number;
  setToast: AuthContextValue["setToast"];
  forgeMintingChain: { id: number };
  forgeMintingContract: string;
  claimWrite: ClaimWriteResult;
  payArtistWrite: PayArtistWriteResult;
  waitClaimWrite: WaitReceiptResult;
  waitPayArtistWrite: WaitReceiptResult;
  refetchOnChainClaim: () => Promise<unknown>;
  updateMintingClaimAction: (args: {
    action: string;
    completed: boolean;
  }) => Promise<void>;
  state: LaunchClaimState;
  manifoldClaim: ManifoldClaim | null | undefined;
  phaseData: Array<{
    key: Exclude<LaunchPhaseKey, "research" | "payartist">;
    root?: { merkle_root?: string | null } | null;
  }>;
  selectedPhaseConfig: {
    key: Exclude<LaunchPhaseKey, "research" | "payartist">;
    root?: { merkle_root?: string | null } | null;
  } | null;
  isInitialized: boolean;
  researchAirdropCount: number;
  payArtistAmountWei: bigint | null;
  payArtistResolvedAddressTrimmed: string;
  payArtistAddressValid: boolean;
}

export function useLaunchClaimWrites({
  claimId,
  setToast,
  forgeMintingChain,
  forgeMintingContract,
  claimWrite,
  payArtistWrite,
  waitClaimWrite,
  waitPayArtistWrite,
  refetchOnChainClaim,
  updateMintingClaimAction,
  state,
  manifoldClaim,
  phaseData,
  selectedPhaseConfig,
  isInitialized,
  researchAirdropCount,
  payArtistAmountWei,
  payArtistResolvedAddressTrimmed,
  payArtistAddressValid,
}: Readonly<UseLaunchClaimWritesParams>) {
  const {
    claim,
    selectedPhase,
    setSelectedPhase,
    setIsPhaseSelectionManual,
    phaseAllowlistWindows,
    setPhaseAllowlistWindows,
    phasePricesEth,
    setPhasePricesEth,
    setResearchTargetEditionSize,
    payArtistAmountEth,
    setPayArtistAmountEth,
    payArtistAddressLoading,
    payArtistAddressHasEnsError,
    setClaimTxModal,
    setPayArtistTxModal,
    handledClaimWriteSuccessTxHashRef,
    handledClaimWriteErrorTxHashRef,
    handledPayArtistWriteSuccessTxHashRef,
    handledPayArtistWriteErrorTxHashRef,
    pendingMintingClaimActionRef,
    pendingPayArtistMintingClaimActionRef,
  } = state;

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

  return {
    runClaimWriteForPhase,
    runAirdropWrite,
    runResearchAirdropWrite,
    runPayArtistWrite,
    handleSelectedPhaseChange,
    handleResearchTargetEditionSizeChange,
    handleSelectedPhasePriceChange,
    handlePayArtistAmountChange,
    handleSelectedPhaseStartChange,
    handleSelectedPhaseEndChange,
    handleSelectedPhaseAction,
    selectedPhasePriceValue,
    selectedPhaseWindowStartValue,
    selectedPhaseWindowEndValue,
  };
}
