"use client";

import DropForgeLaunchIcon from "@/components/common/icons/DropForgeLaunchIcon";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { getClaimSeason } from "@/components/drop-forge/claimTraitsData";
import {
  getPrimaryStatusPillClassName,
  type ClaimPrimaryStatus,
} from "@/components/drop-forge/drop-forge-status.helpers";
import DropForgeExplorerLink from "@/components/drop-forge/DropForgeExplorerLink";
import DropForgeFieldBox from "@/components/drop-forge/DropForgeFieldBox";
import DropForgeMediaTypePill from "@/components/drop-forge/DropForgeMediaTypePill";
import { DropForgePermissionFallback } from "@/components/drop-forge/DropForgePermissionFallback";
import DropForgeStatusPill from "@/components/drop-forge/DropForgeStatusPill";
import DropForgeTestnetIndicator from "@/components/drop-forge/DropForgeTestnetIndicator";
import DropForgeAccordionSection from "@/components/drop-forge/DropForgeAccordionSection";
import {
  formatLocalDateTime,
  formatScheduledLabel,
  getRootAddressesCount,
  getRootTotalSpots,
  toArweaveUrl,
} from "@/components/drop-forge/launch/dropForgeLaunchClaimPageClient.helpers";
import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import { getMintTimelineDetails as getClaimTimelineDetails } from "@/components/meme-calendar/meme-calendar.helpers";
import type { MintingClaim } from "@/generated/models/MintingClaim";
import type { MintingClaimsRootItem } from "@/generated/models/MintingClaimsRootItem";
import type { PhaseAirdrop } from "@/generated/models/PhaseAirdrop";
import { capitalizeEveryWord, fromGWEI } from "@/helpers/Helpers";
import { Time } from "@/helpers/time";
import type { ManifoldClaim } from "@/hooks/useManifoldClaim";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

type LaunchPhaseKey =
  | "phase0"
  | "phase1"
  | "phase2"
  | "publicphase"
  | "research";
type LaunchMediaTab = "image" | "animation";

const BTN_SUBSCRIPTIONS_AIRDROP =
  "tw-h-12 tw-w-full sm:tw-w-64 tw-rounded-lg tw-border-0 tw-ring-1 tw-ring-inset tw-ring-primary-400/60 tw-bg-primary-500 tw-px-5 tw-text-base tw-font-semibold tw-text-white tw-transition-colors tw-duration-150 enabled:hover:tw-bg-primary-600 enabled:hover:tw-ring-primary-300 enabled:active:tw-bg-primary-700 enabled:active:tw-ring-primary-300 disabled:tw-cursor-not-allowed disabled:tw-opacity-50";
const BTN_METADATA_UPDATE_ACTION =
  "tw-h-12 tw-w-full sm:tw-w-64 tw-rounded-lg tw-border-0 tw-bg-orange-600 tw-px-5 tw-text-base tw-font-semibold tw-text-orange-50 tw-ring-1 tw-ring-inset tw-ring-orange-300/60 tw-shadow-[0_8px_18px_rgba(234,88,12,0.25)] tw-transition-colors tw-duration-150 enabled:hover:tw-bg-orange-500 enabled:active:tw-bg-orange-700 disabled:tw-cursor-not-allowed disabled:tw-opacity-50";

type LaunchConfiguredPhaseKey = Exclude<LaunchPhaseKey, "research">;
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

