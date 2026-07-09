import type { ApiMemesMintStat } from "@/generated/models/ApiMemesMintStat";
import type { ApiMintingClaimAction } from "@/generated/models/ApiMintingClaimAction";
import type { MintingClaim } from "@/generated/models/MintingClaim";
import type { MintingClaimsRootItem } from "@/generated/models/MintingClaimsRootItem";
import type { PhaseAirdrop } from "@/generated/models/PhaseAirdrop";
import type { ManifoldClaim } from "@/hooks/useManifoldClaim";
import type { getMintTimelineDetails as getClaimTimelineDetails } from "@/components/meme-calendar/meme-calendar.helpers";
import type { ClaimPrimaryStatus } from "@/components/drop-forge/drop-forge-status.helpers";
import type { LaunchPhaseKey } from "@/components/drop-forge/launch/drop-forge-launch-claim-page-client.helpers";

export type LaunchMediaTab = "image" | "animation";

export type LaunchConfiguredPhaseKey = Exclude<
  LaunchPhaseKey,
  "research" | "payartist"
>;
export type LaunchClaimPrimaryStatus = ClaimPrimaryStatus | null;
export type LaunchClaimMintTimeline = NonNullable<
  ReturnType<typeof getClaimTimelineDetails>
>;
type LaunchAirdropActionLabel =
  | "Airdrop Artist"
  | "Airdrop Team"
  | "Airdrop Subscriptions";

export interface LaunchPhaseConfigView {
  key: LaunchConfiguredPhaseKey;
  root?: MintingClaimsRootItem | null;
}

export interface LaunchPhaseDiffsView {
  editionSize: boolean;
  cost: boolean;
  merkleRoot: boolean;
  startDate: boolean;
  endDate: boolean;
}

export interface LaunchAirdropSummaryView {
  addresses: number;
  totalAirdrops: number;
}

export interface LaunchSubscriptionAirdropSectionView {
  phaseKey: LaunchPhaseKey;
  title: string;
  loading: boolean;
  error: string | null;
  addresses: number;
  totalAirdrops: number;
  airdropEntries: PhaseAirdrop[];
  airdropCount: number;
}

export interface DropForgeLaunchClaimPermissionFallbackViewProps {
  pageTitle: string;
  permissionsLoading: boolean;
  hasWallet: boolean;
  canAccessLaunchPage: boolean;
}

interface LaunchResearchPhaseProps {
  totalMinted: number;
  researchTargetEditionSize: number;
  researchTargetEditionSizeMax: number | null;
  onResearchTargetEditionSizeChange: (value: string) => void;
  researchAirdropCount: number;
  runResearchAirdropWrite: (mintingClaimAction: string | null) => void;
}

interface LaunchPayArtistPhaseProps {
  mintStat: ApiMemesMintStat | null;
  mintStatLoading: boolean;
  mintStatError: string | null;
  payArtistAmountEth: string;
  onPayArtistAmountChange: (value: string) => void;
  payArtistAddressInput: string;
  payArtistAddressLoading: boolean;
  payArtistAddressMissing: boolean;
  payArtistAddressError: string | null;
  onPayArtistResolvedAddressChange: (value: string) => void;
  onPayArtistAddressLoadingChange: (isLoading: boolean) => void;
  onPayArtistAddressEnsErrorChange: (hasError: boolean) => void;
  payArtistActionDisabled: boolean;
  payArtistWritePending: boolean;
  runPayArtistWrite: (mintingClaimAction: string | null) => void;
}

interface LaunchSelectedPhaseConfigProps {
  selectedPhaseDiffs: LaunchPhaseDiffsView;
  changedFieldBoxClassName: string;
  changedFieldBoxLabelClassName: string;
  selectedPhasePriceValue: string;
  onSelectedPhasePriceChange: (value: string) => void;
  isPublicPhaseSelected: boolean;
  rootsLoading: boolean;
  selectedPhaseConfig: LaunchPhaseConfigView | null;
  selectedPhaseWindowStartValue: string;
  selectedPhaseWindowEndValue: string;
  onSelectedPhaseStartChange: (value: string) => void;
  onSelectedPhaseEndChange: (value: string) => void;
  selectedPhaseActionDisabled: boolean;
  onSelectedPhaseAction: () => void;
  selectedPhaseActionLabel: string;
}

