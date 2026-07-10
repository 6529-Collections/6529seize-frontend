"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/Auth";
import DropForgeCraftIcon from "@/components/common/icons/DropForgeCraftIcon";
import DropForgeAccordionSection from "@/components/drop-forge/DropForgeAccordionSection";
import DropForgeMediaTypePill from "@/components/drop-forge/DropForgeMediaTypePill";
import { DropForgePermissionFallback } from "@/components/drop-forge/DropForgePermissionFallback";
import DropForgeStatusPill from "@/components/drop-forge/DropForgeStatusPill";
import DropForgeTestnetIndicator from "@/components/drop-forge/DropForgeTestnetIndicator";
import { getClaimSeason } from "@/components/drop-forge/claimTraitsData";
import {
  getDropForgeAnimationMediaTypeLabel,
  getDropForgeImageMediaTypeLabel,
} from "@/components/drop-forge/drop-forge-media-type.helpers";
import {
  getClaimArweaveSectionStatus,
  getPrimaryStatusPillClassName,
} from "@/components/drop-forge/drop-forge-status.helpers";
import DropForgeCraftClaimHeader from "@/components/drop-forge/craft/CraftClaimHeader";
import {
  getErrorMessage,
  PAGE_CONTAINER_CLASS,
} from "@/components/drop-forge/craft/craft-claim-helpers";
import AnimationSection from "@/components/drop-forge/craft/sections/AnimationSection";
import ArweaveSection from "@/components/drop-forge/craft/sections/ArweaveSection";
import CoreInformationSection from "@/components/drop-forge/craft/sections/CoreInformationSection";
import DistributionSection from "@/components/drop-forge/craft/sections/DistributionSection";
import ImageSection from "@/components/drop-forge/craft/sections/ImageSection";
import MetadataSection from "@/components/drop-forge/craft/sections/MetadataSection";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import type { MintingClaim } from "@/generated/models/MintingClaim";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { useDropForgePermissions } from "@/hooks/useDropForgePermissions";
import { getClaim } from "@/services/api/memes-minting-claims-api";