interface DropForgeLaunchClaimPageViewProps {
  pageTitle: string;
  loading: boolean;
  error: string | null;
  rootsError: string | null;
  claim: MintingClaim | null;
  claimId: number;
  mintTimeline: LaunchClaimMintTimeline | null;
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
  onSelectedPhaseChange: (value: string) => void;
  totalMinted: number;
  researchTargetEditionSize: number;
  onResearchTargetEditionSizeChange: (value: string) => void;
  researchAirdropCount: number;
  runResearchAirdropWrite: () => void;
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
  showPhase0AirdropSections: boolean;
  phase0AirdropsError: string | null;
  phase0AirdropsLoading: boolean;
  artistAirdropSummary: LaunchAirdropSummaryView;
  teamAirdropSummary: LaunchAirdropSummaryView;
  artistAirdrops: PhaseAirdrop[] | null;
  teamAirdrops: PhaseAirdrop[] | null;
  runAirdropWrite: (args: {
    entries: PhaseAirdrop[] | null;
    actionLabel: LaunchAirdropActionLabel | "Airdrop to Research";
  }) => void;
  subscriptionAirdropSections: LaunchSubscriptionAirdropSectionView[];
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
}: Readonly<{ pageTitle: string }>) {
  return (
    <div className="tw-mb-6">
      <Link
        href="/drop-forge/launch"
        className="tw-inline-flex tw-w-full tw-justify-center sm:tw-w-auto sm:tw-justify-start tw-items-center tw-gap-2 tw-text-iron-400 tw-no-underline hover:tw-text-iron-50"
      >
        <ArrowLeftIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
        Back to Launch list
      </Link>
      <div className="tw-mt-2 tw-flex tw-flex-col tw-items-center tw-gap-3 sm:tw-flex-row sm:tw-items-start sm:tw-justify-between">
        <h1 className="tw-mb-0 tw-inline-flex tw-w-full tw-flex-wrap tw-items-center tw-justify-center tw-gap-2 tw-text-center sm:tw-w-auto sm:tw-justify-start sm:tw-gap-3 sm:tw-text-left tw-text-2xl sm:tw-text-3xl tw-font-semibold tw-text-iron-50">
          <DropForgeLaunchIcon className="tw-h-7 tw-w-7 sm:tw-h-8 sm:tw-w-8 tw-flex-shrink-0" />
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
  const url = toArweaveUrl(value ?? undefined);
  const text = value || "—";

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
      title={truncate ? (value ?? undefined) : undefined}
    >
      {value}
    </a>
  );
}

function DropForgeLaunchClaimTimelineRow({
  mintTimeline,
  primaryStatus,
}: Readonly<{
  mintTimeline: LaunchClaimMintTimeline | null;
  primaryStatus: LaunchClaimPrimaryStatus;
}>) {
  if (!mintTimeline) {
    return null;
  }

  return (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
      <p className="tw-mb-0 tw-text-lg sm:tw-text-xl tw-font-semibold tw-leading-tight tw-text-iron-100">
        Scheduled for {formatScheduledLabel(mintTimeline.instantUtc)}
      </p>
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
        {primaryStatus && (
          <DropForgeStatusPill
            className={getPrimaryStatusPillClassName(primaryStatus.tone)}
            label={primaryStatus.label}
            showLoader={primaryStatus.key === "publishing"}
            tooltipText={primaryStatus.reason ?? ""}
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
          <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-700/30 tw-px-3 tw-py-1 tw-text-xs sm:tw-text-sm tw-font-medium tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-500/40">
            SZN {getClaimSeason(claim) || "—"}
          </span>
          <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-700/30 tw-px-3 tw-py-1 tw-text-xs sm:tw-text-sm tw-font-medium tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-500/40">
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
            {fromGWEI(Number(manifoldClaim.costWei ?? 0n)).toFixed(5)}
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

function DropForgeAirdropSummaryActionRow({
  title,
  loading,
  summary,
  disabled,
  buttonLabel,
  onClick,
}: Readonly<{
  title: string;
  loading: boolean;
  summary: LaunchAirdropSummaryView;
  disabled: boolean;
  buttonLabel: string;
  onClick: () => void;
}>) {
  return (
    <div className="tw-space-y-5">
      <div className="tw-text-base tw-font-medium tw-text-white">{title}</div>
      <div className="tw-grid tw-grid-cols-1 tw-gap-3 lg:tw-grid-cols-[minmax(0,1fr)_auto] lg:tw-items-start lg:tw-gap-x-5">
        <DropForgeFieldBox label="Address Count / Total Airdrops">
          {loading
            ? "loading / loading"
            : `${summary.addresses.toLocaleString()} / ${summary.totalAirdrops.toLocaleString()}`}
        </DropForgeFieldBox>
        <button
          type="button"
          disabled={disabled}
          onClick={onClick}
          className={`${BTN_SUBSCRIPTIONS_AIRDROP} lg:tw-self-end`}
        >
          {buttonLabel}
        </button>
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
}>) {
  if (!visible) {
    return null;
  }

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
          })
        }
      />

      <DropForgeAirdropSummaryActionRow
        title="Team Airdrops"
        loading={phase0AirdropsLoading}
        summary={teamAirdropSummary}
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
          })
        }
      />
    </div>
  );
}

