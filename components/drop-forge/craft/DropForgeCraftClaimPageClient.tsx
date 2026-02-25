"use client";

import { useAuth } from "@/components/auth/Auth";
import DropForgeCraftIcon from "@/components/common/icons/DropForgeCraftIcon";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import {
  claimToTraitsData,
  getClaimSeason,
  traitsDataToUpdateRequest,
} from "@/components/drop-forge/claimTraitsData";
import {
  getClaimPrimaryStatus,
  getPrimaryStatusPillClassName,
} from "@/components/drop-forge/drop-forge-status.helpers";
import DropForgeAccordionSection from "@/components/drop-forge/DropForgeAccordionSection";
import DropForgeFieldBox from "@/components/drop-forge/DropForgeFieldBox";
import DropForgeMediaTypePill from "@/components/drop-forge/DropForgeMediaTypePill";
import { DropForgePermissionFallback } from "@/components/drop-forge/DropForgePermissionFallback";
import DropForgeStatusPill from "@/components/drop-forge/DropForgeStatusPill";
import DropForgeTestnetIndicator from "@/components/drop-forge/DropForgeTestnetIndicator";
import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import ClaimTraitsEditor from "@/components/waves/memes/MemesArtSubmissionTraits";
import { canonicalizeInteractiveMediaUrl } from "@/components/waves/memes/submission/constants/security";
import ArtworkDetails from "@/components/waves/memes/submission/details/ArtworkDetails";
import type { TraitsData } from "@/components/waves/memes/submission/types/TraitsData";
import { publicEnv } from "@/config/env";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { DistributionPhoto } from "@/entities/IDistribution";
import type { MintingClaim } from "@/generated/models/MintingClaim";
import type { MintingClaimUpdateRequest } from "@/generated/models/MintingClaimUpdateRequest";
import { useDropForgePermissions } from "@/hooks/useDropForgePermissions";
import { fetchAllPages } from "@/services/6529api";
import {
  getClaim,
  getMemesMintingAirdrops as getClaimAirdropSummaries,
  getMemesMintingAllowlists as getClaimAllowlistSummaries,
  type MemesMintingAirdropSummaryItem as ClaimPhaseSummaryItem,
  patchClaim,
  postArweaveUpload,
  uploadClaimMedia,
} from "@/services/api/memes-minting-claims-api";
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  DocumentDuplicateIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const BTN_PRIMARY =
  "tw-rounded-lg tw-border-0 tw-ring-1 tw-ring-inset tw-ring-primary-400/60 tw-bg-primary-500 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-white tw-transition-colors tw-duration-150 enabled:hover:tw-bg-primary-600 enabled:hover:tw-ring-primary-300 enabled:active:tw-bg-primary-700 enabled:active:tw-ring-primary-300 disabled:tw-opacity-50";
const BTN_SAVE =
  "tw-rounded-lg tw-border-0 tw-ring-1 tw-ring-inset tw-ring-emerald-400/70 tw-bg-emerald-500/45 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-emerald-50 tw-transition-colors tw-duration-150 enabled:hover:tw-bg-emerald-500/55 enabled:hover:tw-ring-emerald-300 enabled:active:tw-bg-emerald-500/65 enabled:active:tw-ring-emerald-200 disabled:tw-opacity-50";
const BTN_TERTIARY =
  "tw-rounded-lg tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-600 tw-bg-iron-700 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-200 tw-transition-colors tw-duration-150 enabled:hover:tw-bg-iron-700/80 enabled:hover:tw-ring-iron-500 enabled:active:tw-ring-iron-500";
const BTN_SUCCESS =
  "tw-rounded-lg tw-border-0 tw-ring-1 tw-ring-inset tw-ring-sky-500/50 tw-bg-sky-500/20 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-sky-200 tw-transition-colors tw-duration-150 enabled:hover:tw-bg-sky-500/30 enabled:hover:tw-ring-sky-400 enabled:active:tw-ring-sky-400";
const BTN_DANGER =
  "tw-rounded-lg tw-border-0 tw-ring-1 tw-ring-inset tw-ring-rose-500/50 tw-bg-rose-600/20 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-rose-200 tw-transition-colors tw-duration-150 enabled:hover:tw-bg-rose-500/30 enabled:hover:tw-ring-rose-400 enabled:active:tw-ring-rose-400";

type ClaimMediaType = "image" | "video" | "glb" | "html" | "unknown";
type DistributionSectionKey =
  | "automatic"
  | "phase0"
  | "phase1"
  | "phase2"
  | "public";

function getClaimMediaType(claim: MintingClaim): ClaimMediaType {
  const hasImageData = Boolean(claim.image_url || claim.image_details);
  const hasAnimationData = Boolean(claim.animation_url || claim.animation_details);
  if (!hasImageData && !hasAnimationData) return "unknown";
  if (hasAnimationData) {
    const format = (claim.animation_details as { format?: string } | null | undefined)
      ?.format;
    if (format === "HTML") return "html";
    if (format === "GLB") return "glb";
    return "video";
  }
  return "image";
}

function formatNullableEditionSize(value: number | null | undefined): string {
  return value == null ? "" : String(value);
}

function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return u.includes(".mp4") || u.includes(".webm") || u.includes("video/");
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim() !== "") return error;
  if (error && typeof error === "object") {
    const maybeError = error as {
      error?: unknown;
      message?: unknown;
      details?: Array<{ message?: unknown }>;
    };
    if (
      typeof maybeError.error === "string" &&
      maybeError.error.trim() !== ""
    ) {
      return maybeError.error;
    }
    if (
      typeof maybeError.message === "string" &&
      maybeError.message.trim() !== ""
    ) {
      return maybeError.message;
    }
    const detailMessage = maybeError.details?.[0]?.message;
    if (typeof detailMessage === "string" && detailMessage.trim() !== "") {
      return detailMessage;
    }
  }
  return fallback;
}

function getPhotoFileName(link: string): string {
  const withoutHash = link.split("#")[0] ?? link;
  const withoutQuery = withoutHash.split("?")[0] ?? withoutHash;
  const lastSegment = withoutQuery.split("/").pop() ?? "";
  if (!lastSegment) return link;

  try {
    return decodeURIComponent(lastSegment);
  } catch {
    return lastSegment;
  }
}

function normalizeDistributionPhase(value: string): string {
  return value.replaceAll(/[\s_-]+/g, "").toLowerCase();
}

function normalizeRootPhase(value: string): string {
  return value.replaceAll(/\s+/g, "").toLowerCase();
}

