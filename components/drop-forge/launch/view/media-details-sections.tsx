import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import {
  getClaimSeason,
  stringifyClaimAttributeValue,
} from "@/components/drop-forge/claimTraitsData";
import DropForgeAccordionSection from "@/components/drop-forge/DropForgeAccordionSection";
import DropForgeFieldBox from "@/components/drop-forge/DropForgeFieldBox";
import DropForgeMediaTypePill from "@/components/drop-forge/DropForgeMediaTypePill";
import DropForgeStatusPill from "@/components/drop-forge/DropForgeStatusPill";
import {
  getClaimArweaveSectionStatus,
  getPrimaryStatusPillClassName,
} from "@/components/drop-forge/drop-forge-status.helpers";
import {
  ARWEAVE_LINK_GRID_CLASS,
  DropForgeArweaveLinkCard,
  DropForgeArweaveLinkValue,
  DropForgeExternalUrlFieldValue,
} from "@/components/drop-forge/launch/view/common";
import {
  formatLocalDateTime,
  formatScheduledLabel,
} from "@/components/drop-forge/launch/drop-forge-launch-claim-page-client.helpers";
import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import { capitalizeEveryWord } from "@/helpers/Helpers";
import { formatWeiToEth } from "@/helpers/manifold-display-helpers";
import { Time } from "@/helpers/time";
import type {
  LaunchClaimMintTimeline,
  LaunchClaimPrimaryStatus,
  LaunchMediaTab,
} from "@/components/drop-forge/launch/view/types";
import type { MintingClaim } from "@/generated/models/MintingClaim";
import type { ManifoldClaim } from "@/hooks/useManifoldClaim";

export function DropForgeLaunchClaimArweaveSection({
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

export function DropForgeLaunchClaimTimelineRow({
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

export function DropForgeLaunchClaimMediaSection({
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

export function DropForgeLaunchClaimDetailsSection({
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

export function DropForgeLaunchClaimTraitsSection({
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

export function DropForgeOnChainClaimSection({
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