export default function DropForgeCraftClaimPageClient({
  claimId,
}: Readonly<{
  claimId: number;
}>) {
  const { setToast } = useAuth();
  const { seizeSettings } = useSeizeSettings();
  const { hasWallet, permissionsLoading, canAccessCraft } =
    useDropForgePermissions();
  const pageTitle = `Craft Claim #${claimId}`;

  const [claim, setClaim] = useState<MintingClaim | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageDirty, setImageDirty] = useState(false);
  const [animationDirty, setAnimationDirty] = useState(false);
  const [coreInfoDirty, setCoreInfoDirty] = useState(false);
  const [metadataDirty, setMetadataDirty] = useState(false);
  const [
    distributionSummariesRefreshNonce,
    setDistributionSummariesRefreshNonce,
  ] = useState(0);

  const fetchClaim = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const c = await getClaim(claimId);
      setClaim(c);
    } catch (e) {
      const msg = getErrorMessage(e, "Failed to load claim");
      setError(msg);
      if (
        msg.toLowerCase().includes("not found") ||
        msg === "Claim not found"
      ) {
        setError("Claim not found");
      } else {
        setToast({
          type: "error",
          title: "Couldn't load this claim.",
          description: "Please try again.",
          details: msg,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [claimId, setToast]);

  useEffect(() => {
    if (!hasWallet || !canAccessCraft) return;
    fetchClaim();
  }, [hasWallet, canAccessCraft, fetchClaim]);

  if (permissionsLoading || !hasWallet || !canAccessCraft) {
    return (
      <DropForgePermissionFallback
        title={pageTitle}
        permissionsLoading={permissionsLoading}
        hasWallet={hasWallet}
        hasAccess={canAccessCraft}
        titleIcon={DropForgeCraftIcon}
        titleRight={<DropForgeTestnetIndicator className="tw-flex-shrink-0" />}
      />
    );
  }

  if (loading && !claim) {
    return (
      <div className={PAGE_CONTAINER_CLASS}>
        <DropForgeCraftClaimHeader pageTitle={pageTitle} />
        <p className="tw-mb-0 tw-text-iron-400">Loading…</p>
      </div>
    );
  }

  if (error && !claim) {
    return (
      <div className={PAGE_CONTAINER_CLASS}>
        <DropForgeCraftClaimHeader pageTitle={pageTitle} />
        <p className="tw-mb-0 tw-text-rose-300" role="alert">
          {error}
        </p>
      </div>
    );
  }

  if (!claim) return null;

  const craftDropHref =
    seizeSettings.memes_wave_id && claim.drop_id
      ? getWaveRoute({
          waveId: seizeSettings.memes_wave_id,
          extraParams: { drop: claim.drop_id },
          isDirectMessage: false,
          isApp: false,
        })
      : undefined;

  const hasPendingPageChanges =
    imageDirty || animationDirty || coreInfoDirty || metadataDirty;
  const hasAnimation = Boolean(claim.animation_url);
  const imageMediaTypeLabel = getDropForgeImageMediaTypeLabel(claim);
  const animationMediaTypeLabel = getDropForgeAnimationMediaTypeLabel(claim);
  const coreInformationHeaderPills = (
    <span className="tw-inline-flex tw-items-center tw-gap-2">
      <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-700/30 tw-px-3 tw-py-1 tw-text-sm tw-font-medium tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-500/40">
        SZN {getClaimSeason(claim) || "—"}
      </span>
      <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-700/30 tw-px-3 tw-py-1 tw-text-sm tw-font-medium tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-500/40">
        Edition Size {claim.edition_size ?? "—"}
      </span>
    </span>
  );
  const arweavePrimaryStatus = getClaimArweaveSectionStatus(claim);
  const arweaveHeaderPill = (
    <DropForgeStatusPill
      className={getPrimaryStatusPillClassName(arweavePrimaryStatus.tone)}
      label={arweavePrimaryStatus.label}
      showLoader={arweavePrimaryStatus.key === "publishing"}
      tooltipText={arweavePrimaryStatus.reason ?? ""}
    />
  );

  return (
    <div className={PAGE_CONTAINER_CLASS}>
      <DropForgeCraftClaimHeader
        pageTitle={pageTitle}
        dropHref={craftDropHref}
      />

      <div className="tw-flex tw-flex-col tw-gap-5">
        <DropForgeAccordionSection
          title="Image"
          defaultOpen
          headerRight={
            imageMediaTypeLabel ? (
              <DropForgeMediaTypePill label={imageMediaTypeLabel} />
            ) : null
          }
          showHeaderRightWhenOpen
          showHeaderRightWhenClosed
        >
          <ImageSection
            claim={claim}
            claimId={claimId}
            onUpdated={setClaim}
            onPendingChange={setImageDirty}
          />
        </DropForgeAccordionSection>

        <DropForgeAccordionSection
          title="Animation"
          defaultOpen={hasAnimation}
          headerRight={
            animationMediaTypeLabel ? (
              <DropForgeMediaTypePill label={animationMediaTypeLabel} />
            ) : null
          }
          showHeaderRightWhenOpen
          showHeaderRightWhenClosed
        >
          <AnimationSection
            claim={claim}
            claimId={claimId}
            onUpdated={setClaim}
            onPendingChange={setAnimationDirty}
          />
        </DropForgeAccordionSection>

        <DropForgeAccordionSection
          title="Core Information"
          defaultOpen
          headerRight={coreInformationHeaderPills}
          showHeaderRightWhenClosed
        >
          <CoreInformationSection
            claim={claim}
            claimId={claimId}
            onUpdated={setClaim}
            onPendingChange={setCoreInfoDirty}
            onEditionSizeSaved={() =>
              setDistributionSummariesRefreshNonce((prev) => prev + 1)
            }
          />
        </DropForgeAccordionSection>

        <DropForgeAccordionSection title="Metadata" defaultOpen>
          <MetadataSection
            claim={claim}
            claimId={claimId}
            onUpdated={setClaim}
            onPendingChange={setMetadataDirty}
          />
        </DropForgeAccordionSection>

        <DropForgeAccordionSection
          title="Arweave"
          defaultOpen
          headerRight={arweaveHeaderPill}
          showHeaderRightWhenOpen
          showHeaderRightWhenClosed
        >
          <ArweaveSection
            claimId={claimId}
            claim={claim}
            onStatusRefresh={fetchClaim}
            hasPendingChanges={hasPendingPageChanges}
          />
        </DropForgeAccordionSection>

        <DropForgeAccordionSection title="Distribution" defaultOpen={false}>
          <DistributionSection
            claimId={claimId}
            summariesRefreshNonce={distributionSummariesRefreshNonce}
          />
        </DropForgeAccordionSection>
      </div>
    </div>
  );
}
