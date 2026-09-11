"use client";

import { useState } from "react";
import {
  useSendTransaction,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useAuth } from "@/components/auth/Auth";
import {
  getConnectedActionFingerprint,
  useConnectedAction,
} from "@/components/auth/useConnectedAction";
import { useDropForgeMintingConfig } from "@/components/drop-forge/drop-forge-config";
import ClaimTransactionModal from "@/components/drop-forge/launch/ClaimTransactionModal";
import {
  DropForgeLaunchClaimPageView,
  DropForgeLaunchClaimPermissionFallbackView,
} from "@/components/drop-forge/launch/DropForgeLaunchClaimPageClient.view";
import { useDropForgeManifoldClaim } from "@/hooks/useDropForgeManifoldClaim";
import { useDropForgePermissions } from "@/hooks/useDropForgePermissions";
import { useLaunchClaimDataEffects } from "@/components/drop-forge/launch/useLaunchClaimDataEffects";
import { useLaunchClaimModalActions } from "@/components/drop-forge/launch/useLaunchClaimModalActions";
import { useLaunchClaimState } from "@/components/drop-forge/launch/useLaunchClaimState";
import { useLaunchClaimViewModel } from "@/components/drop-forge/launch/useLaunchClaimViewModel";
import { useLaunchClaimWrites } from "@/components/drop-forge/launch/useLaunchClaimWrites";

interface DropForgeLaunchClaimPageClientProps {
  claimId: number;
}

const TRANSACTION_DETAILS_CHANGED_MESSAGE =
  "Transaction details changed while connecting. Review and try again.";

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
  const launchClaimState = useLaunchClaimState(claimId);
  const {
    claim,
    rootsLoading,
    rootsError,
    loading,
    error,
    activeMediaTab,
    setActiveMediaTab,
    selectedPhase,
    artistAirdrops,
    teamAirdrops,
    phase0AirdropsLoading,
    phase0AirdropsError,
    mintingClaimActionPending,
    mintStat,
    mintStatLoading,
    mintStatError,
    payArtistAmountEth,
    payArtistAddressInput,
    setPayArtistResolvedAddress,
    payArtistAddressLoading,
    setPayArtistAddressLoading,
    setPayArtistAddressHasEnsError,
  } = launchClaimState;
  const {
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
  } = useLaunchClaimDataEffects({
    claimId,
    requestAuth,
    setToast,
    hasWallet,
    permissionsLoading,
    canAccessLaunchPage,
    isClaimsAdmin,
    manifoldClaim,
    onChainClaimFetching,
    state: launchClaimState,
  });

  const {
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
  } = useLaunchClaimViewModel({
    claimId,
    state: launchClaimState,
    manifoldClaim,
    primaryStatus,
    hasPublishedMetadata,
    isInitialized,
    missingRequiredInfo,
    claimWrite,
    waitClaimWrite,
    payArtistWrite,
    waitPayArtistWrite,
  });
  // Keep this superset aligned with every value used to build a connected
  // Drop Forge write so a changed input cancels rather than resumes the action.
  const connectedActionContextFingerprint = getConnectedActionFingerprint([
    claimId,
    forgeMintingChain.id,
    forgeMintingContract,
    isInitialized,
    claim?.edition_size,
    claim?.metadata_location,
    manifoldClaim?.totalMax,
    manifoldClaim?.walletMax,
    manifoldClaim?.startDate,
    manifoldClaim?.endDate,
    manifoldClaim?.storageProtocol,
    manifoldClaim?.merkleRoot,
    manifoldClaim?.costWei,
    manifoldClaim?.paymentReceiver,
    manifoldClaim?.erc20,
    manifoldClaim?.signingAddress,
    phaseData.map((phase) => [phase.key, phase.root?.merkle_root ?? null]),
    launchClaimState.phaseAllowlistWindows,
    launchClaimState.phasePricesEth,
    selectedPhase,
    artistAirdrops,
    teamAirdrops,
    launchClaimState.subscriptionAirdropsByPhase,
    researchAirdropCount,
    payArtistAmountEth,
    payArtistAmountWei,
    payArtistAddressLoading,
    launchClaimState.payArtistAddressHasEnsError,
    payArtistResolvedAddressTrimmed,
    payArtistAddressValid,
  ]);
  const runConnectedAction = useConnectedAction({
    contextFingerprint: connectedActionContextFingerprint,
    onContextChanged: () =>
      setToast({
        message: TRANSACTION_DETAILS_CHANGED_MESSAGE,
        type: "error",
      }),
    switchToConnectedAccount: true,
  });

  const {
    runMetadataLocationOnlyUpdate,
    updateMintingClaimAction,
    handleMintingClaimActionToggle,
    activeTxModal,
    closeActiveTxModal,
    mintingClaimActionViewState,
  } = useLaunchClaimModalActions({
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
    runConnectedAction,
    state: launchClaimState,
  });

  const {
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
  } = useLaunchClaimWrites({
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
    state: launchClaimState,
    manifoldClaim,
    phaseData,
    selectedPhaseConfig,
    isInitialized,
    researchAirdropCount,
    payArtistAmountWei,
    payArtistResolvedAddressTrimmed,
    payArtistAddressValid,
    runConnectedAction,
  });

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
