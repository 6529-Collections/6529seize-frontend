"use client";

import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import Toggle from "react-toggle";
import DropForgeLaunchIcon from "@/components/common/icons/DropForgeLaunchIcon";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import {
  getClaimSeason,
  stringifyClaimAttributeValue,
} from "@/components/drop-forge/claimTraitsData";
import {
  type ClaimPrimaryStatus,
  getClaimArweaveSectionStatus,
  getPrimaryStatusPillClassName,
} from "@/components/drop-forge/drop-forge-status.helpers";
import { getDropForgeStorageLocationInfo } from "@/components/drop-forge/drop-forge-storage-location.helpers";
import DropForgeAccordionSection from "@/components/drop-forge/DropForgeAccordionSection";
import DropForgeExplorerLink from "@/components/drop-forge/DropForgeExplorerLink";
import DropForgeFieldBox from "@/components/drop-forge/DropForgeFieldBox";
import DropForgeMediaTypePill from "@/components/drop-forge/DropForgeMediaTypePill";
import { DropForgePermissionFallback } from "@/components/drop-forge/DropForgePermissionFallback";
import DropForgeStorageLinkCard from "@/components/drop-forge/DropForgeStorageLinkCard";
import DropForgeStatusPill from "@/components/drop-forge/DropForgeStatusPill";
import DropForgeTestnetIndicator from "@/components/drop-forge/DropForgeTestnetIndicator";
import {
  findBestMatchingLaunchActionName,
  formatLocalDateTime,
  formatScheduledLabel,
  getRootAddressesCount,
  getRootTotalSpots,
  type LaunchPhaseKey,
} from "@/components/drop-forge/launch/drop-forge-launch-claim-page-client.helpers";
import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import { getMintTimelineDetails as getClaimTimelineDetails } from "@/components/meme-calendar/meme-calendar.helpers";
import EnsAddressInput from "@/components/utils/input/ens-address/EnsAddressInput";
import type { ApiMemesMintStat } from "@/generated/models/ApiMemesMintStat";
import type { ApiMintingClaimAction } from "@/generated/models/ApiMintingClaimAction";
import type { MintingClaim } from "@/generated/models/MintingClaim";
import type { MintingClaimsRootItem } from "@/generated/models/MintingClaimsRootItem";
import type { PhaseAirdrop } from "@/generated/models/PhaseAirdrop";
import { capitalizeEveryWord } from "@/helpers/Helpers";
import { formatWeiToEth } from "@/helpers/manifold-display-helpers";
import { Time } from "@/helpers/time";
import type { ManifoldClaim } from "@/hooks/useManifoldClaim";

type LaunchMediaTab = "image" | "animation";

const BTN_SUBSCRIPTIONS_AIRDROP =
  "tw-h-12 tw-w-full lg:tw-w-64 tw-rounded-lg tw-border-0 tw-ring-1 tw-ring-inset tw-ring-primary-400/60 tw-bg-primary-500 tw-px-5 tw-text-base tw-font-semibold tw-text-white tw-transition-colors tw-duration-150 enabled:hover:tw-bg-primary-600 enabled:hover:tw-ring-primary-300 enabled:active:tw-bg-primary-700 enabled:active:tw-ring-primary-300 disabled:tw-cursor-not-allowed disabled:tw-opacity-50";
const BTN_METADATA_UPDATE_ACTION =
  "tw-h-12 tw-w-full lg:tw-w-64 tw-rounded-lg tw-border-0 tw-bg-orange-600 tw-px-5 tw-text-base tw-font-semibold tw-text-orange-50 tw-ring-1 tw-ring-inset tw-ring-orange-300/60 tw-shadow-[0_8px_18px_rgba(234,88,12,0.25)] tw-transition-colors tw-duration-150 enabled:hover:tw-bg-orange-500 enabled:active:tw-bg-orange-700 disabled:tw-cursor-not-allowed disabled:tw-opacity-50";
const ARWEAVE_LINK_GRID_CLASS =
  "tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2 lg:tw-grid-cols-3";
const ARWEAVE_LINK_CARD_CLASS =
  "tw-flex tw-flex-col tw-items-stretch tw-gap-2 tw-rounded-lg tw-bg-iron-900/60 tw-px-4 tw-py-3 tw-ring-1 tw-ring-inset tw-ring-iron-800";

type LaunchConfiguredPhaseKey = Exclude<
  LaunchPhaseKey,
  "research" | "payartist"
>;
type LaunchClaimPrimaryStatus = ClaimPrimaryStatus | null;
type LaunchClaimMintTimeline = NonNullable<
  ReturnType<typeof getClaimTimelineDetails>
>;
type LaunchAirdropActionLabel =
  | "Airdrop Artist"
  | "Airdrop Team"
  | "Airdrop Subscriptions";

interface LaunchPhaseConfigView {
  key: LaunchConfiguredPhaseKey;
  root?: MintingClaimsRootItem | null;
}

interface LaunchPhaseDiffsView {
  editionSize: boolean;
  cost: boolean;
  merkleRoot: boolean;
  startDate: boolean;
  endDate: boolean;
}

interface LaunchAirdropSummaryView {
  addresses: number;
  totalAirdrops: number;
}

interface LaunchSubscriptionAirdropSectionView {
  phaseKey: LaunchPhaseKey;
  title: string;
  loading: boolean;
  error: string | null;
  addresses: number;
  totalAirdrops: number;
  airdropEntries: PhaseAirdrop[];
  airdropCount: number;
}

