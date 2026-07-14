import Link from "next/link";
import { DropForgeMetadataUpdateSection } from "@/components/drop-forge/launch/view/airdrop-sections";
import {
  DropForgeLaunchClaimArweaveSection,
  DropForgeLaunchClaimDetailsSection,
  DropForgeLaunchClaimMediaSection,
  DropForgeLaunchClaimTimelineRow,
  DropForgeLaunchClaimTraitsSection,
  DropForgeOnChainClaimSection,
} from "@/components/drop-forge/launch/view/media-details-sections";
import { DropForgePhaseSelectionSection } from "@/components/drop-forge/launch/view/phase-configuration-section";
import type {
  LaunchClaimActionsSectionProps,
  LaunchClaimPrimaryStatus,
  DropForgeLaunchClaimPageViewProps,
  LaunchPhasePanelProps,
  LaunchPhaseSelectionProps,
} from "@/components/drop-forge/launch/view/types";

function DropForgeCraftClaimPrompt({
  claimId,
  primaryStatus,
}: Readonly<{ claimId: number; primaryStatus: LaunchClaimPrimaryStatus }>) {
  return (
    <p className="tw-mb-0 tw-text-base tw-leading-snug tw-text-white">
      {primaryStatus?.key === "publishing"
        ? "Publishing to Arweave: "
        : "Finish crafting this claim before launching: "}
      <Link
        href={`/drop-forge/craft/${claimId}`}
        className="hover:tw-text-primary-200 tw-text-primary-300 tw-no-underline"
      >
        Craft #{claimId}
      </Link>
    </p>
  );
}

function DropForgeLaunchClaimActionsSection({
  hasPublishedMetadata,
  isMetadataOnlyUpdateMode,
  claim,
  runMetadataLocationOnlyUpdate,
  phasePanelProps,
  phaseSelectionProps,
  claimId,
  primaryStatus,
}: Readonly<LaunchClaimActionsSectionProps>) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-3">
      {hasPublishedMetadata && isMetadataOnlyUpdateMode && (
        <DropForgeMetadataUpdateSection
          manifoldClaim={phasePanelProps.manifoldClaim}
          metadataLocation={claim.metadata_location}
          claimWritePending={phasePanelProps.claimWritePending}
          isInitialized={phasePanelProps.isInitialized}
          onUpdate={runMetadataLocationOnlyUpdate}
        />
      )}

      {hasPublishedMetadata && !isMetadataOnlyUpdateMode && (
        <DropForgePhaseSelectionSection
          phasePanelProps={phasePanelProps}
          phaseSelectionProps={phaseSelectionProps}
        />
      )}

      {!hasPublishedMetadata && (
        <DropForgeCraftClaimPrompt
          claimId={claimId}
          primaryStatus={primaryStatus}
        />
      )}
    </div>
  );
}

type LaunchClaimContentProps = Omit<
  DropForgeLaunchClaimPageViewProps,
  "pageTitle" | "craftHref" | "loading" | "error" | "rootsError"
>;