export default function DropForgeCraftClaimPageClient({
  claimId,
}: Readonly<{
  claimId: number;
}>) {
  const { setToast } = useAuth();
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
  const [distributionSummariesRefreshNonce, setDistributionSummariesRefreshNonce] =
    useState(0);

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
        setToast({ message: msg, type: "error" });
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
      <div className="tw-px-2 tw-pb-16 tw-pt-2 lg:tw-px-6 lg:tw-pt-8 xl:tw-px-8">
        <div className="tw-mb-4">
          <Link
            href="/drop-forge/craft"
            className="tw-inline-flex tw-items-center tw-gap-2 tw-text-iron-400 tw-no-underline hover:tw-text-iron-50"
          >
            <ArrowLeftIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
            Back to Claims list
          </Link>
          <div className="tw-mt-2 tw-flex tw-items-start tw-justify-between tw-gap-3">
            <h1 className="tw-mb-0 tw-inline-flex tw-items-center tw-gap-3 tw-text-3xl tw-font-semibold tw-text-iron-50">
              <DropForgeCraftIcon className="tw-h-8 tw-w-8 tw-flex-shrink-0" />
              {pageTitle}
            </h1>
            <DropForgeTestnetIndicator className="tw-flex-shrink-0" />
          </div>
        </div>
        <p className="tw-mb-0 tw-text-iron-400">Loading…</p>
      </div>
    );
  }

  if (error && !claim) {
    return (
      <div className="tw-px-2 tw-pb-16 tw-pt-2 lg:tw-px-6 lg:tw-pt-8 xl:tw-px-8">
        <div className="tw-mb-4">
          <Link
            href="/drop-forge/craft"
            className="tw-inline-flex tw-items-center tw-gap-2 tw-text-iron-400 tw-no-underline hover:tw-text-iron-50"
          >
            <ArrowLeftIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
            Back to Claims list
          </Link>
          <div className="tw-mt-2 tw-flex tw-items-start tw-justify-between tw-gap-3">
            <h1 className="tw-mb-0 tw-inline-flex tw-items-center tw-gap-3 tw-text-3xl tw-font-semibold tw-text-iron-50">
              <DropForgeCraftIcon className="tw-h-8 tw-w-8 tw-flex-shrink-0" />
              {pageTitle}
            </h1>
            <DropForgeTestnetIndicator className="tw-flex-shrink-0" />
          </div>
        </div>
        <p className="tw-text-rose-300 tw-mb-0" role="alert">
          {error}
        </p>
      </div>
    );
  }

  if (!claim) return null;

  const hasPendingPageChanges =
    imageDirty || animationDirty || coreInfoDirty || metadataDirty;
  const hasAnimation = Boolean(claim.animation_url);
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

  return (
    <div className="tw-px-2 tw-pb-16 tw-pt-2 lg:tw-px-6 lg:tw-pt-8 xl:tw-px-8">
      <div className="tw-mb-6">
        <Link
          href="/drop-forge/craft"
          className="tw-inline-flex tw-items-center tw-gap-2 tw-text-iron-400 tw-no-underline hover:tw-text-iron-50"
        >
          <ArrowLeftIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
          Back to Claims list
        </Link>
        <div className="tw-mt-2 tw-flex tw-items-start tw-justify-between tw-gap-3">
          <h1 className="tw-mb-0 tw-inline-flex tw-items-center tw-gap-3 tw-text-3xl tw-font-semibold tw-text-iron-50">
            <DropForgeCraftIcon className="tw-h-8 tw-w-8 tw-flex-shrink-0" />
            {pageTitle}
          </h1>
          <DropForgeTestnetIndicator className="tw-flex-shrink-0" />
        </div>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-5">
        <DropForgeAccordionSection title="Image" defaultOpen>
          <ImageSection
            claim={claim}
            claimId={claimId}
            onUpdated={setClaim}
            onPendingChange={setImageDirty}
          />
        </DropForgeAccordionSection>

        <DropForgeAccordionSection title="Animation" defaultOpen={hasAnimation}>
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

        <DropForgeAccordionSection title="Arweave" defaultOpen>
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

function ImageSection({
  claim,
  claimId,
  onUpdated,
  onPendingChange,
}: Readonly<{
  claim: MintingClaim;
  claimId: number;
  onUpdated: (c: MintingClaim) => void;
  onPendingChange: (dirty: boolean) => void;
}>) {
  const { setToast } = useAuth();
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreviewUrl, setPendingImagePreviewUrl] = useState<
    string | null
  >(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imageUrl = pendingImagePreviewUrl ?? claim.image_url ?? null;
  const hasImage = imageUrl !== null;
  let imagePreviewMimeType = "image/jpeg";
  if (pendingImageFile?.type?.includes("image")) {
    imagePreviewMimeType = pendingImageFile.type;
  }

  function clearPendingImageSelection() {
    setPendingImageFile(null);
    setPendingImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  useEffect(() => {
    clearPendingImageSelection();
  }, [claim.claim_id, claim.image_url]);

  useEffect(() => {
    return () => {
      clearPendingImageSelection();
    };
  }, []);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const previewUrl = URL.createObjectURL(file);
    setPendingImageFile(file);
    setPendingImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return previewUrl;
    });
    setFormError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      const imageUrlToSave = pendingImageFile
        ? await uploadClaimMedia(claimId, "image_url", pendingImageFile)
        : (claim.image_url ?? null);
      const body: MintingClaimUpdateRequest = {
        image_url: imageUrlToSave,
      };
      const updated = await patchClaim(claimId, body);
      onUpdated(updated);
      clearPendingImageSelection();
      setToast({ message: "Image updated", type: "success" });
    } catch (err) {
      const msg = getErrorMessage(err, "Update failed");
      setFormError(msg);
      setToast({ message: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  const hasPendingChanges = pendingImageFile !== null;

  useEffect(() => {
    onPendingChange(hasPendingChanges);
  }, [hasPendingChanges, onPendingChange]);

  useEffect(() => {
    return () => onPendingChange(false);
  }, [onPendingChange]);

  return (
    <div>
      <div className="tw-mb-6 tw-flex tw-w-full tw-flex-col tw-gap-2">
        {hasImage ? (
          <div className="tw-relative tw-aspect-video tw-w-full tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-iron-800">
            <MediaDisplay
              media_mime_type={imagePreviewMimeType}
              media_url={imageUrl}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="tw-relative tw-flex tw-aspect-video tw-w-full tw-cursor-pointer tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-text-iron-500 tw-ring-1 tw-ring-iron-800"
          >
            <span>No image</span>
            <span className="tw-text-sm">Click to Upload</span>
          </button>
        )}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="tw-hidden"
          onChange={handleUpload}
        />
        {hasImage && (
          <button
            type="button"
            disabled={saving}
            onClick={() => imageInputRef.current?.click()}
            className={`${BTN_PRIMARY} tw-w-fit`}
          >
            Replace
          </button>
        )}
      </div>
      <form onSubmit={handleSave} className="tw-flex tw-flex-col tw-gap-2">
        {hasPendingChanges && (
          <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
            Click Save to apply the new image.
          </p>
        )}
        {formError && (
          <p className="tw-text-rose-300 tw-mb-0 tw-text-sm" role="alert">
            {formError}
          </p>
        )}
        <div className="tw-grid tw-grid-cols-2 tw-gap-2">
          <button
            type="submit"
            disabled={saving || !hasPendingChanges}
            className={`${BTN_SAVE} tw-w-full`}
          >
            {saving ? (
              <span className="tw-inline-flex tw-items-center tw-gap-2">
                <CircleLoader size={CircleLoaderSize.SMALL} />
                <span>Saving…</span>
              </span>
            ) : (
              "Save"
            )}
          </button>
          <button
            type="button"
            disabled={!hasPendingChanges}
            onClick={clearPendingImageSelection}
            className={`${BTN_DANGER} tw-w-full disabled:tw-opacity-50`}
          >
            Revert
          </button>
        </div>
      </form>
    </div>
  );
}

type AnimationReplaceMode = "choose" | "link" | null;

function AnimationSection({
  claim,
  claimId,
  onUpdated,
  onPendingChange,
}: Readonly<{
  claim: MintingClaim;
  claimId: number;
  onUpdated: (c: MintingClaim) => void;
  onPendingChange: (dirty: boolean) => void;
}>) {
  const { setToast } = useAuth();
  const [pendingAnimation, setPendingAnimation] = useState<
    string | null | undefined
  >(undefined);
  const [pendingAnimationFile, setPendingAnimationFile] = useState<File | null>(
    null
  );
  const [pendingAnimationPreviewUrl, setPendingAnimationPreviewUrl] = useState<
    string | null
  >(null);
  const [replaceMode, setReplaceMode] = useState<AnimationReplaceMode>(null);
  const [linkInput, setLinkInput] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const animationInputRef = useRef<HTMLInputElement>(null);
  const mediaType = getClaimMediaType(claim);
  const hasAnimation = Boolean(claim.animation_url);
  const imageUrl = claim.image_url ?? null;
  let animationDisplayUrl: string | null | undefined;
  if (pendingAnimationFile && pendingAnimationPreviewUrl) {
    animationDisplayUrl = pendingAnimationPreviewUrl;
  } else if (pendingAnimation === undefined) {
    animationDisplayUrl = claim.animation_url;
  } else {
    animationDisplayUrl = pendingAnimation;
  }
  const isAnimationVideoUrl = Boolean(
    animationDisplayUrl && isVideoUrl(animationDisplayUrl)
  );
  const animationPreviewMimeType = (() => {
    if (pendingAnimationFile) {
      const mime = pendingAnimationFile.type?.toLowerCase();
      if (mime) return mime;
      const name = pendingAnimationFile.name.toLowerCase();
      if (name.endsWith(".glb")) return "model/gltf-binary";
      if (name.endsWith(".gltf")) return "model/gltf+json";
    }
    if (!animationDisplayUrl) return null;
    const lowered = animationDisplayUrl.toLowerCase();
    if (mediaType === "video" || isAnimationVideoUrl) return "video/mp4";
    if (mediaType === "glb" || lowered.endsWith(".glb"))
      return "model/gltf-binary";
    if (lowered.endsWith(".gltf")) return "model/gltf+json";
    if (
      mediaType === "html" ||
      canonicalizeInteractiveMediaUrl(animationDisplayUrl) !== null
    ) {
      return "text/html";
    }
    return null;
  })();
  let animationPreviewLabel = "Animation";
  if (animationPreviewMimeType?.startsWith("video/")) {
    animationPreviewLabel = "Video";
  } else if (animationPreviewMimeType?.startsWith("model/gltf")) {
    animationPreviewLabel = "GLB";
  } else if (animationPreviewMimeType === "text/html") {
    animationPreviewLabel = "HTML";
  }

  function clearPendingAnimationFileSelection() {
    setPendingAnimationFile(null);
    setPendingAnimationPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  useEffect(() => {
    setPendingAnimation(undefined);
    clearPendingAnimationFileSelection();
    setReplaceMode(null);
    setLinkInput("");
    setLinkError(null);
  }, [claim.claim_id, claim.animation_url]);

  useEffect(() => {
    return () => {
      clearPendingAnimationFileSelection();
    };
  }, []);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const previewUrl = URL.createObjectURL(file);
    setPendingAnimationFile(file);
    setPendingAnimationPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return previewUrl;
    });
    setPendingAnimation(undefined);
    setReplaceMode(null);
    setFormError(null);
  }

  function applyLink() {
    const raw = linkInput.trim();
    if (!raw) {
      setLinkError("Enter a link");
      return;
    }
    const url = raw.startsWith("http") ? raw : `https://${raw}`;
    const canonical = canonicalizeInteractiveMediaUrl(url);
    if (!canonical) {
      setLinkError(
        "Link must be a valid IPFS or Arweave URL (e.g. https://ipfs.io/ipfs/… or https://arweave.net/…)"
      );
      return;
    }
    clearPendingAnimationFileSelection();
    setPendingAnimation(canonical);
    setLinkError(null);
    setLinkInput("");
    setReplaceMode(null);
    setToast({ message: "Link set; click Save to apply", type: "success" });
  }

  function handleRemoveAnimation() {
    clearPendingAnimationFileSelection();
    setPendingAnimation(null);
    setReplaceMode(null);
    setLinkInput("");
    setLinkError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      let animationUrlToSave: string | null = claim.animation_url ?? null;
      if (pendingAnimationFile) {
        animationUrlToSave = await uploadClaimMedia(
          claimId,
          "animation_url",
          pendingAnimationFile
        );
      } else if (pendingAnimation !== undefined) {
        animationUrlToSave = pendingAnimation;
      }
      const body: MintingClaimUpdateRequest = {
        animation_url: animationUrlToSave,
      };
      const updated = await patchClaim(claimId, body);
      onUpdated(updated);
      clearPendingAnimationFileSelection();
      setPendingAnimation(undefined);
      setReplaceMode(null);
      setLinkInput("");
      setLinkError(null);
      setToast({ message: "Animation updated", type: "success" });
    } catch (err) {
      const msg = getErrorMessage(err, "Update failed");
      setFormError(msg);
      setToast({ message: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  const hasPendingChanges =
    pendingAnimation !== undefined || pendingAnimationFile !== null;
  const canRevert = hasPendingChanges;

  useEffect(() => {
    onPendingChange(hasPendingChanges);
  }, [hasPendingChanges, onPendingChange]);

  useEffect(() => {
    return () => onPendingChange(false);
  }, [onPendingChange]);

  const showAddFlow =
    !hasAnimation &&
    pendingAnimation === undefined &&
    pendingAnimationFile === null;
  const showChoice = showAddFlow && replaceMode === "choose";
  const showAddLink = showAddFlow && replaceMode === "link";
  const showAnimationControls =
    hasAnimation || pendingAnimation !== undefined || pendingAnimationFile !== null;
  const animationActionLabel =
    pendingAnimation === null ? "Add animation" : "Replace";

  const renderReplaceControls = () => {
    if (replaceMode === null) {
      return (
        <>
          <button
            type="button"
            onClick={() => setReplaceMode("choose")}
            className={BTN_PRIMARY}
          >
            {animationActionLabel}
          </button>
          {pendingAnimation !== null && (
            <button
              type="button"
              onClick={handleRemoveAnimation}
              className={BTN_DANGER}
            >
              Remove animation
            </button>
          )}
        </>
      );
    }

    if (replaceMode === "choose") {
      return (
        <div className="tw-flex tw-w-full tw-flex-wrap tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-800 tw-p-3">
          <button
            type="button"
            onClick={() => animationInputRef.current?.click()}
            className={BTN_PRIMARY}
          >
            Upload from device
          </button>
          <button
            type="button"
            onClick={() => setReplaceMode("link")}
            className={BTN_SUCCESS}
          >
            Paste link
          </button>
          <button
            type="button"
            onClick={() => setReplaceMode(null)}
            className={BTN_TERTIARY}
          >
            Cancel
          </button>
        </div>
      );
    }

    return (
      <>
        <input
          type="text"
          value={linkInput}
          onChange={(e) => {
            setLinkInput(e.target.value);
            setLinkError(null);
          }}
          placeholder="https://ipfs.io/ipfs/… or https://arweave.net/…"
          className="tw-w-full tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-50 placeholder:tw-text-iron-500 focus:tw-border-iron-600 focus:tw-outline-none"
        />
        {linkError && (
          <p
            className="tw-text-rose-300 tw-mb-0 tw-w-full tw-text-sm"
            role="alert"
          >
            {linkError}
          </p>
        )}
        <div className="tw-flex tw-flex-wrap tw-gap-2">
          <button type="button" onClick={applyLink} className={BTN_SUCCESS}>
            Use link
          </button>
          <button
            type="button"
            onClick={() => {
              setReplaceMode(null);
              setLinkInput("");
              setLinkError(null);
            }}
            className={BTN_TERTIARY}
          >
            Cancel
          </button>
        </div>
      </>
    );
  };

  return (
    <div>
      <div className="tw-mb-6 tw-flex tw-w-full tw-flex-col tw-gap-4">
        <input
          ref={animationInputRef}
          type="file"
          accept="video/*,.glb,.gltf,model/gltf-binary,model/gltf+json"
          className="tw-hidden"
          onChange={handleUpload}
        />
        {showAddFlow && replaceMode === null && (
          <>
            <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
              Optional. Add a video, GLB, or interactive HTML (IPFS/Arweave
              link).
            </p>
            <button
              type="button"
              onClick={() => setReplaceMode("choose")}
              className={`tw-inline-flex tw-w-fit tw-items-center tw-gap-2 ${BTN_PRIMARY}`}
            >
              <PlusIcon className="tw-h-5 tw-w-5" />
              Add animation
            </button>
          </>
        )}
        {showChoice && (
          <div className="tw-w-full tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-900/50 tw-p-4">
            <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-300">
              How do you want to add the animation?
            </p>
            <div className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-2">
              <button
                type="button"
                onClick={() => animationInputRef.current?.click()}
                className={BTN_PRIMARY}
              >
                Upload from device
              </button>
              <button
                type="button"
                onClick={() => setReplaceMode("link")}
                className={BTN_SUCCESS}
              >
                Paste link
              </button>
              <button
                type="button"
                onClick={() => setReplaceMode(null)}
                className={BTN_DANGER}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {showAnimationControls && (
          <>
            <DropForgeMediaTypePill
              label={animationPreviewLabel}
            />
            {animationDisplayUrl && animationPreviewMimeType && (
              <div className="tw-relative tw-aspect-video tw-w-full tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-iron-800">
                <MediaDisplay
                  media_mime_type={animationPreviewMimeType}
                  media_url={animationDisplayUrl}
                  previewImageUrl={
                    animationPreviewMimeType === "text/html"
                      ? imageUrl
                      : undefined
                  }
                />
              </div>
            )}
            {animationDisplayUrl && !animationPreviewMimeType && (
              <div className="tw-flex tw-aspect-video tw-w-full tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-900 tw-text-iron-500 tw-ring-1 tw-ring-iron-800">
                Link
              </div>
            )}
            {animationDisplayUrl === null && (
              <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
                Animation removed
              </p>
            )}
          </>
        )}

        {showAddLink && (
          <div className="tw-flex tw-flex-col tw-gap-2">
            <label htmlFor="drop-forge-animation-link" className="tw-text-sm tw-text-iron-400">
              IPFS or Arweave URL (GLB or HTML)
            </label>
            <input
              id="drop-forge-animation-link"
              type="text"
              value={linkInput}
              onChange={(e) => {
                setLinkInput(e.target.value);
                setLinkError(null);
              }}
              placeholder="https://ipfs.io/ipfs/… or https://arweave.net/…"
              className="tw-w-full tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-iron-50 placeholder:tw-text-iron-500 focus:tw-border-iron-600 focus:tw-outline-none"
            />
            {linkError && (
              <p className="tw-text-rose-300 tw-mb-0 tw-text-sm" role="alert">
                {linkError}
              </p>
            )}
            <div className="tw-flex tw-flex-wrap tw-gap-2">
              <button type="button" onClick={applyLink} className={BTN_SUCCESS}>
                Use link
              </button>
              <button
                type="button"
                onClick={() => {
                  setReplaceMode(null);
                  setLinkInput("");
                  setLinkError(null);
                }}
                className={BTN_TERTIARY}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {showAnimationControls && (
          <div className="tw-flex tw-flex-wrap tw-gap-2">
            {renderReplaceControls()}
          </div>
        )}
      </div>

      {hasPendingChanges && (
        <form onSubmit={handleSave} className="tw-flex tw-flex-col tw-gap-2">
          {formError && (
            <p className="tw-text-rose-300 tw-mb-0 tw-text-sm" role="alert">
              {formError}
            </p>
          )}
          <div className="tw-grid tw-grid-cols-2 tw-gap-2">
            <button
              type="submit"
              disabled={saving || !hasPendingChanges}
              className={`${BTN_SAVE} tw-w-full`}
            >
              {saving ? (
                <span className="tw-inline-flex tw-items-center tw-gap-2">
                  <CircleLoader size={CircleLoaderSize.SMALL} />
                  <span>Saving…</span>
                </span>
              ) : (
                "Save"
              )}
            </button>
            <button
              type="button"
              disabled={!canRevert}
              onClick={() => {
                clearPendingAnimationFileSelection();
                setPendingAnimation(undefined);
                setReplaceMode(null);
                setLinkInput("");
                setLinkError(null);
              }}
              className={`${BTN_DANGER} tw-w-full disabled:tw-opacity-50`}
            >
              Revert
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function CoreInformationSection({
  claim,
  claimId,
  onUpdated,
  onPendingChange,
  onEditionSizeSaved,
}: Readonly<{
  claim: MintingClaim;
  claimId: number;
  onUpdated: (c: MintingClaim) => void;
  onPendingChange: (dirty: boolean) => void;
  onEditionSizeSaved: () => void;
}>) {
  const { setToast } = useAuth();
  const [editionSize, setEditionSize] = useState(
    formatNullableEditionSize(claim.edition_size)
  );
  const [season, setSeason] = useState(() => getClaimSeason(claim));
  const [coreSaving, setCoreSaving] = useState(false);
  const [coreError, setCoreError] = useState<string | null>(null);

  useEffect(() => {
    setEditionSize(
      formatNullableEditionSize(claim.edition_size)
    );
    setSeason(getClaimSeason(claim));
    setCoreError(null);
  }, [claim.claim_id]);

  const currentEditionSize =
    claim.edition_size == null ? "" : String(claim.edition_size);
  const coreChanged =
    editionSize !== currentEditionSize || season !== getClaimSeason(claim);
  const editionSizeChanged = editionSize !== currentEditionSize;
  const seasonChanged = season !== getClaimSeason(claim);

  const editionSizeNum =
    editionSize !== "" && Number.isFinite(Number(editionSize))
      ? Number(editionSize)
      : null;
  const seasonNum =
    season !== "" && Number.isFinite(Number(season)) ? Number(season) : null;

  useEffect(() => {
    onPendingChange(coreChanged);
  }, [coreChanged, onPendingChange]);

  useEffect(() => {
    return () => onPendingChange(false);
  }, [onPendingChange]);

  async function handleCoreSave(e: React.FormEvent) {
    e.preventDefault();
    setCoreError(null);
    if (
      editionSize !== "" &&
      (editionSizeNum == null ||
        !Number.isInteger(editionSizeNum) ||
        editionSizeNum <= 0)
    ) {
      setCoreError("Edition size must be a positive integer");
      return;
    }
    if (
      season !== "" &&
      (seasonNum == null || !Number.isInteger(seasonNum) || seasonNum <= 0)
    ) {
      setCoreError("Season must be a positive integer");
      return;
    }
    setCoreSaving(true);
    try {
      const body: MintingClaimUpdateRequest = {
        edition_size: editionSizeNum,
      };

      if (seasonChanged) {
        const withoutSeason = (claim.attributes ?? []).filter(
          (attribute) =>
            attribute.trait_type?.trim().toLowerCase() !== "type - season"
        );
        body.attributes =
          seasonNum == null
            ? withoutSeason
            : [
                ...withoutSeason,
                {
                  trait_type: "Type - Season",
                  value: seasonNum,
                  display_type: "number",
                },
              ];
      }
      const nextClaim = await patchClaim(
        claimId,
        body
      );
      setEditionSize(
        formatNullableEditionSize(nextClaim.edition_size)
      );
      setSeason(getClaimSeason(nextClaim));
      onUpdated(nextClaim);
      if (editionSizeChanged) {
        onEditionSizeSaved();
      }
      setToast({ message: "Core information updated", type: "success" });
    } catch (e) {
      const msg = getErrorMessage(e, "Update failed");
      setCoreError(msg);
      setToast({ message: msg, type: "error" });
    } finally {
      setCoreSaving(false);
    }
  }

  return (
    <form onSubmit={handleCoreSave} className="tw-flex tw-flex-col tw-gap-2">
      <div className="tailwind-scope tw-grid tw-grid-cols-2 tw-gap-6">
        <div className="tw-group tw-relative tw-min-w-0 tw-pb-8">
          <div className="tw-relative">
            <label
              htmlFor="metadata-season"
              className="group-focus-visible-within:tw-text-primary-400 tw-pointer-events-none tw-absolute -tw-top-2 tw-left-3 tw-z-10 tw-bg-iron-900 tw-px-1 tw-text-xs tw-font-medium tw-text-iron-300 tw-transition-all"
            >
              Season
            </label>
            <div className="tw-relative tw-rounded-xl tw-bg-iron-950 tw-transition-all tw-duration-200">
              <input
                id="metadata-season"
                type="number"
                min={1}
                step={1}
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                placeholder="Season"
                className="tw-form-input tw-w-full tw-cursor-text tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-4 tw-py-3.5 tw-text-sm tw-font-normal tw-text-iron-100 tw-outline-none tw-ring-1 tw-ring-iron-700 tw-transition-all tw-duration-500 tw-ease-in-out placeholder:tw-text-iron-500 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:hover:tw-ring-primary-400 desktop-hover:hover:tw-ring-iron-650 [&::-webkit-inner-spin-button]:tw-appearance-none [&::-webkit-outer-spin-button]:tw-appearance-none"
                style={{
                  MozAppearance: "textfield",
                  WebkitAppearance: "none",
                }}
                onWheel={(e) => e.currentTarget.blur()}
              />
            </div>
          </div>
        </div>
        <div className="tw-group tw-relative tw-min-w-0 tw-pb-8">
          <div className="tw-relative">
            <label
              htmlFor="metadata-edition-size"
              className="group-focus-visible-within:tw-text-primary-400 tw-pointer-events-none tw-absolute -tw-top-2 tw-left-3 tw-z-10 tw-bg-iron-900 tw-px-1 tw-text-xs tw-font-medium tw-text-iron-300 tw-transition-all"
            >
              Edition size
            </label>
            <div className="tw-relative tw-rounded-xl tw-bg-iron-950 tw-transition-all tw-duration-200">
              <input
                id="metadata-edition-size"
                type="number"
                min={1}
                step={1}
                value={editionSize}
                onChange={(e) => setEditionSize(e.target.value)}
                className="tw-form-input tw-w-full tw-cursor-text tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-4 tw-py-3.5 tw-text-sm tw-text-iron-100 tw-outline-none tw-ring-1 tw-ring-iron-700 tw-transition-all tw-duration-500 tw-ease-in-out placeholder:tw-text-iron-500 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:hover:tw-ring-primary-400 desktop-hover:hover:tw-ring-iron-650 [&::-webkit-inner-spin-button]:tw-appearance-none [&::-webkit-outer-spin-button]:tw-appearance-none"
                style={{
                  MozAppearance: "textfield",
                  WebkitAppearance: "none",
                }}
                onWheel={(e) => e.currentTarget.blur()}
              />
            </div>
          </div>
        </div>
      </div>
      {coreError && (
        <p className="tw-text-rose-300 tw-mb-0 tw-text-sm" role="alert">
          {coreError}
        </p>
      )}
      <div className="tw-grid tw-grid-cols-2 tw-gap-2">
        <button
          type="submit"
          disabled={coreSaving || !coreChanged}
          className={`${BTN_SAVE} tw-w-full`}
        >
          {coreSaving ? (
            <span className="tw-inline-flex tw-items-center tw-gap-2">
              <CircleLoader size={CircleLoaderSize.SMALL} />
              <span>Saving…</span>
            </span>
          ) : (
            "Save"
          )}
        </button>
        <button
          type="button"
          disabled={!coreChanged}
          onClick={() => {
            setEditionSize(
              formatNullableEditionSize(claim.edition_size)
            );
            setSeason(getClaimSeason(claim));
            setCoreError(null);
          }}
          className={`${BTN_DANGER} tw-w-full disabled:tw-opacity-50`}
        >
          Revert
        </button>
      </div>
    </form>
  );
}

function MetadataSection({
  claim,
  claimId,
  onUpdated,
  onPendingChange,
}: Readonly<{
  claim: MintingClaim;
  claimId: number;
  onUpdated: (c: MintingClaim) => void;
  onPendingChange: (dirty: boolean) => void;
}>) {
  const { setToast } = useAuth();
  const initialTraits = useMemo(() => claimToTraitsData(claim), [claim]);
  const [traits, setTraits] = useState<TraitsData>(initialTraits);
  const [externalUrl, setExternalUrl] = useState(claim.external_url ?? "");
  const [traitsSaving, setTraitsSaving] = useState(false);
  const [traitsError, setTraitsError] = useState<string | null>(null);
  const [traitsFormKey, setTraitsFormKey] = useState(0);
  const traitsSaveButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setTraits(claimToTraitsData(claim));
    setExternalUrl(claim.external_url ?? "");
    setTraitsError(null);
    setTraitsFormKey((prev) => prev + 1);
  }, [claim.claim_id]);

  const normalizedExistingExternalUrl = (claim.external_url ?? "").trim();
  const normalizedNextExternalUrl = externalUrl.trim();
  const externalUrlChanged =
    normalizedNextExternalUrl !== normalizedExistingExternalUrl;

  const currentTraits = useMemo(() => claimToTraitsData(claim), [claim]);
  const draftMetadataBody = useMemo(() => {
    const body = traitsDataToUpdateRequest(traits, null, currentTraits);
    const currentAttributesSnapshot = JSON.stringify(
      traitsDataToUpdateRequest(currentTraits, null).attributes ?? []
    );
    const nextAttributesSnapshot = JSON.stringify(
      traitsDataToUpdateRequest(traits, null).attributes ?? []
    );
    if (currentAttributesSnapshot === nextAttributesSnapshot) {
      delete body.attributes;
    }
    if (externalUrlChanged) {
      body.external_url =
        normalizedNextExternalUrl === "" ? null : normalizedNextExternalUrl;
    }
    return body;
  }, [currentTraits, externalUrlChanged, normalizedNextExternalUrl, traits]);
  const metadataChanged = Object.keys(draftMetadataBody).length > 0;

  useEffect(() => {
    onPendingChange(metadataChanged);
  }, [metadataChanged, onPendingChange]);

  useEffect(() => {
    return () => onPendingChange(false);
  }, [onPendingChange]);

  async function handleTraitsSave(e: React.FormEvent) {
    e.preventDefault();
    setTraitsError(null);
    const previouslyFocused =
      typeof document === "undefined" ? null : document.activeElement;
    setTraitsSaving(true);
    try {
      const body = {
        ...draftMetadataBody,
        ...(draftMetadataBody.attributes
          ? { attributes: [...draftMetadataBody.attributes] }
          : {}),
      };
      if (Object.keys(body).length === 0) {
        return;
      }
      if (body.attributes) {
        const existingSeasonAttribute = (claim.attributes ?? []).find(
          (attribute) =>
            attribute.trait_type?.trim().toLowerCase() === "type - season"
        );
        const nextHasSeasonAttribute = body.attributes.some(
          (attribute) =>
            attribute.trait_type?.trim().toLowerCase() === "type - season"
        );
        if (existingSeasonAttribute && !nextHasSeasonAttribute) {
          body.attributes = [...body.attributes, existingSeasonAttribute];
        }
      }
      const nextClaim = await patchClaim(
        claimId,
        body as MintingClaimUpdateRequest
      );
      setTraits(claimToTraitsData(nextClaim));
      setExternalUrl(nextClaim.external_url ?? "");
      onUpdated(nextClaim);
      setToast({ message: "Metadata updated", type: "success" });
    } catch (e) {
      const msg = getErrorMessage(e, "Update failed");
      setTraitsError(msg);
      setToast({ message: msg, type: "error" });
    } finally {
      setTraitsSaving(false);
      if (
        traitsSaveButtonRef.current &&
        previouslyFocused instanceof HTMLElement &&
        previouslyFocused.tagName === "BUTTON"
      ) {
        requestAnimationFrame(() => traitsSaveButtonRef.current?.focus());
      }
    }
  }

  return (
    <form
      onSubmit={handleTraitsSave}
      noValidate
      className="tw-flex tw-flex-col tw-gap-2"
    >
      <ArtworkDetails
        title={traits.title}
        description={traits.description}
        onTitleChange={(title) => setTraits((prev) => ({ ...prev, title }))}
        onDescriptionChange={(description) =>
          setTraits((prev) => ({ ...prev, description }))
        }
      />

      <div className="tw-group tw-relative tw-mt-2">
        <div className="tw-relative">
          <label
            htmlFor="metadata-external-url"
            className="tw-pointer-events-none tw-absolute -tw-top-2 tw-left-3 tw-z-10 tw-bg-iron-900 tw-px-1 tw-text-xs tw-font-medium tw-text-iron-300 tw-transition-all group-focus-visible-within:tw-text-primary-400"
          >
            External URL
          </label>
          <div className="tw-relative tw-rounded-xl tw-bg-iron-950 tw-transition-all tw-duration-200">
            <input
              id="metadata-external-url"
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://..."
              className="tw-form-input tw-w-full tw-cursor-text tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-4 tw-py-3.5 tw-text-sm tw-text-iron-100 tw-outline-none tw-ring-1 tw-ring-iron-700 tw-transition-all tw-duration-500 tw-ease-in-out placeholder:tw-text-iron-500 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:hover:tw-ring-primary-400 desktop-hover:hover:tw-ring-iron-650"
            />
          </div>
        </div>
      </div>

      <div className="tw-mt-6 tw-space-y-4">
        <h3 className="tw-mb-4 tw-text-lg tw-font-semibold tw-text-iron-100 sm:tw-mb-6 sm:tw-text-xl">
          Artwork Traits
        </h3>
        <ClaimTraitsEditor
          key={`metadata-traits-${traitsFormKey}`}
          traits={traits}
          setTraits={(partial) =>
            setTraits((prev) => ({ ...prev, ...partial }))
          }
          showTitle={false}
          readOnlyOverrides={{ seizeArtistProfile: false }}
        />
      </div>
      {traitsError && (
        <p className="tw-text-rose-300 tw-mb-0 tw-text-sm" role="alert">
          {traitsError}
        </p>
      )}
      <div className="tw-grid tw-grid-cols-2 tw-gap-2">
        <button
          ref={traitsSaveButtonRef}
          type="submit"
          disabled={traitsSaving || !metadataChanged}
          className={`${BTN_SAVE} tw-w-full`}
        >
          {traitsSaving ? (
            <span className="tw-inline-flex tw-items-center tw-gap-2">
              <CircleLoader size={CircleLoaderSize.SMALL} />
              <span>Saving…</span>
            </span>
          ) : (
            "Save"
          )}
        </button>
        <button
          type="button"
          disabled={!metadataChanged}
          onClick={() => {
            setTraits(claimToTraitsData(claim));
            setExternalUrl(claim.external_url ?? "");
            setTraitsError(null);
            setTraitsFormKey((prev) => prev + 1);
          }}
          className={`${BTN_DANGER} tw-w-full disabled:tw-opacity-50`}
        >
          Revert
        </button>
      </div>
    </form>
  );
}

const ARWEAVE_ROW_GRID =
  "tw-grid tw-grid-cols-[minmax(5rem,auto)_auto_auto_1fr] tw-gap-x-3 tw-items-center";

function ArweaveLinkRow({
  label,
  url,
}: Readonly<{ label: string; url: string }>) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
        timeoutRef.current = null;
      }, 1000);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className={ARWEAVE_ROW_GRID}>
      <span className="tw-text-base tw-text-iron-200">{label}</span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="tw-inline-flex tw-text-iron-400 tw-transition-colors hover:tw-text-primary-400"
        aria-label={`Open ${label} on Arweave`}
      >
        <ArrowTopRightOnSquareIcon className="tw-h-5 tw-w-5" />
      </a>
      <div className="tw-flex tw-items-center tw-gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="tw-inline-flex tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 tw-transition-colors hover:tw-text-primary-400"
          aria-label={`Copy ${label} link`}
        >
          <DocumentDuplicateIcon className="tw-h-5 tw-w-5" />
        </button>
        {copied && (
          <span className="tw-animate-in tw-fade-in tw-text-sm tw-text-primary-400 tw-duration-150">
            Copied!
          </span>
        )}
      </div>
    </div>
  );
}

function ArweaveSection({
  claimId,
  claim,
  onStatusRefresh,
  hasPendingChanges,
}: Readonly<{
  claimId: number;
  claim: MintingClaim;
  onStatusRefresh: () => Promise<void>;
  hasPendingChanges: boolean;
}>) {
  const { setToast } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const primaryStatus = getClaimPrimaryStatus({ claim });
  const isPublishing = primaryStatus.key === "publishing";
  const isDraft = primaryStatus.key === "draft";
  const canPublish = isDraft && !hasPendingChanges && !loading && !isPublishing;
  const hasPublishedMetadata = claim.metadata_location != null;

  useEffect(() => {
    if (!isPublishing) return;
    const id = setInterval(() => {
      onStatusRefresh().catch((e) => {
        const msg = getErrorMessage(e, "Failed to refresh claim status");
        setError(msg);
      });
    }, 10000);
    return () => clearInterval(id);
  }, [isPublishing, onStatusRefresh]);

  async function handleUpload() {
    if (!canPublish) return;
    setError(null);
    setLoading(true);
    try {
      await postArweaveUpload(claimId);
      setToast({ message: "Publishing to Arweave started", type: "success" });
      await onStatusRefresh();
    } catch (e) {
      const msg = getErrorMessage(e, "Upload failed");
      setError(msg);
      if (msg !== "Already published" && msg !== "Not authorized") {
        setToast({ message: msg, type: "error" });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="tw-mb-4 tw-flex tw-items-center tw-gap-3">
        <DropForgeStatusPill
          className={getPrimaryStatusPillClassName(primaryStatus.tone)}
          label={primaryStatus.label}
          showLoader={primaryStatus.key === "publishing"}
          tooltipText={primaryStatus.reason ?? ""}
        />
      </div>
      {hasPublishedMetadata &&
        (claim.image_location ||
          claim.animation_location ||
          claim.metadata_location) && (
          <div className="tw-my-4 tw-flex tw-flex-col tw-gap-y-5">
            {claim.image_location && (
              <ArweaveLinkRow
                label="Image"
                url={`https://arweave.net/${claim.image_location.trim()}`}
              />
            )}
            {claim.animation_location && (
              <ArweaveLinkRow
                label="Animation"
                url={`https://arweave.net/${claim.animation_location.trim()}`}
              />
            )}
            {claim.metadata_location && (
              <ArweaveLinkRow
                label="Metadata"
                url={`https://arweave.net/${claim.metadata_location.trim()}`}
              />
            )}
          </div>
        )}
      {(isDraft || isPublishing) && (
        <div className="tw-mt-2 tw-flex tw-flex-col tw-gap-4">
          {isDraft && (
            <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
              Publish this claim&apos;s media and metadata to Arweave.
            </p>
          )}
          {hasPendingChanges && (
            <p className="tw-mb-0 tw-text-sm tw-text-yellow-400">
              Save or revert pending changes before publishing to Arweave.
            </p>
          )}
          {error && (
            <p className="tw-text-rose-300 tw-mb-0 tw-text-sm" role="alert">
              {error}
            </p>
          )}
          {isDraft && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={!canPublish}
              className={`${BTN_PRIMARY} tw-w-fit`}
            >
              {loading ? (
                <span className="tw-inline-flex tw-items-center tw-gap-2">
                  <CircleLoader size={CircleLoaderSize.SMALL} />
                  <span>Publishing…</span>
                </span>
              ) : (
                "Publish to Arweave"
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DistributionSection({
  claimId,
  summariesRefreshNonce,
}: Readonly<{
  claimId: number;
  summariesRefreshNonce: number;
}>) {
  const [photos, setPhotos] = useState<DistributionPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [airdropSummaries, setAirdropSummaries] = useState<
    ClaimPhaseSummaryItem[]
  >([]);
  const [airdropSummariesLoading, setAirdropSummariesLoading] = useState(true);
  const [airdropSummariesError, setAirdropSummariesError] = useState<
    string | null
  >(null);
  const [allowlistSummaries, setAllowlistSummaries] = useState<
    ClaimPhaseSummaryItem[] | null
  >(null);
  const [allowlistSummariesLoading, setAllowlistSummariesLoading] =
    useState(true);
  const [allowlistSummariesError, setAllowlistSummariesError] = useState<
    string | null
  >(null);
  const [expandedPhoto, setExpandedPhoto] = useState<DistributionPhoto | null>(
    null
  );
  const closeExpandedPhoto = useCallback(() => {
    setExpandedPhoto(null);
  }, []);

  useEffect(() => {
    let isActive = true;
    setLoading(true);
    setError(null);

    const distributionPhotosUrl = `${publicEnv.API_ENDPOINT}/api/distribution_photos/${MEMES_CONTRACT}/${claimId}`;

    const loadDistributionPhotos = async () => {
      try {
        const distributionPhotos = await fetchAllPages<DistributionPhoto>(
          distributionPhotosUrl
        );
        if (!isActive) return;
        setPhotos(distributionPhotos);
      } catch (e) {
        if (!isActive) return;
        setPhotos([]);
        setError(getErrorMessage(e, "Failed to load distribution photos"));
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadDistributionPhotos().catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, [claimId]);

  useEffect(() => {
    let isActive = true;
    setAirdropSummariesLoading(true);
    setAirdropSummariesError(null);
    const loadAirdropSummaries = async () => {
      try {
        const summaries = await getClaimAirdropSummaries(claimId);
        if (!isActive) return;
        setAirdropSummaries(summaries);
      } catch (e) {
        if (!isActive) return;
        setAirdropSummaries([]);
        setAirdropSummariesError(
          getErrorMessage(e, "Failed to load airdrop summaries")
        );
      } finally {
        if (isActive) {
          setAirdropSummariesLoading(false);
        }
      }
    };

    loadAirdropSummaries().catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, [claimId, summariesRefreshNonce]);

  useEffect(() => {
    let isActive = true;
    setAllowlistSummariesLoading(true);
    setAllowlistSummariesError(null);

    const loadAllowlists = async () => {
      try {
        const summaries = await getClaimAllowlistSummaries(claimId);
        if (!isActive) return;
        setAllowlistSummaries(summaries);
      } catch (e) {
        if (!isActive) return;
        setAllowlistSummaries([]);
        setAllowlistSummariesError(
          getErrorMessage(e, "Failed to load allowlist summaries")
        );
      } finally {
        if (isActive) {
          setAllowlistSummariesLoading(false);
        }
      }
    };

    loadAllowlists().catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, [claimId, summariesRefreshNonce]);

  const phaseAliases: Record<DistributionSectionKey, string[]> = {
    automatic: ["automatic", "airdrop", "teamandartistairdrops"],
    phase0: ["phase0", "0"],
    phase1: ["phase1", "1"],
    phase2: ["phase2", "2"],
    public: ["public", "publicphase"],
  };

  function getPhaseSummary(
    section: DistributionSectionKey
  ): ClaimPhaseSummaryItem | undefined {
    const aliases = phaseAliases[section];
    return airdropSummaries.find((item) =>
      aliases.includes(normalizeDistributionPhase(item.phase))
    );
  }

  function getAllowlistSummaryForPhase(
    phase: "phase0" | "phase1" | "phase2" | "publicphase"
  ): ClaimPhaseSummaryItem | null {
    if (!allowlistSummaries) return null;
    const targets: Record<typeof phase, string[]> = {
      phase0: ["phase0"],
      phase1: ["phase1"],
      phase2: ["phase2"],
      publicphase: ["publicphase", "public"],
    };
    return (
      allowlistSummaries.find((item) =>
        targets[phase].includes(normalizeRootPhase(item.phase ?? ""))
      ) ?? null
    );
  }

  function getAllowlistAddresses(
    summary: ClaimPhaseSummaryItem | null | undefined
  ): number | null {
    return normalizeClaimPhaseSummary(summary)?.addresses ?? null;
  }

  function getAllowlistTotal(
    summary: ClaimPhaseSummaryItem | null | undefined
  ): number | null {
    return normalizeClaimPhaseSummary(summary)?.total ?? null;
  }

  function renderPhaseSummaryBox(section: DistributionSectionKey) {
    const summary = getPhaseSummary(section);
    const normalized = normalizeClaimPhaseSummary(summary);
    const addresses = Number(normalized?.addresses ?? 0);
    const total = Number(normalized?.total_airdrops ?? 0);
    return (
      <DropForgeFieldBox
        label="Address Count / Total Airdrops"
        contentClassName={`tw-text-base ${
          airdropSummariesLoading ? "tw-text-iron-400" : "tw-text-white"
        }`}
      >
        {airdropSummariesLoading
          ? "loading / loading"
          : `${addresses.toLocaleString()} / ${total.toLocaleString()}`}
      </DropForgeFieldBox>
    );
  }

  function normalizeClaimPhaseSummary(
    summary: ClaimPhaseSummaryItem | null | undefined
  ): {
    addresses: number | null;
    total: number | null;
    total_airdrops: number | null;
  } | null {
    if (!summary) return null;
    const addressesValue = summary.addresses ?? summary.addresses_count;
    const totalValue = summary.total ?? summary.total_spots;
    const totalAirdropsValue =
      summary.total_airdrops ?? summary.total ?? summary.total_spots;

    return {
      addresses: typeof addressesValue === "number" ? addressesValue : null,
      total: typeof totalValue === "number" ? totalValue : null,
      total_airdrops:
        typeof totalAirdropsValue === "number" ? totalAirdropsValue : null,
    };
  }

  function getAggregatedAirdropSummary(
    keyword: "team" | "artist"
  ): { addresses: number; total: number } | null {
    const matching = airdropSummaries.filter((item) =>
      normalizeDistributionPhase(item.phase).includes(keyword)
    );

    if (matching.length === 0) {
      return null;
    }

    return matching.reduce(
      (acc, item) => ({
        addresses:
          acc.addresses + Number(item.addresses ?? item.addresses_count ?? 0),
        total: acc.total + Number(item.total ?? item.total_airdrops ?? 0),
      }),
      { addresses: 0, total: 0 }
    );
  }

  function renderAggregatedAirdropSummaryBox(keyword: "team" | "artist") {
    const summary = getAggregatedAirdropSummary(keyword);
    const addresses = summary?.addresses ?? 0;
    const total = summary?.total ?? 0;

    return (
      <DropForgeFieldBox
        label="Address Count / Total Airdrops"
        contentClassName={`tw-text-base ${
          airdropSummariesLoading ? "tw-text-iron-400" : "tw-text-white"
        }`}
      >
        {airdropSummariesLoading
          ? "loading / loading"
          : `${addresses.toLocaleString()} / ${total.toLocaleString()}`}
      </DropForgeFieldBox>
    );
  }

  function renderAllowlistSummaryBox(phase: "phase0" | "phase1" | "phase2") {
    const allowlist = getAllowlistSummaryForPhase(phase);
    const addresses = getAllowlistAddresses(allowlist) ?? 0;
    const total = getAllowlistTotal(allowlist) ?? 0;

    return (
      <DropForgeFieldBox
        label="Address Count / Total Spots"
        contentClassName={`tw-text-base ${
          allowlistSummariesLoading ? "tw-text-iron-400" : "tw-text-white"
        }`}
      >
        {allowlistSummariesLoading
          ? "loading / loading"
          : `${addresses.toLocaleString()} / ${total.toLocaleString()}`}
      </DropForgeFieldBox>
    );
  }

  function renderTeamArtistTotalSummaryBox() {
    const teamSummary = getAggregatedAirdropSummary("team");
    const artistSummary = getAggregatedAirdropSummary("artist");
    const summary = {
      addresses:
        (teamSummary?.addresses ?? 0) + (artistSummary?.addresses ?? 0),
      total: (teamSummary?.total ?? 0) + (artistSummary?.total ?? 0),
    };

    return (
      <DropForgeFieldBox
        label="Address Count / Total Airdrops"
        contentClassName={`tw-text-base ${
          airdropSummariesLoading ? "tw-text-iron-400" : "tw-text-white"
        }`}
      >
        {airdropSummariesLoading
          ? "loading / loading"
          : `${summary.addresses.toLocaleString()} / ${summary.total.toLocaleString()}`}
      </DropForgeFieldBox>
    );
  }

  function renderPhaseTotalSummaryBox(phase: "phase0" | "phase1" | "phase2") {
    const airdrop = getPhaseSummary(phase);
    const allowlist = getAllowlistSummaryForPhase(phase);
    const summary = {
      addresses:
        Number(airdrop?.addresses ?? airdrop?.addresses_count ?? 0) +
        Number(getAllowlistAddresses(allowlist) ?? 0),
      total:
        Number(airdrop?.total ?? airdrop?.total_airdrops ?? 0) +
        Number(getAllowlistTotal(allowlist) ?? 0),
    };

    return (
      <DropForgeFieldBox
        label="Address Count / Total"
        contentClassName={`tw-text-base ${
          airdropSummariesLoading || allowlistSummariesLoading
            ? "tw-text-iron-400"
            : "tw-text-white"
        }`}
      >
        {airdropSummariesLoading || allowlistSummariesLoading
          ? "loading / loading"
          : `${summary.addresses.toLocaleString()} / ${summary.total.toLocaleString()}`}
      </DropForgeFieldBox>
    );
  }

  return (
    <div>
      <h3 className="tw-mb-3 tw-text-base tw-font-medium tw-text-iron-100">
        Photos
      </h3>

      {loading && (
        <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
          Loading distribution photos…
        </p>
      )}

      {!loading && error && (
        <p className="tw-text-rose-300 tw-mb-0 tw-text-sm" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && photos.length === 0 && (
        <p className="tw-mb-0 tw-text-sm tw-text-iron-300">
          No Distribution photos found
        </p>
      )}

      {!loading && !error && photos.length > 0 && (
        <div className="tw-grid tw-grid-cols-2 tw-gap-2 md:tw-grid-cols-3 lg:tw-grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="tw-relative tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-900/60 tw-p-1.5"
            >
              <button
                type="button"
                onClick={() => setExpandedPhoto(photo)}
                className="tw-block tw-w-full tw-cursor-zoom-in tw-rounded-md tw-border-0 tw-bg-transparent tw-p-0"
              >
                <div className="tw-aspect-[4/3] tw-overflow-hidden tw-rounded-md tw-bg-iron-950">
                  <img
                    src={photo.link}
                    alt={getPhotoFileName(photo.link)}
                    loading="lazy"
                    className="tw-h-full tw-w-full tw-object-contain"
                  />
                </div>
              </button>
              <a
                href={photo.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => event.stopPropagation()}
                aria-label={`Open distribution photo ${getPhotoFileName(photo.link)} in new tab`}
                title={photo.link}
                className="tw-absolute tw-right-2 tw-top-2 tw-inline-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-md tw-bg-iron-900/90 tw-text-iron-100 tw-no-underline tw-transition-colors hover:tw-bg-iron-800 hover:tw-text-iron-50 focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-iron-500"
              >
                <ArrowTopRightOnSquareIcon className="tw-h-4 tw-w-4" />
              </a>
            </div>
          ))}
        </div>
      )}

      <DistributionPhotoLightbox
        photo={expandedPhoto}
        photoFileName={
          expandedPhoto ? getPhotoFileName(expandedPhoto.link) : ""
        }
        onClose={closeExpandedPhoto}
      />

      <div className="tw-mt-8 tw-space-y-7">
        {airdropSummariesError && (
          <p className="tw-text-rose-300 tw-mb-0 tw-text-sm" role="alert">
            {airdropSummariesError}
          </p>
        )}
        {allowlistSummariesError && (
          <p className="tw-text-rose-300 tw-mb-0 tw-text-sm" role="alert">
            {allowlistSummariesError}
          </p>
        )}

        <div className="tw-space-y-2">
          <h3 className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-100">
            Artist and Team
          </h3>
          <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-3 md:tw-gap-3">
            <div className="tw-space-y-3">
              <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-300">
                Artist
              </p>
              {renderAggregatedAirdropSummaryBox("artist")}
            </div>
            <div className="tw-space-y-3">
              <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-300">
                Team
              </p>
              {renderAggregatedAirdropSummaryBox("team")}
            </div>
            <div className="tw-space-y-3">
              <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-300">
                Total
              </p>
              {renderTeamArtistTotalSummaryBox()}
            </div>
          </div>
        </div>

        <div className="tw-space-y-2">
          <h3 className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-100">
            Phase 0
          </h3>
          <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-3 md:tw-gap-3">
            <div className="tw-space-y-3">
              <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-300">
                Airdrop
              </p>
              {renderPhaseSummaryBox("phase0")}
            </div>
            <div className="tw-space-y-3">
              <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-300">
                Allowlist
              </p>
              {renderAllowlistSummaryBox("phase0")}
            </div>
            <div className="tw-space-y-3">
              <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-300">
                Total
              </p>
              {renderPhaseTotalSummaryBox("phase0")}
            </div>
          </div>
        </div>

        <div className="tw-space-y-2">
          <h3 className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-100">
            Phase 1
          </h3>
          <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-3 md:tw-gap-3">
            <div className="tw-space-y-3">
              <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-300">
                Airdrop
              </p>
              {renderPhaseSummaryBox("phase1")}
            </div>
            <div className="tw-space-y-3">
              <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-300">
                Allowlist
              </p>
              {renderAllowlistSummaryBox("phase1")}
            </div>
            <div className="tw-space-y-3">
              <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-300">
                Total
              </p>
              {renderPhaseTotalSummaryBox("phase1")}
            </div>
          </div>
        </div>

        <div className="tw-space-y-2">
          <h3 className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-100">
            Phase 2
          </h3>
          <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-3 md:tw-gap-3">
            <div className="tw-space-y-3">
              <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-300">
                Airdrop
              </p>
              {renderPhaseSummaryBox("phase2")}
            </div>
            <div className="tw-space-y-3">
              <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-300">
                Allowlist
              </p>
              {renderAllowlistSummaryBox("phase2")}
            </div>
            <div className="tw-space-y-3">
              <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-300">
                Total
              </p>
              {renderPhaseTotalSummaryBox("phase2")}
            </div>
          </div>
        </div>

        <div className="tw-space-y-2">
          <h3 className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-100">
            Public Phase
          </h3>
          <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-3 md:tw-gap-3">
            <div className="tw-space-y-3">
              <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-300">
                Airdrop
              </p>
              {renderPhaseSummaryBox("public")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DistributionPhotoLightbox({
  photo,
  photoFileName,
  onClose,
}: Readonly<{
  photo: DistributionPhoto | null;
  photoFileName: string;
  onClose: () => void;
}>) {
  useEffect(() => {
    if (!photo) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      globalThis.removeEventListener("keydown", handleKeyDown);
    };
  }, [photo, onClose]);

  if (!photo || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1000] tw-flex tw-items-center tw-justify-center"
    >
      <button
        type="button"
        aria-label="Close photo lightbox"
        tabIndex={-1}
        onClick={onClose}
        className="tw-absolute tw-inset-0 tw-border-0 tw-bg-black/85 tw-p-0"
      />

      <div
        className="tw-relative tw-z-[1001] tw-w-[min(90vw,980px)] tw-overflow-hidden tw-rounded-xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-p-2.5"
      >
        <img
          src={photo.link}
          alt={photoFileName}
          className="tw-h-[min(76vh,760px)] tw-w-full tw-object-contain"
        />

        <div className="tw-pointer-events-none tw-absolute tw-right-3 tw-top-3 tw-flex tw-gap-2">
          <a
            href={photo.link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open distribution photo ${photoFileName} in new tab`}
            className="tw-pointer-events-auto tw-inline-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-md tw-bg-iron-900/90 tw-text-iron-100 tw-no-underline tw-transition-colors hover:tw-bg-iron-800 hover:tw-text-iron-50 focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-iron-500"
          >
            <ArrowTopRightOnSquareIcon className="tw-h-5 tw-w-5" />
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close image preview"
            className="tw-pointer-events-auto tw-inline-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-iron-900/90 tw-text-iron-100 tw-transition-colors hover:tw-bg-iron-800 hover:tw-text-iron-50 focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-iron-500"
          >
            <XMarkIcon className="tw-h-5 tw-w-5" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