function DropForgeSubscriptionAirdropSections({
  sections,
  isInitialized,
  claimWritePending,
  runAirdropWrite,
}: Readonly<{
  sections: LaunchSubscriptionAirdropSectionView[];
  isInitialized: boolean;
  claimWritePending: boolean;
  runAirdropWrite: DropForgeLaunchClaimPageViewProps["runAirdropWrite"];
}>) {
  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="tw-space-y-5 tw-pt-3">
      {sections.map((section) => (
        <div key={section.phaseKey} className="tw-space-y-5">
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
      <div className="tw-grid tw-grid-cols-1 tw-gap-3 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:tw-items-start lg:tw-gap-x-5">
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
  onResearchTargetEditionSizeChange,
  claimWritePending,
  isInitialized,
  researchAirdropCount,
  runResearchAirdropWrite,
}: Readonly<{
  totalMinted: number;
  researchTargetEditionSize: number;
  onResearchTargetEditionSizeChange: (value: string) => void;
  claimWritePending: boolean;
  isInitialized: boolean;
  researchAirdropCount: number;
  runResearchAirdropWrite: () => void;
}>) {
  return (
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
          onChange={(e) => onResearchTargetEditionSizeChange(e.target.value)}
          className="tw-w-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-white [color-scheme:dark] focus:tw-outline-none focus:tw-ring-0"
        />
      </DropForgeFieldBox>
      <button
        type="button"
        disabled={
          claimWritePending || !isInitialized || researchAirdropCount <= 0
        }
        onClick={runResearchAirdropWrite}
        className={`${BTN_SUBSCRIPTIONS_AIRDROP} lg:tw-self-end`}
      >
        {claimWritePending
          ? "Processing..."
          : `Airdrop to Research x${researchAirdropCount.toLocaleString()}`}
      </button>
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
    <div className="tw-grid tw-grid-cols-1 tw-gap-3 tw-pt-3 lg:tw-grid-cols-2 lg:tw-gap-x-5">
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
  subscriptionAirdropSections: LaunchSubscriptionAirdropSectionView[];
}>) {
  return (
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

      <div className="tw-grid tw-grid-cols-1 tw-gap-3 tw-pt-3 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:tw-items-start lg:tw-gap-x-5">
        <DropForgeFieldBox
          label="Phase Start"
          className={
            selectedPhaseDiffs.startDate ? changedFieldBoxClassName : ""
          }
          labelClassName={
            selectedPhaseDiffs.startDate ? changedFieldBoxLabelClassName : ""
          }
        >
          <input
            type="datetime-local"
            value={selectedPhase ? selectedPhaseWindowStartValue : ""}
            onChange={(e) => onSelectedPhaseStartChange(e.target.value)}
            disabled={!selectedPhase}
            className="tw-w-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-white [color-scheme:dark] focus:tw-outline-none focus:tw-ring-0 disabled:tw-cursor-not-allowed disabled:tw-text-iron-500"
          />
        </DropForgeFieldBox>
        <DropForgeFieldBox
          label="Phase End"
          className={selectedPhaseDiffs.endDate ? changedFieldBoxClassName : ""}
          labelClassName={
            selectedPhaseDiffs.endDate ? changedFieldBoxLabelClassName : ""
          }
        >
          <input
            type="datetime-local"
            value={selectedPhase ? selectedPhaseWindowEndValue : ""}
            onChange={(e) => onSelectedPhaseEndChange(e.target.value)}
            disabled={!selectedPhase}
            className="tw-w-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-white [color-scheme:dark] focus:tw-outline-none focus:tw-ring-0 disabled:tw-cursor-not-allowed disabled:tw-text-iron-500"
          />
        </DropForgeFieldBox>
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
      />

      <DropForgeSubscriptionAirdropSections
        sections={subscriptionAirdropSections}
        isInitialized={isInitialized}
        claimWritePending={claimWritePending}
        runAirdropWrite={runAirdropWrite}
      />
    </div>
  );
}

function DropForgePhaseSelectionSection({
  selectedPhase,
  onSelectedPhaseChange,
  isInitialized,
  totalMinted,
  researchTargetEditionSize,
  onResearchTargetEditionSizeChange,
  claimWritePending,
  researchAirdropCount,
  runResearchAirdropWrite,
  manifoldClaim,
  selectedPhaseDiffs,
  changedFieldBoxClassName,
  changedFieldBoxLabelClassName,
  selectedPhasePriceValue,
  onSelectedPhasePriceChange,
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
  showPhase0AirdropSections,
  phase0AirdropsError,
  phase0AirdropsLoading,
  artistAirdropSummary,
  teamAirdropSummary,
  artistAirdrops,
  teamAirdrops,
  runAirdropWrite,
  subscriptionAirdropSections,
}: Readonly<{
  selectedPhase: "" | LaunchPhaseKey;
  onSelectedPhaseChange: (value: string) => void;
  isInitialized: boolean;
  totalMinted: number;
  researchTargetEditionSize: number;
  onResearchTargetEditionSizeChange: (value: string) => void;
  claimWritePending: boolean;
  researchAirdropCount: number;
  runResearchAirdropWrite: () => void;
  manifoldClaim: ManifoldClaim | null;
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
  showPhase0AirdropSections: boolean;
  phase0AirdropsError: string | null;
  phase0AirdropsLoading: boolean;
  artistAirdropSummary: LaunchAirdropSummaryView;
  teamAirdropSummary: LaunchAirdropSummaryView;
  artistAirdrops: PhaseAirdrop[] | null;
  teamAirdrops: PhaseAirdrop[] | null;
  runAirdropWrite: DropForgeLaunchClaimPageViewProps["runAirdropWrite"];
  subscriptionAirdropSections: LaunchSubscriptionAirdropSectionView[];
}>) {
  return (
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
          onChange={(e) => onSelectedPhaseChange(e.target.value)}
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
        <DropForgeResearchAirdropSection
          totalMinted={totalMinted}
          researchTargetEditionSize={researchTargetEditionSize}
          onResearchTargetEditionSizeChange={onResearchTargetEditionSizeChange}
          claimWritePending={claimWritePending}
          isInitialized={isInitialized}
          researchAirdropCount={researchAirdropCount}
          runResearchAirdropWrite={runResearchAirdropWrite}
        />
      ) : (
        <DropForgePhaseConfigurationSection
          manifoldClaim={manifoldClaim}
          selectedPhaseDiffs={selectedPhaseDiffs}
          changedFieldBoxClassName={changedFieldBoxClassName}
          changedFieldBoxLabelClassName={changedFieldBoxLabelClassName}
          selectedPhasePriceValue={selectedPhasePriceValue}
          onSelectedPhasePriceChange={onSelectedPhasePriceChange}
          selectedPhase={selectedPhase}
          isPublicPhaseSelected={isPublicPhaseSelected}
          rootsLoading={rootsLoading}
          selectedPhaseConfig={selectedPhaseConfig}
          selectedPhaseWindowStartValue={selectedPhaseWindowStartValue}
          selectedPhaseWindowEndValue={selectedPhaseWindowEndValue}
          onSelectedPhaseStartChange={onSelectedPhaseStartChange}
          onSelectedPhaseEndChange={onSelectedPhaseEndChange}
          selectedPhaseActionDisabled={selectedPhaseActionDisabled}
          onSelectedPhaseAction={onSelectedPhaseAction}
          selectedPhaseActionLabel={selectedPhaseActionLabel}
          claimWritePending={claimWritePending}
          showPhase0AirdropSections={showPhase0AirdropSections}
          phase0AirdropsError={phase0AirdropsError}
          phase0AirdropsLoading={phase0AirdropsLoading}
          isInitialized={isInitialized}
          artistAirdropSummary={artistAirdropSummary}
          teamAirdropSummary={teamAirdropSummary}
          artistAirdrops={artistAirdrops}
          teamAirdrops={teamAirdrops}
          runAirdropWrite={runAirdropWrite}
          subscriptionAirdropSections={subscriptionAirdropSections}
        />
      )}
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
  manifoldClaim,
  claim,
  claimWritePending,
  isInitialized,
  runMetadataLocationOnlyUpdate,
  selectedPhase,
  onSelectedPhaseChange,
  totalMinted,
  researchTargetEditionSize,
  onResearchTargetEditionSizeChange,
  researchAirdropCount,
  runResearchAirdropWrite,
  selectedPhaseDiffs,
  changedFieldBoxClassName,
  changedFieldBoxLabelClassName,
  selectedPhasePriceValue,
  onSelectedPhasePriceChange,
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
  showPhase0AirdropSections,
  phase0AirdropsError,
  phase0AirdropsLoading,
  artistAirdropSummary,
  teamAirdropSummary,
  artistAirdrops,
  teamAirdrops,
  runAirdropWrite,
  subscriptionAirdropSections,
  claimId,
  primaryStatus,
}: Readonly<{
  hasPublishedMetadata: boolean;
  isMetadataOnlyUpdateMode: boolean;
  manifoldClaim: ManifoldClaim | null;
  claim: MintingClaim;
  claimWritePending: boolean;
  isInitialized: boolean;
  runMetadataLocationOnlyUpdate: () => void;
  selectedPhase: "" | LaunchPhaseKey;
  onSelectedPhaseChange: (value: string) => void;
  totalMinted: number;
  researchTargetEditionSize: number;
  onResearchTargetEditionSizeChange: (value: string) => void;
  researchAirdropCount: number;
  runResearchAirdropWrite: () => void;
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
  showPhase0AirdropSections: boolean;
  phase0AirdropsError: string | null;
  phase0AirdropsLoading: boolean;
  artistAirdropSummary: LaunchAirdropSummaryView;
  teamAirdropSummary: LaunchAirdropSummaryView;
  artistAirdrops: PhaseAirdrop[] | null;
  teamAirdrops: PhaseAirdrop[] | null;
  runAirdropWrite: DropForgeLaunchClaimPageViewProps["runAirdropWrite"];
  subscriptionAirdropSections: LaunchSubscriptionAirdropSectionView[];
  claimId: number;
  primaryStatus: LaunchClaimPrimaryStatus;
}>) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-3">
      {hasPublishedMetadata && isMetadataOnlyUpdateMode && (
        <DropForgeMetadataUpdateSection
          manifoldClaim={manifoldClaim}
          metadataLocation={claim.metadata_location}
          claimWritePending={claimWritePending}
          isInitialized={isInitialized}
          onUpdate={runMetadataLocationOnlyUpdate}
        />
      )}

      {hasPublishedMetadata && !isMetadataOnlyUpdateMode && (
        <DropForgePhaseSelectionSection
          selectedPhase={selectedPhase}
          onSelectedPhaseChange={onSelectedPhaseChange}
          isInitialized={isInitialized}
          totalMinted={totalMinted}
          researchTargetEditionSize={researchTargetEditionSize}
          onResearchTargetEditionSizeChange={onResearchTargetEditionSizeChange}
          claimWritePending={claimWritePending}
          researchAirdropCount={researchAirdropCount}
          runResearchAirdropWrite={runResearchAirdropWrite}
          manifoldClaim={manifoldClaim}
          selectedPhaseDiffs={selectedPhaseDiffs}
          changedFieldBoxClassName={changedFieldBoxClassName}
          changedFieldBoxLabelClassName={changedFieldBoxLabelClassName}
          selectedPhasePriceValue={selectedPhasePriceValue}
          onSelectedPhasePriceChange={onSelectedPhasePriceChange}
          isPublicPhaseSelected={isPublicPhaseSelected}
          rootsLoading={rootsLoading}
          selectedPhaseConfig={selectedPhaseConfig}
          selectedPhaseWindowStartValue={selectedPhaseWindowStartValue}
          selectedPhaseWindowEndValue={selectedPhaseWindowEndValue}
          onSelectedPhaseStartChange={onSelectedPhaseStartChange}
          onSelectedPhaseEndChange={onSelectedPhaseEndChange}
          selectedPhaseActionDisabled={selectedPhaseActionDisabled}
          onSelectedPhaseAction={onSelectedPhaseAction}
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

function DropForgeLaunchClaimContent({
  claim,
  claimId,
  mintTimeline,
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
  claimWritePending,
  runMetadataLocationOnlyUpdate,
  selectedPhase,
  onSelectedPhaseChange,
  totalMinted,
  researchTargetEditionSize,
  onResearchTargetEditionSizeChange,
  researchAirdropCount,
  runResearchAirdropWrite,
  selectedPhaseDiffs,
  changedFieldBoxClassName,
  changedFieldBoxLabelClassName,
  selectedPhasePriceValue,
  onSelectedPhasePriceChange,
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
  showPhase0AirdropSections,
  phase0AirdropsError,
  phase0AirdropsLoading,
  artistAirdropSummary,
  teamAirdropSummary,
  artistAirdrops,
  teamAirdrops,
  runAirdropWrite,
  subscriptionAirdropSections,
}: Readonly<
  Omit<
    DropForgeLaunchClaimPageViewProps,
    "pageTitle" | "loading" | "error" | "rootsError"
  >
>) {
  if (!claim) {
    return null;
  }

  return (
    <div className="tw-flex tw-flex-col tw-gap-5 sm:tw-gap-6">
      <DropForgeLaunchClaimTimelineRow
        mintTimeline={mintTimeline}
        primaryStatus={primaryStatus}
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
      <DropForgeOnChainClaimSection
        isInitialized={isInitialized}
        onChainClaimSpinnerVisible={onChainClaimSpinnerVisible}
        manifoldClaim={manifoldClaim}
      />
      <DropForgeLaunchClaimActionsSection
        hasPublishedMetadata={hasPublishedMetadata}
        isMetadataOnlyUpdateMode={isMetadataOnlyUpdateMode}
        manifoldClaim={manifoldClaim}
        claim={claim}
        claimWritePending={claimWritePending}
        isInitialized={isInitialized}
        runMetadataLocationOnlyUpdate={runMetadataLocationOnlyUpdate}
        selectedPhase={selectedPhase}
        onSelectedPhaseChange={onSelectedPhaseChange}
        totalMinted={totalMinted}
        researchTargetEditionSize={researchTargetEditionSize}
        onResearchTargetEditionSizeChange={onResearchTargetEditionSizeChange}
        researchAirdropCount={researchAirdropCount}
        runResearchAirdropWrite={runResearchAirdropWrite}
        selectedPhaseDiffs={selectedPhaseDiffs}
        changedFieldBoxClassName={changedFieldBoxClassName}
        changedFieldBoxLabelClassName={changedFieldBoxLabelClassName}
        selectedPhasePriceValue={selectedPhasePriceValue}
        onSelectedPhasePriceChange={onSelectedPhasePriceChange}
        isPublicPhaseSelected={isPublicPhaseSelected}
        rootsLoading={rootsLoading}
        selectedPhaseConfig={selectedPhaseConfig}
        selectedPhaseWindowStartValue={selectedPhaseWindowStartValue}
        selectedPhaseWindowEndValue={selectedPhaseWindowEndValue}
        onSelectedPhaseStartChange={onSelectedPhaseStartChange}
        onSelectedPhaseEndChange={onSelectedPhaseEndChange}
        selectedPhaseActionDisabled={selectedPhaseActionDisabled}
        onSelectedPhaseAction={onSelectedPhaseAction}
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
        claimId={claimId}
        primaryStatus={primaryStatus}
      />
    </div>
  );
}

export function DropForgeLaunchClaimPageView({
  pageTitle,
  loading,
  error,
  rootsError,
  ...contentProps
}: Readonly<DropForgeLaunchClaimPageViewProps>) {
  return (
    <div className="tw-px-2 tw-pb-16 tw-pt-2 lg:tw-px-6 lg:tw-pt-8 xl:tw-px-8">
      <DropForgeLaunchClaimHeader pageTitle={pageTitle} />
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