interface DropForgeLaunchClaimPermissionFallbackViewProps {
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

type LaunchPhasePanelSharedProps = LaunchResearchPhaseProps &
  LaunchPayArtistPhaseProps &
  LaunchSelectedPhaseConfigProps &
  LaunchPhase0AirdropsProps &
  LaunchMintingClaimActionsProps &
  LaunchAirdropWriteProps;

type LaunchPhasePanelProps = LaunchPhasePanelSharedProps & {
  claimWritePending: boolean;
  isInitialized: boolean;
  manifoldClaim: ManifoldClaim | null;
};

type LaunchPhaseSelectionProps = {
  selectedPhase: "" | LaunchPhaseKey;
  onSelectedPhaseChange: (value: LaunchPhaseKey) => void;
};

type RenderSelectedPhasePanelProps = {
  phasePanelProps: LaunchPhasePanelProps;
  selectedPhase: LaunchPhaseSelectionProps["selectedPhase"];
  researchAction: ApiMintingClaimAction | null;
  payArtistAction: ApiMintingClaimAction | null;
};

type LaunchPhaseSelectionSectionProps = {
  phasePanelProps: LaunchPhasePanelProps;
  phaseSelectionProps: LaunchPhaseSelectionProps;
};

type LaunchClaimActionsSectionProps = {
  hasPublishedMetadata: boolean;
  isMetadataOnlyUpdateMode: boolean;
  claim: MintingClaim;
  runMetadataLocationOnlyUpdate: () => void;
  phasePanelProps: LaunchPhasePanelProps;
  phaseSelectionProps: LaunchPhaseSelectionProps;
  claimId: number;
  primaryStatus: LaunchClaimPrimaryStatus;
};

interface DropForgeLaunchClaimPageViewProps
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

const MINT_STAT_LOADING_LABEL = "loading...";

const LAUNCH_PHASE_TAB_BASE_CLASSES =
  "tw-inline-flex tw-h-12 tw-w-full tw-items-center tw-justify-center tw-rounded-xl tw-border-0 tw-px-4 tw-text-center tw-text-sm tw-font-semibold tw-transition tw-duration-150";
const LAUNCH_PHASE_TAB_ACTIVE_CLASSES =
  "tw-bg-primary-500 tw-text-white tw-shadow-[0_12px_28px_rgba(59,130,246,0.28)]";
const LAUNCH_PHASE_TAB_INACTIVE_CLASSES =
  "tw-bg-iron-900/80 tw-text-iron-200 enabled:hover:tw-bg-iron-800 enabled:hover:tw-text-iron-50";
const LAUNCH_PHASE_TAB_DISABLED_CLASSES =
  "disabled:tw-cursor-not-allowed disabled:tw-bg-iron-900/50 disabled:tw-text-iron-500";

interface LaunchPhaseTabDefinition {
  readonly key: LaunchPhaseKey;
  readonly label: string;
  readonly subLabel?: string;
  readonly alwaysEnabled?: boolean;
}

const LAUNCH_PHASE_TABS: readonly LaunchPhaseTabDefinition[] = [
  {
    key: "phase0",
    label: "Phase 0",
    subLabel: "- Initialize",
    alwaysEnabled: true,
  },
  { key: "phase1", label: "Phase 1" },
  { key: "phase2", label: "Phase 2" },
  { key: "publicphase", label: "Public Phase" },
  { key: "research", label: "Airdrop Research" },
  { key: "payartist", label: "Pay Artist" },
];

function LaunchPhaseTabButton({
  tab,
  selectedPhase,
  isInitialized,
  onSelectedPhaseChange,
}: Readonly<{
  tab: LaunchPhaseTabDefinition;
  selectedPhase: "" | LaunchPhaseKey;
  isInitialized: boolean;
  onSelectedPhaseChange: (value: LaunchPhaseKey) => void;
}>) {
  const isSelected = selectedPhase === tab.key;
  const disabled = !tab.alwaysEnabled && !isInitialized;
  const stateClass = isSelected
    ? LAUNCH_PHASE_TAB_ACTIVE_CLASSES
    : LAUNCH_PHASE_TAB_INACTIVE_CLASSES;
  const gapClass = tab.subLabel ? " tw-gap-1" : "";
  const disabledClass = tab.alwaysEnabled
    ? ""
    : ` ${LAUNCH_PHASE_TAB_DISABLED_CLASSES}`;
  const className = `${LAUNCH_PHASE_TAB_BASE_CLASSES}${gapClass} ${stateClass}${disabledClass}`;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      aria-controls={`phase-panel-${tab.key}`}
      disabled={disabled}
      onClick={() => onSelectedPhaseChange(tab.key)}
      className={className}
    >
      {tab.subLabel ? (
        <>
          <span>{tab.label}</span>
          <span className="tw-hidden lg:tw-inline">{tab.subLabel}</span>
        </>
      ) : (
        tab.label
      )}
    </button>
  );
}

function getPayArtistSalesLabel(mintStat: ApiMemesMintStat | null): string {
  if (!mintStat) {
    return "—";
  }

  return `${mintStat.total_count.toLocaleString()} (${mintStat.subscriptions_count.toLocaleString()} / ${mintStat.mint_count.toLocaleString()})`;
}