function getLaunchPhasePanelProps(
  props: Readonly<LaunchClaimContentProps>
): LaunchPhasePanelProps {
  return {
    claimWritePending: props.claimWritePending,
    isInitialized: props.isInitialized,
    manifoldClaim: props.manifoldClaim,
    totalMinted: props.totalMinted,
    researchTargetEditionSize: props.researchTargetEditionSize,
    researchTargetEditionSizeMax: props.researchTargetEditionSizeMax,
    onResearchTargetEditionSizeChange: props.onResearchTargetEditionSizeChange,
    researchAirdropCount: props.researchAirdropCount,
    runResearchAirdropWrite: props.runResearchAirdropWrite,
    mintStat: props.mintStat,
    mintStatLoading: props.mintStatLoading,
    mintStatError: props.mintStatError,
    payArtistAmountEth: props.payArtistAmountEth,
    onPayArtistAmountChange: props.onPayArtistAmountChange,
    payArtistAddressInput: props.payArtistAddressInput,
    payArtistAddressLoading: props.payArtistAddressLoading,
    payArtistAddressMissing: props.payArtistAddressMissing,
    payArtistAddressError: props.payArtistAddressError,
    onPayArtistResolvedAddressChange: props.onPayArtistResolvedAddressChange,
    onPayArtistAddressLoadingChange: props.onPayArtistAddressLoadingChange,
    onPayArtistAddressEnsErrorChange: props.onPayArtistAddressEnsErrorChange,
    payArtistActionDisabled: props.payArtistActionDisabled,
    payArtistWritePending: props.payArtistWritePending,
    runPayArtistWrite: props.runPayArtistWrite,
    selectedPhaseDiffs: props.selectedPhaseDiffs,
    changedFieldBoxClassName: props.changedFieldBoxClassName,
    changedFieldBoxLabelClassName: props.changedFieldBoxLabelClassName,
    selectedPhasePriceValue: props.selectedPhasePriceValue,
    onSelectedPhasePriceChange: props.onSelectedPhasePriceChange,
    isPublicPhaseSelected: props.isPublicPhaseSelected,
    rootsLoading: props.rootsLoading,
    selectedPhaseConfig: props.selectedPhaseConfig,
    selectedPhaseWindowStartValue: props.selectedPhaseWindowStartValue,
    selectedPhaseWindowEndValue: props.selectedPhaseWindowEndValue,
    onSelectedPhaseStartChange: props.onSelectedPhaseStartChange,
    onSelectedPhaseEndChange: props.onSelectedPhaseEndChange,
    selectedPhaseActionDisabled: props.selectedPhaseActionDisabled,
    onSelectedPhaseAction: props.onSelectedPhaseAction,
    selectedPhaseActionLabel: props.selectedPhaseActionLabel,
    showPhase0AirdropSections: props.showPhase0AirdropSections,
    phase0AirdropsError: props.phase0AirdropsError,
    phase0AirdropsLoading: props.phase0AirdropsLoading,
    artistAirdropSummary: props.artistAirdropSummary,
    teamAirdropSummary: props.teamAirdropSummary,
    artistAirdrops: props.artistAirdrops,
    teamAirdrops: props.teamAirdrops,
    runAirdropWrite: props.runAirdropWrite,
    subscriptionAirdropSections: props.subscriptionAirdropSections,
    mintingClaimActionsByName: props.mintingClaimActionsByName,
    mintingClaimActionPending: props.mintingClaimActionPending,
    onMintingClaimActionToggle: props.onMintingClaimActionToggle,
  };
}

export default function DropForgeLaunchClaimContent(
  props: Readonly<
    Omit<
      DropForgeLaunchClaimPageViewProps,
      "pageTitle" | "craftHref" | "loading" | "error" | "rootsError"
    >
  >
) {
  const {
    claim,
    claimId,
    mintTimeline,
    headerStatus,
    primaryStatus,
    hasImage,
    hasAnimation,
    activeMediaTab,
    setActiveMediaTab,
    animationMimeType,
    activeMediaTypeLabel,
    safeClaimExternalUrl,
    isInitialized,
    onChainClaimSpinnerVisible,
    manifoldClaim,
    hasPublishedMetadata,
    isMetadataOnlyUpdateMode,
    runMetadataLocationOnlyUpdate,
  } = props;

  if (!claim) {
    return null;
  }

  const phasePanelProps = getLaunchPhasePanelProps(props);
  const phaseSelectionProps: LaunchPhaseSelectionProps = {
    selectedPhase: props.selectedPhase,
    onSelectedPhaseChange: props.onSelectedPhaseChange,
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-5 sm:tw-gap-6">
      <DropForgeLaunchClaimTimelineRow
        mintTimeline={mintTimeline}
        headerStatus={headerStatus}
      />

      <DropForgeLaunchClaimMediaSection
        claim={claim}
        hasImage={hasImage}
        hasAnimation={hasAnimation}
        activeMediaTab={activeMediaTab}
        setActiveMediaTab={setActiveMediaTab}
        animationMimeType={animationMimeType}
        activeMediaTypeLabel={activeMediaTypeLabel}
      />

      <DropForgeLaunchClaimDetailsSection
        claim={claim}
        safeClaimExternalUrl={safeClaimExternalUrl}
      />
      <DropForgeLaunchClaimTraitsSection claim={claim} />
      <DropForgeLaunchClaimArweaveSection claim={claim} />
      <DropForgeOnChainClaimSection
        isInitialized={isInitialized}
        onChainClaimSpinnerVisible={onChainClaimSpinnerVisible}
        manifoldClaim={manifoldClaim}
      />
      <DropForgeLaunchClaimActionsSection
        hasPublishedMetadata={hasPublishedMetadata}
        isMetadataOnlyUpdateMode={isMetadataOnlyUpdateMode}
        claim={claim}
        runMetadataLocationOnlyUpdate={runMetadataLocationOnlyUpdate}
        phasePanelProps={phasePanelProps}
        phaseSelectionProps={phaseSelectionProps}
        claimId={claimId}
        primaryStatus={primaryStatus}
      />
    </div>
  );
}