interface LaunchPhase0AirdropsProps {
  showPhase0AirdropSections: boolean;
  phase0AirdropsError: string | null;
  phase0AirdropsLoading: boolean;
  artistAirdropSummary: LaunchAirdropSummaryView;
  teamAirdropSummary: LaunchAirdropSummaryView;
  artistAirdrops: PhaseAirdrop[] | null;
  teamAirdrops: PhaseAirdrop[] | null;
}

interface LaunchMintingClaimActionsProps {
  mintingClaimActionsByName: Record<string, ApiMintingClaimAction>;
  mintingClaimActionPending: string | null;
  onMintingClaimActionToggle: (
    action: string,
    completed: boolean
  ) => Promise<void>;
}

interface LaunchAirdropWriteProps {
  runAirdropWrite: (args: {
    entries: PhaseAirdrop[] | null;
    actionLabel: LaunchAirdropActionLabel | "Airdrop to Research";
    mintingClaimAction?: string | null;
  }) => void;
  subscriptionAirdropSections: LaunchSubscriptionAirdropSectionView[];
}

export type LaunchPhasePanelSharedProps = LaunchResearchPhaseProps &
  LaunchPayArtistPhaseProps &
  LaunchSelectedPhaseConfigProps &
  LaunchPhase0AirdropsProps &
  LaunchMintingClaimActionsProps &
  LaunchAirdropWriteProps;

export type LaunchPhasePanelProps = LaunchPhasePanelSharedProps & {
  claimWritePending: boolean;
  isInitialized: boolean;
  manifoldClaim: ManifoldClaim | null;
};

export type LaunchPhaseSelectionProps = {
  selectedPhase: "" | LaunchPhaseKey;
  onSelectedPhaseChange: (value: LaunchPhaseKey) => void;
};

export type RenderSelectedPhasePanelProps = {
  phasePanelProps: LaunchPhasePanelProps;
  selectedPhase: LaunchPhaseSelectionProps["selectedPhase"];
  researchAction: ApiMintingClaimAction | null;
  payArtistAction: ApiMintingClaimAction | null;
};

export type LaunchPhaseSelectionSectionProps = {
  phasePanelProps: LaunchPhasePanelProps;
  phaseSelectionProps: LaunchPhaseSelectionProps;
};

export type LaunchClaimActionsSectionProps = {
  hasPublishedMetadata: boolean;
  isMetadataOnlyUpdateMode: boolean;
  claim: MintingClaim;
  runMetadataLocationOnlyUpdate: () => void;
  phasePanelProps: LaunchPhasePanelProps;
  phaseSelectionProps: LaunchPhaseSelectionProps;
  claimId: number;
  primaryStatus: LaunchClaimPrimaryStatus;
};

export interface DropForgeLaunchClaimPageViewProps
  extends
    LaunchResearchPhaseProps,
    LaunchPayArtistPhaseProps,
    LaunchSelectedPhaseConfigProps,
    LaunchPhase0AirdropsProps,
    LaunchMintingClaimActionsProps,
    LaunchAirdropWriteProps {
  pageTitle: string;
  craftHref: string;
  loading: boolean;
  error: string | null;
  rootsError: string | null;
  claim: MintingClaim | null;
  claimId: number;
  mintTimeline: LaunchClaimMintTimeline | null;
  headerStatus: LaunchClaimPrimaryStatus;
  primaryStatus: LaunchClaimPrimaryStatus;
  hasImage: boolean;
  hasAnimation: boolean;
  activeMediaTab: LaunchMediaTab;
  setActiveMediaTab: (tab: LaunchMediaTab) => void;
  animationMimeType: string | null;
  activeMediaTypeLabel: string;
  safeClaimExternalUrl: string | null;
  isInitialized: boolean;
  onChainClaimSpinnerVisible: boolean;
  manifoldClaim: ManifoldClaim | null;
  hasPublishedMetadata: boolean;
  isMetadataOnlyUpdateMode: boolean;
  claimWritePending: boolean;
  runMetadataLocationOnlyUpdate: () => void;
  selectedPhase: "" | LaunchPhaseKey;
  onSelectedPhaseChange: (value: LaunchPhaseKey) => void;
}