function DropForgePhaseDateTimeField({
  label,
  value,
  onChange,
  isPhaseSelected,
  changed,
  changedFieldBoxClassName,
  changedFieldBoxLabelClassName,
}: Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  isPhaseSelected: boolean;
  changed: boolean;
  changedFieldBoxClassName: string;
  changedFieldBoxLabelClassName: string;
}>) {
  return (
    <DropForgeFieldBox
      label={label}
      className={changed ? changedFieldBoxClassName : ""}
      labelClassName={changed ? changedFieldBoxLabelClassName : ""}
    >
      <input
        type="datetime-local"
        value={isPhaseSelected ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={!isPhaseSelected}
        className="tw-w-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-white [color-scheme:dark] focus:tw-outline-none focus:tw-ring-0 disabled:tw-cursor-not-allowed disabled:tw-text-iron-500"
      />
    </DropForgeFieldBox>
  );
}

function renderSelectedPhasePanel({
  phasePanelProps,
  selectedPhase,
  researchAction,
  payArtistAction,
}: Readonly<RenderSelectedPhasePanelProps>) {
  if (selectedPhase === "research") {
    return (
      <DropForgeResearchAirdropSection
        {...phasePanelProps}
        researchAction={researchAction}
      />
    );
  }

  if (selectedPhase === "payartist") {
    return (
      <DropForgePayArtistSection
        {...phasePanelProps}
        payArtistAction={payArtistAction}
      />
    );
  }

  return (
    <DropForgePhaseConfigurationSection
      {...phasePanelProps}
      selectedPhase={selectedPhase}
    />
  );
}

function DropForgeLaunchPageTitleRight() {
  return (
    <div className="tw-flex tw-w-full tw-flex-wrap tw-items-center tw-justify-center tw-gap-2 sm:tw-w-auto sm:tw-justify-end">
      <DropForgeExplorerLink />
      <DropForgeTestnetIndicator />
    </div>
  );
}

export function DropForgeLaunchClaimPermissionFallbackView({
  pageTitle,
  permissionsLoading,
  hasWallet,
  canAccessLaunchPage,
}: Readonly<DropForgeLaunchClaimPermissionFallbackViewProps>) {
  return (
    <DropForgePermissionFallback
      title={pageTitle}
      permissionsLoading={permissionsLoading}
      hasWallet={hasWallet}
      hasAccess={canAccessLaunchPage}
      titleIcon={DropForgeLaunchIcon}
      titleRight={<DropForgeLaunchPageTitleRight />}
    />
  );
}

function DropForgeLaunchClaimHeader({
  pageTitle,
  craftHref,
}: Readonly<{ pageTitle: string; craftHref: string }>) {
  return (
    <div className="tw-mb-6">
      <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center sm:tw-gap-4">
        <Link
          href="/drop-forge/launch"
          className="tw-inline-flex tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-text-iron-400 tw-no-underline hover:tw-text-iron-50 sm:tw-w-auto sm:tw-justify-start"
        >
          <ArrowLeftIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
          Back to Launch list
        </Link>
        <Link
          href={craftHref}
          className="tw-inline-flex tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-text-iron-400 tw-no-underline hover:tw-text-iron-50 sm:tw-ml-auto sm:tw-w-auto sm:tw-justify-start"
        >
          <ArrowTopRightOnSquareIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
          Go to Craft
        </Link>
      </div>
      <div className="tw-mt-2 tw-flex tw-flex-col tw-items-center tw-gap-3 sm:tw-flex-row sm:tw-items-start sm:tw-justify-between">
        <h1 className="tw-mb-0 tw-inline-flex tw-w-full tw-flex-wrap tw-items-center tw-justify-center tw-gap-2 tw-text-center tw-text-2xl tw-font-semibold tw-text-iron-50 sm:tw-w-auto sm:tw-justify-start sm:tw-gap-3 sm:tw-text-left sm:tw-text-3xl">
          <DropForgeLaunchIcon className="tw-h-7 tw-w-7 tw-flex-shrink-0 sm:tw-h-8 sm:tw-w-8" />
          <span className="tw-break-words">{pageTitle}</span>
        </h1>
        <DropForgeLaunchPageTitleRight />
      </div>
    </div>
  );
}

function DropForgeExternalUrlFieldValue({
  externalUrl,
  safeExternalUrl,
}: Readonly<{
  externalUrl: string | null | undefined;
  safeExternalUrl: string | null;
}>) {
  if (!externalUrl) {
    return "—";
  }

  if (!safeExternalUrl) {
    return <span className="tw-break-all">{externalUrl}</span>;
  }

  return (
    <a
      href={safeExternalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:tw-text-primary-200 tw-break-all tw-text-primary-300 tw-no-underline"
    >
      {externalUrl}
    </a>
  );
}

function DropForgeArweaveLinkValue({
  value,
  truncate = false,
}: Readonly<{ value: string | null | undefined; truncate?: boolean }>) {
  const locationInfo = getDropForgeStorageLocationInfo(value);
  const url = locationInfo?.openUrl ?? null;
  const text = (locationInfo?.displayValue ?? value) || "—";

  if (!url) {
    return text;
  }

  const className = truncate
    ? "hover:tw-text-primary-200 tw-block tw-max-w-full tw-truncate tw-text-primary-300 tw-no-underline"
    : "hover:tw-text-primary-200 tw-text-primary-300 tw-no-underline";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      title={
        truncate
          ? (locationInfo?.displayTitle ?? value ?? undefined)
          : undefined
      }
    >
      {text}
    </a>
  );
}

function DropForgeArweaveLinkCard({
  label,
  value,
}: Readonly<{ label: string; value: string | null | undefined }>) {
  return (
    <DropForgeStorageLinkCard
      label={label}
      value={value}
      cardClassName={ARWEAVE_LINK_CARD_CLASS}
      labelClassName="tw-min-w-0 tw-text-base tw-text-iron-200"
    />
  );
}

function DropForgeLaunchClaimArweaveSection({
  claim,
}: Readonly<{
  claim: MintingClaim;
}>) {
  const arweaveStatus = getClaimArweaveSectionStatus(claim);
  const hasArweaveLinks = Boolean(
    claim.image_location || claim.animation_location || claim.metadata_location
  );

  return (
    <DropForgeAccordionSection
      title="Arweave"
      subtitle=""
      tone="neutral"
      defaultOpen={false}
      headerRight={
        <DropForgeStatusPill
          className={getPrimaryStatusPillClassName(arweaveStatus.tone)}
          label={arweaveStatus.label}
          showLoader={arweaveStatus.key === "publishing"}
          tooltipText={arweaveStatus.reason ?? ""}
        />
      }
      showHeaderRightWhenOpen
      showHeaderRightWhenClosed
      childrenClassName="tw-space-y-5"
    >
      {hasArweaveLinks ? (
        <div className={ARWEAVE_LINK_GRID_CLASS}>
          <DropForgeArweaveLinkCard
            label="Image"
            value={claim.image_location}
          />
          <DropForgeArweaveLinkCard
            label="Animation"
            value={claim.animation_location}
          />
          <DropForgeArweaveLinkCard
            label="Metadata"
            value={claim.metadata_location}
          />
        </div>
      ) : (
        <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
          No published links yet.
        </p>
      )}
    </DropForgeAccordionSection>
  );
}

function DropForgeLaunchClaimTimelineRow({
  mintTimeline,
  headerStatus,
}: Readonly<{
  mintTimeline: LaunchClaimMintTimeline | null;
  headerStatus: LaunchClaimPrimaryStatus;
}>) {
  if (!mintTimeline) {
    return null;
  }

  return (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
      <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-leading-tight tw-text-iron-100 sm:tw-text-xl">
        Scheduled for {formatScheduledLabel(mintTimeline.instantUtc)}
      </p>
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
        {headerStatus && (
          <DropForgeStatusPill
            className={getPrimaryStatusPillClassName(headerStatus.tone)}
            label={headerStatus.label}
            showLoader={
              headerStatus.key === "publishing" ||
              headerStatus.key === "checking_onchain"
            }
            showCheck={headerStatus.tone === "finalized"}
            tooltipText={headerStatus.reason ?? ""}
          />
        )}
      </div>
    </div>
  );
}

function DropForgeLaunchClaimMediaDisplayContent({
  claim,
  activeMediaTab,
  hasImage,
  hasAnimation,
  animationMimeType,
}: Readonly<{
  claim: MintingClaim;
  activeMediaTab: LaunchMediaTab;
  hasImage: boolean;
  hasAnimation: boolean;
  animationMimeType: string | null;
}>) {
  if (activeMediaTab === "animation" && hasAnimation && animationMimeType) {
    return (
      <MediaDisplay
        media_mime_type={animationMimeType}
        media_url={claim.animation_url ?? ""}
        fillVideoContainer
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
}

function DropForgeLaunchClaimMediaSection({
  claim,
  hasImage,
  hasAnimation,
  activeMediaTab,
  setActiveMediaTab,
  animationMimeType,
  activeMediaTypeLabel,
}: Readonly<{
  claim: MintingClaim;
  hasImage: boolean;
  hasAnimation: boolean;
  activeMediaTab: LaunchMediaTab;
  setActiveMediaTab: (tab: LaunchMediaTab) => void;
  animationMimeType: string | null;
  activeMediaTypeLabel: string;
}>) {
  if (!hasImage && !hasAnimation) {
    return null;
  }

  return (
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
        <DropForgeLaunchClaimMediaDisplayContent
          claim={claim}
          activeMediaTab={activeMediaTab}
          hasImage={hasImage}
          hasAnimation={hasAnimation}
          animationMimeType={animationMimeType}
        />
      </div>
      <div className="tw-flex tw-justify-center">
        <DropForgeMediaTypePill label={activeMediaTypeLabel} />
      </div>
    </DropForgeAccordionSection>
  );
}

function DropForgeLaunchClaimDetailsSection({
  claim,
  safeClaimExternalUrl,
}: Readonly<{ claim: MintingClaim; safeClaimExternalUrl: string | null }>) {
  return (
    <DropForgeAccordionSection
      title="Details"
      subtitle=""
      tone="neutral"
      defaultOpen={false}
      headerRight={
        <div className="tw-inline-flex tw-flex-wrap tw-items-center tw-gap-2">
          <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-700/30 tw-px-3 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-500/40 sm:tw-text-sm">
            SZN {getClaimSeason(claim) || "—"}
          </span>
          <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-700/30 tw-px-3 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-500/40 sm:tw-text-sm">
            Edition Size {claim.edition_size ?? "—"}
          </span>
        </div>
      }
      childrenClassName="tw-space-y-5"
    >
      <div className="tw-grid tw-grid-cols-1 tw-gap-x-4 tw-gap-y-6 sm:tw-grid-cols-2">
        <DropForgeFieldBox label="Artwork Title" className="sm:tw-col-span-2">
          <span className="tw-break-words">{claim.name || "—"}</span>
        </DropForgeFieldBox>
        <DropForgeFieldBox label="Description" className="sm:tw-col-span-2">
          <span className="tw-whitespace-pre-wrap tw-break-words">
            {claim.description || "—"}
          </span>
        </DropForgeFieldBox>
        <DropForgeFieldBox label="External URL" className="sm:tw-col-span-2">
          <DropForgeExternalUrlFieldValue
            externalUrl={claim.external_url}
            safeExternalUrl={safeClaimExternalUrl}
          />
        </DropForgeFieldBox>
      </div>
    </DropForgeAccordionSection>
  );
}

function DropForgeLaunchClaimTraitsSection({
  claim,
}: Readonly<{ claim: MintingClaim }>) {
  return (
    <DropForgeAccordionSection
      title="Traits"
      subtitle=""
      tone="neutral"
      defaultOpen={false}
      childrenClassName="tw-space-y-5"
    >
      {claim.attributes?.length ? (
        <div className="tw-grid tw-grid-cols-1 tw-gap-x-4 tw-gap-y-6 sm:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-4">
          {claim.attributes.map((attribute, index) => {
            const attributeValue = stringifyClaimAttributeValue(
              attribute.value
            ).trim();
            return (
              <DropForgeFieldBox
                key={`${attribute.trait_type ?? "trait"}-${index}`}
                label={attribute.trait_type || "Trait"}
              >
                {attributeValue || "—"}
              </DropForgeFieldBox>
            );
          })}
        </div>
      ) : (
        <p className="tw-mb-0 tw-text-sm tw-text-iron-400">No traits found.</p>
      )}
    </DropForgeAccordionSection>
  );
}

function DropForgeOnChainClaimSection({
  isInitialized,
  onChainClaimSpinnerVisible,
  manifoldClaim,
}: Readonly<{
  isInitialized: boolean;
  onChainClaimSpinnerVisible: boolean;
  manifoldClaim: ManifoldClaim | null;
}>) {
  return (
    <DropForgeAccordionSection
      title={
        isInitialized ? "On-Chain Claim" : "On-Chain Claim - Not Initialized"
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
            {formatWeiToEth(manifoldClaim.costWei ?? 0n)}
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
              <DropForgeArweaveLinkValue value={manifoldClaim.location} />
            </span>
          </DropForgeFieldBox>
          <DropForgeFieldBox label="Start Date">
            {formatLocalDateTime(
              Time.seconds(manifoldClaim.startDate).toDate()
            )}
          </DropForgeFieldBox>
          <DropForgeFieldBox label="End Date">
            {formatLocalDateTime(Time.seconds(manifoldClaim.endDate).toDate())}
          </DropForgeFieldBox>
        </div>
      ) : (
        <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
          On-chain claim data is not available.
        </p>
      )}
    </DropForgeAccordionSection>
  );
}

function DropForgeActionCompletionToggle({
  action,
  disabled,
  ariaLabel,
  onToggle,
}: Readonly<{
  action: ApiMintingClaimAction | null | undefined;
  disabled: boolean;
  ariaLabel: string;
  onToggle: (action: string, completed: boolean) => Promise<void>;
}>) {
  if (!action) {
    return null;
  }

  return (
    <div className="tw-inline-flex tw-items-center tw-gap-3">
      <span className="tw-text-sm tw-text-iron-400">Completed</span>
      <Toggle
        checked={action.completed}
        disabled={disabled}
        icons={false}
        aria-label={ariaLabel}
        onChange={() => {
          void onToggle(action.action, action.completed);
        }}
      />
    </div>
  );
}

function DropForgeAirdropSummaryActionRow({
  title,
  loading,
  summary,
  isInitialized,
  disabled,
  buttonLabel,
  onClick,
  action,
  claimWritePending,
  actionPending,
  onActionToggle,
}: Readonly<{
  title: string;
  loading: boolean;
  summary: LaunchAirdropSummaryView;
  isInitialized: boolean;
  disabled: boolean;
  buttonLabel: string;
  onClick: () => void;
  action?: ApiMintingClaimAction | null;
  claimWritePending: boolean;
  actionPending: string | null;
  onActionToggle: (action: string, completed: boolean) => Promise<void>;
}>) {
  const isCompleted = action?.completed ?? false;
  const isActionToggleDisabled =
    !isInitialized || claimWritePending || actionPending !== null;

  return (
    <div className="tw-space-y-5">
      <DropForgeSectionTitleWithToggle
        title={title}
        action={action}
        toggleDisabled={isActionToggleDisabled}
        toggleAriaLabel={`${title} completed`}
        onActionToggle={onActionToggle}
      />
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-[minmax(0,1fr)_auto] lg:tw-items-start lg:tw-gap-x-5">
        <DropForgeFieldBox label="Address Count / Total Airdrops">
          {loading
            ? "loading / loading"
            : `${summary.addresses.toLocaleString()} / ${summary.totalAirdrops.toLocaleString()}`}
        </DropForgeFieldBox>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4 lg:tw-self-end">
          <button
            type="button"
            disabled={disabled || isCompleted || actionPending !== null}
            onClick={onClick}
            className={BTN_SUBSCRIPTIONS_AIRDROP}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function DropForgePhase0AirdropsSection({
  visible,
  phase0AirdropsError,
  phase0AirdropsLoading,
  isInitialized,
  claimWritePending,
  artistAirdropSummary,
  teamAirdropSummary,
  artistAirdrops,
  teamAirdrops,
  runAirdropWrite,
  mintingClaimActionsByName,
  mintingClaimActionPending,
  onMintingClaimActionToggle,
}: Readonly<{
  visible: boolean;
  phase0AirdropsError: string | null;
  phase0AirdropsLoading: boolean;
  isInitialized: boolean;
  claimWritePending: boolean;
  artistAirdropSummary: LaunchAirdropSummaryView;
  teamAirdropSummary: LaunchAirdropSummaryView;
  artistAirdrops: PhaseAirdrop[] | null;
  teamAirdrops: PhaseAirdrop[] | null;
  runAirdropWrite: DropForgeLaunchClaimPageViewProps["runAirdropWrite"];
  mintingClaimActionsByName: Record<string, ApiMintingClaimAction>;
  mintingClaimActionPending: string | null;
  onMintingClaimActionToggle: (
    action: string,
    completed: boolean
  ) => Promise<void>;
}>) {
  if (!visible) {
    return null;
  }

  const availableActionNames = Object.keys(mintingClaimActionsByName);
  const artistActionName = findBestMatchingLaunchActionName(
    availableActionNames,
    "artist"
  );
  const teamActionName = findBestMatchingLaunchActionName(
    availableActionNames,
    "team"
  );
  const artistAction = artistActionName
    ? (mintingClaimActionsByName[artistActionName] ?? null)
    : null;
  const teamAction = teamActionName
    ? (mintingClaimActionsByName[teamActionName] ?? null)
    : null;

  return (
    <div className="tw-space-y-5 tw-pt-3">
      {phase0AirdropsError && (
        <p className="tw-mb-0 tw-text-sm tw-text-rose-300">
          {phase0AirdropsError}
        </p>
      )}

      <DropForgeAirdropSummaryActionRow
        title="Artist Airdrops"
        loading={phase0AirdropsLoading}
        summary={artistAirdropSummary}
        isInitialized={isInitialized}
        disabled={
          !isInitialized ||
          claimWritePending ||
          phase0AirdropsLoading ||
          artistAirdropSummary.totalAirdrops <= 0
        }
        buttonLabel={`Airdrop Artist x${artistAirdropSummary.totalAirdrops.toLocaleString()}`}
        onClick={() =>
          runAirdropWrite({
            entries: artistAirdrops,
            actionLabel: "Airdrop Artist",
            mintingClaimAction: artistActionName,
          })
        }
        action={artistAction}
        claimWritePending={claimWritePending}
        actionPending={mintingClaimActionPending}
        onActionToggle={onMintingClaimActionToggle}
      />

      <DropForgeAirdropSummaryActionRow
        title="Team Airdrops"
        loading={phase0AirdropsLoading}
        summary={teamAirdropSummary}
        isInitialized={isInitialized}
        disabled={
          !isInitialized ||
          claimWritePending ||
          phase0AirdropsLoading ||
          teamAirdropSummary.totalAirdrops <= 0
        }
        buttonLabel={`Airdrop Team x${teamAirdropSummary.totalAirdrops.toLocaleString()}`}
        onClick={() =>
          runAirdropWrite({
            entries: teamAirdrops,
            actionLabel: "Airdrop Team",
            mintingClaimAction: teamActionName,
          })
        }
        action={teamAction}
        claimWritePending={claimWritePending}
        actionPending={mintingClaimActionPending}
        onActionToggle={onMintingClaimActionToggle}
      />
    </div>
  );
}

function DropForgeSubscriptionAirdropSections({
  sections,
  isInitialized,
  claimWritePending,
  runAirdropWrite,
  mintingClaimActionsByName,
  mintingClaimActionPending,
  onMintingClaimActionToggle,
}: Readonly<{
  sections: LaunchSubscriptionAirdropSectionView[];
  isInitialized: boolean;
  claimWritePending: boolean;
  runAirdropWrite: DropForgeLaunchClaimPageViewProps["runAirdropWrite"];
  mintingClaimActionsByName: Record<string, ApiMintingClaimAction>;
  mintingClaimActionPending: string | null;
  onMintingClaimActionToggle: (
    action: string,
    completed: boolean
  ) => Promise<void>;
}>) {
  if (sections.length === 0) {
    return null;
  }

  const availableActionNames = Object.keys(mintingClaimActionsByName);

  return (
    <div className="tw-space-y-5 tw-pt-3">
      {sections.map((section) => {
        const actionName = findBestMatchingLaunchActionName(
          availableActionNames,
          section.phaseKey
        );
        const action = actionName
          ? (mintingClaimActionsByName[actionName] ?? null)
          : null;
        const buttonLabel =
          section.airdropCount > 0
            ? `Airdrop Subscriptions x${section.airdropCount.toLocaleString()}`
            : "Airdrop Subscriptions";
        return (
          <div key={section.phaseKey} className="tw-space-y-5">
            {section.error ? (
              <p className="tw-mb-0 tw-text-sm tw-text-rose-300">
                {section.error}
              </p>
            ) : null}
            <DropForgeAirdropSummaryActionRow
              title={section.title}
              loading={section.loading}
              summary={section}
              isInitialized={isInitialized}
              disabled={
                !isInitialized ||
                claimWritePending ||
                section.loading ||
                section.airdropCount <= 0
              }
              buttonLabel={buttonLabel}
              onClick={() =>
                runAirdropWrite({
                  entries: section.airdropEntries,
                  actionLabel: "Airdrop Subscriptions",
                  mintingClaimAction: actionName,
                })
              }
              action={action}
              claimWritePending={claimWritePending}
              actionPending={mintingClaimActionPending}
              onActionToggle={onMintingClaimActionToggle}
            />
          </div>
        );
      })}
    </div>
  );
}

function DropForgeMetadataUpdateSection({
  manifoldClaim,
  metadataLocation,
  claimWritePending,
  isInitialized,
  onUpdate,
}: Readonly<{
  manifoldClaim: ManifoldClaim | null;
  metadataLocation: string | null | undefined;
  claimWritePending: boolean;
  isInitialized: boolean;
  onUpdate: () => void;
}>) {
  return (
    <div className="tw-space-y-4">
      <div className="tw-text-base tw-font-semibold tw-text-white">
        Metadata Changed
      </div>
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:tw-items-start lg:tw-gap-x-5">
        <DropForgeFieldBox
          label="On-Chain Metadata"
          contentClassName="tw-text-sm"
        >
          <span className="tw-block tw-max-w-full tw-truncate">
            <DropForgeArweaveLinkValue
              value={manifoldClaim?.location}
              truncate
            />
          </span>
        </DropForgeFieldBox>
        <DropForgeFieldBox
          label="Updated Metadata"
          contentClassName="tw-text-sm"
        >
          <span className="tw-block tw-max-w-full tw-truncate">
            <DropForgeArweaveLinkValue value={metadataLocation} truncate />
          </span>
        </DropForgeFieldBox>
        <button
          type="button"
          disabled={
            claimWritePending ||
            !isInitialized ||
            !manifoldClaim ||
            !metadataLocation
          }
          onClick={onUpdate}
          className={`${BTN_METADATA_UPDATE_ACTION} lg:tw-self-end`}
        >
          {claimWritePending ? "Processing..." : "Update On-Chain"}
        </button>
      </div>
    </div>
  );
}

function DropForgeResearchAirdropSection({
  totalMinted,
  researchTargetEditionSize,
  researchTargetEditionSizeMax,
  onResearchTargetEditionSizeChange,
  claimWritePending,
  isInitialized,
  researchAirdropCount,
  runResearchAirdropWrite,
  researchAction,
  mintingClaimActionPending,
  onMintingClaimActionToggle,
}: Readonly<{
  totalMinted: number;
  researchTargetEditionSize: number;
  researchTargetEditionSizeMax: number | null;
  onResearchTargetEditionSizeChange: (value: string) => void;
  claimWritePending: boolean;
  isInitialized: boolean;
  researchAirdropCount: number;
  runResearchAirdropWrite: (mintingClaimAction: string | null) => void;
  researchAction?: ApiMintingClaimAction | null;
  mintingClaimActionPending: string | null;
  onMintingClaimActionToggle: (
    action: string,
    completed: boolean
  ) => Promise<void>;
}>) {
  const isCompleted = researchAction?.completed ?? false;
  const isActionToggleDisabled =
    !isInitialized || claimWritePending || mintingClaimActionPending !== null;
  const researchActionName = researchAction?.action ?? null;
  const researchButtonCountSuffix =
    researchAirdropCount > 0
      ? ` x${researchAirdropCount.toLocaleString()}`
      : "";

  return (
    <div className="tw-space-y-5 tw-pt-4">
      <DropForgeSectionTitleWithToggle
        title="Research Airdrop"
        action={researchAction}
        toggleDisabled={isActionToggleDisabled}
        toggleAriaLabel="Research airdrop completed"
        onActionToggle={onMintingClaimActionToggle}
      />
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:tw-items-start lg:tw-gap-x-5">
        <DropForgeFieldBox label="Total Minted">
          {totalMinted.toLocaleString()}
        </DropForgeFieldBox>
        <DropForgeFieldBox label="Target Edition Size">
          <input
            type="number"
            inputMode="numeric"
            min="0"
            max={researchTargetEditionSizeMax ?? undefined}
            step="1"
            value={researchTargetEditionSize}
            onChange={(e) => onResearchTargetEditionSizeChange(e.target.value)}
            className="tw-w-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-white [color-scheme:dark] focus:tw-outline-none focus:tw-ring-0"
          />
        </DropForgeFieldBox>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4 lg:tw-self-end">
          <button
            type="button"
            disabled={
              claimWritePending ||
              mintingClaimActionPending !== null ||
              !isInitialized ||
              researchAirdropCount <= 0 ||
              isCompleted
            }
            onClick={() => runResearchAirdropWrite(researchActionName)}
            className={BTN_SUBSCRIPTIONS_AIRDROP}
          >
            {claimWritePending
              ? "Processing..."
              : `Airdrop to Research${researchButtonCountSuffix}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatMintStatEth(value: number | null | undefined): string {
  if (value == null) {
    return "—";
  }
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) {
    return "—";
  }
  return normalized.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  });
}

interface PayArtistDisplayState {
  isMintStatPending: boolean;
  amountClassName: string;
  amountLabelClassName: string;
  addressClassName: string;
  addressLabelClassName: string;
  mintStatLoadingClassName: string;
}

function getPayArtistDisplayState({
  mintStat,
  mintStatLoading,
  mintStatError,
  payArtistAmountEth,
  payArtistAddressMissing,
}: Readonly<{
  mintStat: ApiMemesMintStat | null;
  mintStatLoading: boolean;
  mintStatError: string | null;
  payArtistAmountEth: string;
  payArtistAddressMissing: boolean;
}>): PayArtistDisplayState {
  const isMintStatResolved = mintStat !== null || mintStatError !== null;
  const isMintStatPending = !isMintStatResolved || mintStatLoading;
  const amountInvalid = !isMintStatPending && payArtistAmountEth.trim() === "";
  const addressInvalid = !isMintStatPending && payArtistAddressMissing;
  return {
    isMintStatPending,
    amountClassName: amountInvalid ? "tw-ring-rose-500/70" : "",
    amountLabelClassName: amountInvalid
      ? "tw-text-rose-300 tw-ring-rose-500/70"
      : "",
    addressClassName: addressInvalid ? "tw-ring-rose-500/70" : "",
    addressLabelClassName: addressInvalid
      ? "tw-text-rose-300 tw-ring-rose-500/70"
      : "",
    mintStatLoadingClassName: isMintStatPending ? "!tw-text-iron-500" : "",
  };
}

function DropForgeSectionTitleWithToggle({
  title,
  action,
  toggleDisabled,
  toggleAriaLabel,
  onActionToggle,
}: Readonly<{
  title: string;
  action: ApiMintingClaimAction | null | undefined;
  toggleDisabled: boolean;
  toggleAriaLabel: string;
  onActionToggle: (action: string, completed: boolean) => Promise<void>;
}>) {
  return (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
      <div className="tw-text-base tw-font-medium tw-text-white">{title}</div>
      <DropForgeActionCompletionToggle
        action={action}
        disabled={toggleDisabled}
        ariaLabel={toggleAriaLabel}
        onToggle={onActionToggle}
      />
    </div>
  );
}

function DropForgePayArtistDesignatedPayeeNote({
  paymentDetails,
}: Readonly<{
  paymentDetails: ApiMemesMintStat["payment_details"] | null;
}>) {
  if (
    !paymentDetails?.has_designated_payee ||
    !paymentDetails.designated_payee_name
  ) {
    return null;
  }
  return (
    <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
      Designated payee:{" "}
      <span className="tw-text-iron-200">
        {paymentDetails.designated_payee_name}
      </span>
    </p>
  );
}

function DropForgePayArtistSalesField({
  label,
  isMintStatPending,
  mintStatLoadingClassName,
  children,
}: Readonly<{
  label: string;
  isMintStatPending: boolean;
  mintStatLoadingClassName: string;
  children: React.ReactNode;
}>) {
  return (
    <DropForgeFieldBox
      label={label}
      contentClassName={mintStatLoadingClassName}
    >
      {isMintStatPending ? MINT_STAT_LOADING_LABEL : children}
    </DropForgeFieldBox>
  );
}

function DropForgePayArtistSalesRow({
  mintStat,
  isMintStatPending,
  mintStatLoadingClassName,
}: Readonly<{
  mintStat: ApiMemesMintStat | null;
  isMintStatPending: boolean;
  mintStatLoadingClassName: string;
}>) {
  return (
    <div className="tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-3 lg:tw-gap-x-5">
      <DropForgePayArtistSalesField
        label="Total Sales (Subscriptions / Mints)"
        isMintStatPending={isMintStatPending}
        mintStatLoadingClassName={mintStatLoadingClassName}
      >
        {getPayArtistSalesLabel(mintStat)}
      </DropForgePayArtistSalesField>
      <DropForgePayArtistSalesField
        label="Proceeds (ETH)"
        isMintStatPending={isMintStatPending}
        mintStatLoadingClassName={mintStatLoadingClassName}
      >
        {formatMintStatEth(mintStat?.proceeds_eth)}
      </DropForgePayArtistSalesField>
      <DropForgePayArtistSalesField
        label="Artist Split (ETH)"
        isMintStatPending={isMintStatPending}
        mintStatLoadingClassName={mintStatLoadingClassName}
      >
        {formatMintStatEth(mintStat?.artist_split_eth)}
      </DropForgePayArtistSalesField>
    </div>
  );
}

function DropForgePayArtistAmountField({
  payArtistAmountEth,
  onPayArtistAmountChange,
  isMintStatPending,
  displayState,
}: Readonly<{
  payArtistAmountEth: string;
  onPayArtistAmountChange: (value: string) => void;
  isMintStatPending: boolean;
  displayState: PayArtistDisplayState;
}>) {
  return (
    <DropForgeFieldBox
      label="Pay Artist (ETH)"
      className={displayState.amountClassName}
      labelClassName={displayState.amountLabelClassName}
      contentClassName={displayState.mintStatLoadingClassName}
    >
      {isMintStatPending ? (
        MINT_STAT_LOADING_LABEL
      ) : (
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.0001"
          value={payArtistAmountEth}
          onChange={(e) => onPayArtistAmountChange(e.target.value)}
          placeholder="Enter ETH Amount"
          className="tw-w-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-white [color-scheme:dark] focus:tw-outline-none focus:tw-ring-0"
        />
      )}
    </DropForgeFieldBox>
  );
}

function DropForgePayArtistAddressField({
  payArtistAddressInput,
  payArtistAddressLoading,
  payArtistAddressError,
  onPayArtistResolvedAddressChange,
  onPayArtistAddressLoadingChange,
  onPayArtistAddressEnsErrorChange,
  isMintStatPending,
  displayState,
}: Readonly<{
  payArtistAddressInput: string;
  payArtistAddressLoading: boolean;
  payArtistAddressError: string | null;
  onPayArtistResolvedAddressChange: (value: string) => void;
  onPayArtistAddressLoadingChange: (isLoading: boolean) => void;
  onPayArtistAddressEnsErrorChange: (hasError: boolean) => void;
  isMintStatPending: boolean;
  displayState: PayArtistDisplayState;
}>) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-1.5">
      <DropForgeFieldBox
        label="Payment Address"
        className={displayState.addressClassName}
        labelClassName={displayState.addressLabelClassName}
        contentClassName={displayState.mintStatLoadingClassName}
      >
        {isMintStatPending ? (
          MINT_STAT_LOADING_LABEL
        ) : (
          <EnsAddressInput
            value={payArtistAddressInput}
            placeholder="0x... or ENS"
            onAddressChange={onPayArtistResolvedAddressChange}
            onLoadingChange={onPayArtistAddressLoadingChange}
            onError={onPayArtistAddressEnsErrorChange}
            className="tw-h-auto tw-w-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-white tw-placeholder-iron-500 tw-shadow-none [color-scheme:dark] focus:tw-bg-transparent focus:tw-text-white focus:tw-shadow-none focus:tw-outline-none focus:tw-ring-0"
          />
        )}
      </DropForgeFieldBox>
      {payArtistAddressLoading ? (
        <span className="tw-px-1 tw-text-xs tw-text-iron-400">
          Resolving ENS…
        </span>
      ) : null}
      {payArtistAddressError ? (
        <span className="tw-px-1 tw-text-xs tw-text-rose-300">
          {payArtistAddressError}
        </span>
      ) : null}
    </div>
  );
}

function DropForgePayArtistActionButton({
  disabled,
  pending,
  onClick,
}: Readonly<{
  disabled: boolean;
  pending: boolean;
  onClick: () => void;
}>) {
  return (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4 lg:tw-self-start">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={BTN_SUBSCRIPTIONS_AIRDROP}
      >
        {pending ? "Processing..." : "Pay Artist"}
      </button>
    </div>
  );
}

function DropForgePayArtistSection({
  mintStat,
  mintStatLoading,
  mintStatError,
  payArtistAmountEth,
  onPayArtistAmountChange,
  payArtistAddressInput,
  payArtistAddressLoading,
  payArtistAddressMissing,
  payArtistAddressError,
  onPayArtistResolvedAddressChange,
  onPayArtistAddressLoadingChange,
  onPayArtistAddressEnsErrorChange,
  payArtistActionDisabled,
  payArtistWritePending,
  runPayArtistWrite,
  payArtistAction,
  mintingClaimActionPending,
  onMintingClaimActionToggle,
}: Readonly<{
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
  payArtistAction?: ApiMintingClaimAction | null;
  mintingClaimActionPending: string | null;
  onMintingClaimActionToggle: (
    action: string,
    completed: boolean
  ) => Promise<void>;
}>) {
  const isCompleted = payArtistAction?.completed ?? false;
  const isActionToggleDisabled =
    payArtistWritePending || mintingClaimActionPending !== null;
  const payArtistActionName = payArtistAction?.action ?? null;
  const paymentDetails = mintStat?.payment_details ?? null;
  const displayState = getPayArtistDisplayState({
    mintStat,
    mintStatLoading,
    mintStatError,
    payArtistAmountEth,
    payArtistAddressMissing,
  });
  const { isMintStatPending, mintStatLoadingClassName } = displayState;
  const isButtonDisabled =
    payArtistActionDisabled ||
    isCompleted ||
    mintingClaimActionPending !== null;

  return (
    <div className="tw-space-y-5 tw-pt-4">
      <DropForgeSectionTitleWithToggle
        title="Pay Artist"
        action={payArtistAction}
        toggleDisabled={isActionToggleDisabled}
        toggleAriaLabel="Pay artist completed"
        onActionToggle={onMintingClaimActionToggle}
      />

      {mintStatError ? (
        <p className="tw-mb-0 tw-text-sm tw-text-rose-300">{mintStatError}</p>
      ) : null}

      <DropForgePayArtistDesignatedPayeeNote paymentDetails={paymentDetails} />

      <DropForgePayArtistSalesRow
        mintStat={mintStat}
        isMintStatPending={isMintStatPending}
        mintStatLoadingClassName={mintStatLoadingClassName}
      />

      <div className="tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-[minmax(0,0.6fr)_minmax(0,2.4fr)_auto] lg:tw-items-start lg:tw-gap-x-5">
        <DropForgePayArtistAmountField
          payArtistAmountEth={payArtistAmountEth}
          onPayArtistAmountChange={onPayArtistAmountChange}
          isMintStatPending={isMintStatPending}
          displayState={displayState}
        />
        <DropForgePayArtistAddressField
          payArtistAddressInput={payArtistAddressInput}
          payArtistAddressLoading={payArtistAddressLoading}
          payArtistAddressError={payArtistAddressError}
          onPayArtistResolvedAddressChange={onPayArtistResolvedAddressChange}
          onPayArtistAddressLoadingChange={onPayArtistAddressLoadingChange}
          onPayArtistAddressEnsErrorChange={onPayArtistAddressEnsErrorChange}
          isMintStatPending={isMintStatPending}
          displayState={displayState}
        />
        <DropForgePayArtistActionButton
          disabled={isButtonDisabled}
          pending={payArtistWritePending}
          onClick={() => runPayArtistWrite(payArtistActionName)}
        />
      </div>
    </div>
  );
}

function DropForgePhaseRootInfoSection({
  isPublicPhaseSelected,
  selectedPhaseDiffs,
  changedFieldBoxClassName,
  changedFieldBoxLabelClassName,
  rootsLoading,
  selectedPhaseConfig,
}: Readonly<{
  isPublicPhaseSelected: boolean;
  selectedPhaseDiffs: LaunchPhaseDiffsView;
  changedFieldBoxClassName: string;
  changedFieldBoxLabelClassName: string;
  rootsLoading: boolean;
  selectedPhaseConfig: LaunchPhaseConfigView | null;
}>) {
  if (isPublicPhaseSelected) {
    return null;
  }

  return (
    <div className="tw-grid tw-grid-cols-1 tw-gap-4 tw-pt-3 lg:tw-grid-cols-2 lg:tw-gap-x-5">
      <DropForgeFieldBox
        label="Merkle Root"
        className={
          selectedPhaseDiffs.merkleRoot ? changedFieldBoxClassName : ""
        }
        labelClassName={
          selectedPhaseDiffs.merkleRoot ? changedFieldBoxLabelClassName : ""
        }
        contentClassName="tw-break-all tw-text-sm"
      >
        <span>
          {rootsLoading && !selectedPhaseConfig?.root ? (
            <span className="tw-text-iron-400">loading</span>
          ) : (
            (selectedPhaseConfig?.root?.merkle_root ?? (
              <span className="tw-text-rose-300">missing</span>
            ))
          )}
        </span>
      </DropForgeFieldBox>
      <DropForgeFieldBox label="Address Count / Total Spots">
        {rootsLoading && !selectedPhaseConfig?.root ? (
          <span className="tw-text-iron-400">loading / loading</span>
        ) : (
          <span className="tw-inline-flex tw-items-center">
            <span>
              {getRootAddressesCount(selectedPhaseConfig?.root) ?? (
                <span className="tw-text-rose-300">missing</span>
              )}
            </span>
            <span className="tw-px-1">/</span>
            <span>
              {getRootTotalSpots(selectedPhaseConfig?.root) ?? (
                <span className="tw-text-rose-300">missing</span>
              )}
            </span>
          </span>
        )}
      </DropForgeFieldBox>
    </div>
  );
}

function DropForgePhaseConfigurationSection({
  manifoldClaim,
  selectedPhaseDiffs,
  changedFieldBoxClassName,
  changedFieldBoxLabelClassName,
  selectedPhasePriceValue,
  onSelectedPhasePriceChange,
  selectedPhase,
  isPublicPhaseSelected,
  rootsLoading,
  selectedPhaseConfig,
  selectedPhaseWindowStartValue,
  selectedPhaseWindowEndValue,
  onSelectedPhaseStartChange,
  onSelectedPhaseEndChange,
  selectedPhaseActionDisabled,
  onSelectedPhaseAction,
  selectedPhaseActionLabel,
  claimWritePending,
  showPhase0AirdropSections,
  phase0AirdropsError,
  phase0AirdropsLoading,
  isInitialized,
  artistAirdropSummary,
  teamAirdropSummary,
  artistAirdrops,
  teamAirdrops,
  runAirdropWrite,
  mintingClaimActionsByName,
  mintingClaimActionPending,
  onMintingClaimActionToggle,
  subscriptionAirdropSections,
}: Readonly<{
  manifoldClaim: ManifoldClaim | null;
  selectedPhaseDiffs: LaunchPhaseDiffsView;
  changedFieldBoxClassName: string;
  changedFieldBoxLabelClassName: string;
  selectedPhasePriceValue: string;
  onSelectedPhasePriceChange: (value: string) => void;
  selectedPhase: "" | LaunchPhaseKey;
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
  claimWritePending: boolean;
  showPhase0AirdropSections: boolean;
  phase0AirdropsError: string | null;
  phase0AirdropsLoading: boolean;
  isInitialized: boolean;
  artistAirdropSummary: LaunchAirdropSummaryView;
  teamAirdropSummary: LaunchAirdropSummaryView;
  artistAirdrops: PhaseAirdrop[] | null;
  teamAirdrops: PhaseAirdrop[] | null;
  runAirdropWrite: DropForgeLaunchClaimPageViewProps["runAirdropWrite"];
  mintingClaimActionsByName: Record<string, ApiMintingClaimAction>;
  mintingClaimActionPending: string | null;
  onMintingClaimActionToggle: (
    action: string,
    completed: boolean
  ) => Promise<void>;
  subscriptionAirdropSections: LaunchSubscriptionAirdropSectionView[];
}>) {
  return (
    <div className="tw-space-y-5 tw-pt-2">
      <div className="tw-text-base tw-font-medium tw-text-white">
        Phase Configuration
      </div>
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-2 lg:tw-gap-x-5">
        <DropForgeFieldBox label="Remaining Editions">
          {manifoldClaim?.remaining ?? "—"}
        </DropForgeFieldBox>
        <DropForgeFieldBox
          label="Cost (ETH)"
          className={selectedPhaseDiffs.cost ? changedFieldBoxClassName : ""}
          labelClassName={
            selectedPhaseDiffs.cost ? changedFieldBoxLabelClassName : ""
          }
        >
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.00001"
            value={selectedPhase ? selectedPhasePriceValue : ""}
            onChange={(e) => onSelectedPhasePriceChange(e.target.value)}
            disabled={!selectedPhase}
            className="tw-w-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-white [color-scheme:dark] focus:tw-outline-none focus:tw-ring-0 disabled:tw-cursor-not-allowed disabled:tw-text-iron-500"
          />
        </DropForgeFieldBox>
      </div>

      <DropForgePhaseRootInfoSection
        isPublicPhaseSelected={isPublicPhaseSelected}
        selectedPhaseDiffs={selectedPhaseDiffs}
        changedFieldBoxClassName={changedFieldBoxClassName}
        changedFieldBoxLabelClassName={changedFieldBoxLabelClassName}
        rootsLoading={rootsLoading}
        selectedPhaseConfig={selectedPhaseConfig}
      />

      <div className="tw-grid tw-grid-cols-1 tw-gap-4 tw-pt-3 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:tw-items-start lg:tw-gap-x-5">
        <DropForgePhaseDateTimeField
          label="Phase Start"
          value={selectedPhaseWindowStartValue}
          onChange={onSelectedPhaseStartChange}
          isPhaseSelected={Boolean(selectedPhase)}
          changed={selectedPhaseDiffs.startDate}
          changedFieldBoxClassName={changedFieldBoxClassName}
          changedFieldBoxLabelClassName={changedFieldBoxLabelClassName}
        />
        <DropForgePhaseDateTimeField
          label="Phase End"
          value={selectedPhaseWindowEndValue}
          onChange={onSelectedPhaseEndChange}
          isPhaseSelected={Boolean(selectedPhase)}
          changed={selectedPhaseDiffs.endDate}
          changedFieldBoxClassName={changedFieldBoxClassName}
          changedFieldBoxLabelClassName={changedFieldBoxLabelClassName}
        />
        <button
          type="button"
          disabled={selectedPhaseActionDisabled}
          onClick={onSelectedPhaseAction}
          className={`${BTN_SUBSCRIPTIONS_AIRDROP} lg:tw-self-end`}
        >
          {claimWritePending ? "Processing..." : selectedPhaseActionLabel}
        </button>
      </div>

      <DropForgePhase0AirdropsSection
        visible={showPhase0AirdropSections}
        phase0AirdropsError={phase0AirdropsError}
        phase0AirdropsLoading={phase0AirdropsLoading}
        isInitialized={isInitialized}
        claimWritePending={claimWritePending}
        artistAirdropSummary={artistAirdropSummary}
        teamAirdropSummary={teamAirdropSummary}
        artistAirdrops={artistAirdrops}
        teamAirdrops={teamAirdrops}
        runAirdropWrite={runAirdropWrite}
        mintingClaimActionsByName={mintingClaimActionsByName}
        mintingClaimActionPending={mintingClaimActionPending}
        onMintingClaimActionToggle={onMintingClaimActionToggle}
      />

      <DropForgeSubscriptionAirdropSections
        sections={subscriptionAirdropSections}
        isInitialized={isInitialized}
        claimWritePending={claimWritePending}
        runAirdropWrite={runAirdropWrite}
        mintingClaimActionsByName={mintingClaimActionsByName}
        mintingClaimActionPending={mintingClaimActionPending}
        onMintingClaimActionToggle={onMintingClaimActionToggle}
      />
    </div>
  );
}

function DropForgePhaseSelectionSection({
  phasePanelProps,
  phaseSelectionProps: { selectedPhase, onSelectedPhaseChange },
}: Readonly<LaunchPhaseSelectionSectionProps>) {
  const researchActionName = findBestMatchingLaunchActionName(
    Object.keys(phasePanelProps.mintingClaimActionsByName),
    "research"
  );
  const researchAction = researchActionName
    ? (phasePanelProps.mintingClaimActionsByName[researchActionName] ?? null)
    : null;
  const payArtistActionName = findBestMatchingLaunchActionName(
    Object.keys(phasePanelProps.mintingClaimActionsByName),
    "payartist"
  );
  const payArtistAction = payArtistActionName
    ? (phasePanelProps.mintingClaimActionsByName[payArtistActionName] ?? null)
    : null;

  return (
    <>
      <div className="tw-text-base tw-font-semibold tw-text-iron-50">
        Phase Selection
      </div>
      <div
        role="tablist"
        aria-label="Phase selection"
        className="tw-grid tw-grid-cols-2 tw-gap-2 tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950/70 tw-p-2 sm:tw-grid-cols-3 lg:tw-grid-cols-6"
      >
        {LAUNCH_PHASE_TABS.map((tab) => (
          <LaunchPhaseTabButton
            key={tab.key}
            tab={tab}
            selectedPhase={selectedPhase}
            isInitialized={phasePanelProps.isInitialized}
            onSelectedPhaseChange={onSelectedPhaseChange}
          />
        ))}
      </div>
      <div className="tw-min-h-[18rem] lg:tw-min-h-[30rem]">
        {renderSelectedPhasePanel({
          phasePanelProps,
          selectedPhase,
          researchAction,
          payArtistAction,
        })}
      </div>
    </>
  );
}

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

function DropForgeLaunchClaimContent(
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

export function DropForgeLaunchClaimPageView({
  pageTitle,
  craftHref,
  loading,
  error,
  rootsError,
  ...contentProps
}: Readonly<DropForgeLaunchClaimPageViewProps>) {
  return (
    <div className="tw-px-2 tw-pb-16 tw-pt-2 lg:tw-px-6 lg:tw-pt-8 xl:tw-px-8">
      <DropForgeLaunchClaimHeader pageTitle={pageTitle} craftHref={craftHref} />
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
      <DropForgeLaunchClaimContent {...contentProps} />
    </div>
  );
}
