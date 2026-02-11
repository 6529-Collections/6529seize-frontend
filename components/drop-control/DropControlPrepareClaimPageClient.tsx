"use client";

import { useAuth } from "@/components/auth/Auth";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import {
  claimToTraitsData,
  getClaimSeason,
  traitsDataToUpdateRequest,
} from "@/components/drop-control/claimTraitsData";
import { DROP_CONTROL_SECTIONS } from "@/components/drop-control/drop-control.constants";
import { DropControlPermissionFallback } from "@/components/drop-control/DropControlPermissionFallback";
import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import MemesArtSubmissionTraits from "@/components/waves/memes/MemesArtSubmissionTraits";
import { canonicalizeInteractiveMediaUrl } from "@/components/waves/memes/submission/constants/security";
import ArtworkDetails from "@/components/waves/memes/submission/details/ArtworkDetails";
import type { TraitsData } from "@/components/waves/memes/submission/types/TraitsData";
import type { MemeClaim } from "@/generated/models/MemeClaim";
import type { MemeClaimUpdateRequest } from "@/generated/models/MemeClaimUpdateRequest";
import { useDropControlPermissions } from "@/hooks/useDropControlPermissions";
import {
  getClaim,
  patchClaim,
  postArweaveUpload,
  uploadClaimMedia,
} from "@/services/api/memes-minting-claims-api";
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  DocumentDuplicateIcon,
  PlusIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const CARD_CLASS =
  "tw-rounded-xl tw-ring-1 tw-ring-inset tw-bg-iron-950 tw-ring-iron-800 tw-p-6";

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

function getClaimMediaType(claim: MemeClaim): ClaimMediaType {
  if (!claim.image_url && !claim.image_details) return "unknown";
  if (!claim.animation_url || !claim.animation_details) return "image";
  const format = (claim.animation_details as { format?: string }).format;
  if (format === "HTML") return "html";
  if (format === "GLB") return "glb";
  if (format) return "video";
  return "image";
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

export default function DropControlPrepareClaimPageClient({
  memeId,
}: {
  memeId: number;
}) {
  const { setToast } = useAuth();
  const { hasWallet, permissionsLoading, canAccessPrepare } =
    useDropControlPermissions();
  const { title } = DROP_CONTROL_SECTIONS.PREPARE;

  const [claim, setClaim] = useState<MemeClaim | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageDirty, setImageDirty] = useState(false);
  const [animationDirty, setAnimationDirty] = useState(false);
  const [metadataDirty, setMetadataDirty] = useState(false);

  const fetchClaim = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const c = await getClaim(memeId);
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
  }, [memeId, setToast]);

  useEffect(() => {
    if (!hasWallet || !canAccessPrepare) return;
    fetchClaim();
  }, [hasWallet, canAccessPrepare, fetchClaim]);

  const permissionFallback = DropControlPermissionFallback({
    title,
    permissionsLoading,
    hasWallet,
    hasAccess: canAccessPrepare,
  });

  if (permissionFallback) {
    return permissionFallback;
  }

  if (loading && !claim) {
    return (
      <div className="tw-px-2 tw-pb-16 tw-pt-2 lg:tw-px-6 lg:tw-pt-8 xl:tw-px-8">
        <h1 className="tw-mb-4 tw-text-3xl tw-font-semibold tw-text-iron-50">
          {title}
        </h1>
        <p className="tw-mb-0 tw-text-iron-400">Loading…</p>
      </div>
    );
  }

  if (error && !claim) {
    return (
      <div className="tw-px-2 tw-pb-16 tw-pt-2 lg:tw-px-6 lg:tw-pt-8 xl:tw-px-8">
        <h1 className="tw-mb-4 tw-text-3xl tw-font-semibold tw-text-iron-50">
          {title}
        </h1>
        <p className="tw-mb-0 tw-text-red-400" role="alert">
          {error}
        </p>
        <Link
          href="/drop-control/prepare"
          className="tw-mt-4 tw-inline-flex tw-items-center tw-gap-2 tw-text-iron-300 tw-no-underline hover:tw-text-iron-50"
        >
          <ArrowLeftIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
          Back to Claims list
        </Link>
      </div>
    );
  }

  if (!claim) return null;

  const hasPendingPageChanges = imageDirty || animationDirty || metadataDirty;

  return (
    <div className="tw-px-2 tw-pb-16 tw-pt-2 lg:tw-px-6 lg:tw-pt-8 xl:tw-px-8">
      <div className="tw-mb-6">
        <Link
          href="/drop-control/prepare"
          className="tw-inline-flex tw-items-center tw-gap-2 tw-text-iron-400 tw-no-underline hover:tw-text-iron-50"
        >
          <ArrowLeftIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
          Back to Claims list
        </Link>
        <h1 className="tw-mb-0 tw-mt-2 tw-text-3xl tw-font-semibold tw-text-iron-50">
          Claim #{claim.meme_id}
        </h1>
      </div>

      <div className="tw-mb-8">
        <ImageSection
          claim={claim}
          memeId={memeId}
          onUpdated={setClaim}
          onPendingChange={setImageDirty}
        />
      </div>

      <div className="tw-mb-8">
        <AnimationSection
          claim={claim}
          memeId={memeId}
          onUpdated={setClaim}
          onPendingChange={setAnimationDirty}
        />
      </div>

      <div className="tw-mb-8">
        <MetadataSection
          claim={claim}
          memeId={memeId}
          onUpdated={setClaim}
          onPendingChange={setMetadataDirty}
        />
      </div>

      <div>
        <ArweaveSection
          memeId={memeId}
          claim={claim}
          onSynced={fetchClaim}
          hasPendingChanges={hasPendingPageChanges}
        />
      </div>
    </div>
  );
}

function ImageSection({
  claim,
  memeId,
  onUpdated,
  onPendingChange,
}: {
  claim: MemeClaim;
  memeId: number;
  onUpdated: (c: MemeClaim) => void;
  onPendingChange: (dirty: boolean) => void;
}) {
  const { setToast } = useAuth();
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreviewUrl, setPendingImagePreviewUrl] = useState<
    string | null
  >(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imageUrl = pendingImagePreviewUrl ?? claim.image_url ?? null;

  function clearPendingImageSelection() {
    setPendingImageFile(null);
    setPendingImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  useEffect(() => {
    clearPendingImageSelection();
  }, [claim.meme_id, claim.image_url]);

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
        ? await uploadClaimMedia(memeId, "image_url", pendingImageFile)
        : (claim.image_url ?? null);
      const body: MemeClaimUpdateRequest = {
        image_url: imageUrlToSave,
      };
      const updated = await patchClaim(memeId, body);
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
    <div className={CARD_CLASS}>
      <h2 className="tw-mb-4 tw-text-lg tw-font-medium tw-text-iron-50">
        Image
      </h2>
      <div className="tw-mb-6 tw-flex tw-w-full tw-flex-col tw-gap-2">
        <div
          className="tw-relative tw-aspect-video tw-w-full tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-iron-800"
          onClick={!imageUrl ? () => imageInputRef.current?.click() : undefined}
          role={!imageUrl ? "button" : undefined}
          tabIndex={!imageUrl ? 0 : -1}
          onKeyDown={
            !imageUrl
              ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    imageInputRef.current?.click();
                  }
                }
              : undefined
          }
        >
          {imageUrl ? (
            <MediaDisplay
              media_mime_type={
                pendingImageFile?.type?.includes("image")
                  ? pendingImageFile.type
                  : "image/jpeg"
              }
              media_url={imageUrl}
            />
          ) : (
            <div className="tw-flex tw-h-full tw-w-full tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-text-iron-500">
              <span>No image</span>
              <span className="tw-text-sm">Click to Upload</span>
            </div>
          )}
        </div>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="tw-hidden"
          onChange={handleUpload}
        />
        {imageUrl && (
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
          <p className="tw-mb-0 tw-text-red-400 tw-text-sm" role="alert">
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
  memeId,
  onUpdated,
  onPendingChange,
}: {
  claim: MemeClaim;
  memeId: number;
  onUpdated: (c: MemeClaim) => void;
  onPendingChange: (dirty: boolean) => void;
}) {
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
  const animationDisplayUrl =
    pendingAnimationFile && pendingAnimationPreviewUrl
      ? pendingAnimationPreviewUrl
      : pendingAnimation === undefined
        ? claim.animation_url
        : pendingAnimation;
  const isAnimationVideoUrl = Boolean(animationDisplayUrl && isVideoUrl(animationDisplayUrl));
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
    if (mediaType === "glb" || lowered.endsWith(".glb")) return "model/gltf-binary";
    if (lowered.endsWith(".gltf")) return "model/gltf+json";
    if (
      mediaType === "html" ||
      canonicalizeInteractiveMediaUrl(animationDisplayUrl) !== null
    ) {
      return "text/html";
    }
    return null;
  })();

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
  }, [claim.meme_id, claim.animation_url]);

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
          memeId,
          "animation_url",
          pendingAnimationFile
        );
      } else if (pendingAnimation !== undefined) {
        animationUrlToSave = pendingAnimation;
      }
      const body: MemeClaimUpdateRequest = {
        animation_url: animationUrlToSave,
      };
      const updated = await patchClaim(memeId, body);
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

  return (
    <div className={CARD_CLASS}>
      <h2 className="tw-mb-4 tw-text-lg tw-font-medium tw-text-iron-50">
        Animation
      </h2>
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
            <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-300">
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
        {(hasAnimation ||
          pendingAnimation !== undefined ||
          pendingAnimationFile !== null) && (
          <>
            <span className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-500">
              {animationPreviewMimeType?.startsWith("video/")
                ? "Video"
                : animationPreviewMimeType?.startsWith("model/gltf")
                  ? "GLB"
                  : animationPreviewMimeType === "text/html"
                    ? "HTML"
                    : "Animation"}
            </span>
            {animationDisplayUrl && animationPreviewMimeType && (
              <div className="tw-relative tw-aspect-video tw-w-full tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-iron-800">
                <MediaDisplay
                  media_mime_type={animationPreviewMimeType}
                  media_url={animationDisplayUrl}
                  previewImageUrl={
                    animationPreviewMimeType === "text/html" ? imageUrl : undefined
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
              <p className="tw-mb-0 tw-text-sm tw-text-iron-500">Animation removed</p>
            )}
          </>
        )}

        {showAddLink && (
          <div className="tw-flex tw-flex-col tw-gap-2">
            <label className="tw-text-sm tw-text-iron-400">
              IPFS or Arweave URL (GLB or HTML)
            </label>
            <input
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
              <p className="tw-mb-0 tw-text-red-400 tw-text-sm" role="alert">
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

        {(hasAnimation ||
          pendingAnimation !== undefined ||
          pendingAnimationFile !== null) && (
          <div className="tw-flex tw-flex-wrap tw-gap-2">
            {replaceMode === null ? (
              <>
                <button
                  type="button"
                  onClick={() => setReplaceMode("choose")}
                  className={BTN_PRIMARY}
                >
                  {pendingAnimation === null ? "Add animation" : "Replace"}
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
            ) : replaceMode === "choose" ? (
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
            ) : (
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
                  <p className="tw-mb-0 tw-text-red-400 tw-w-full tw-text-sm" role="alert">
                    {linkError}
                  </p>
                )}
                <div className="tw-flex tw-flex-wrap tw-gap-2">
                  <button
                    type="button"
                    onClick={applyLink}
                    className={BTN_SUCCESS}
                  >
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
            )}
          </div>
        )}
      </div>

      {hasPendingChanges && (
        <form onSubmit={handleSave} className="tw-flex tw-flex-col tw-gap-2">
          {formError && (
            <p className="tw-mb-0 tw-text-red-400 tw-text-sm" role="alert">
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

function MetadataSection({
  claim,
  memeId,
  onUpdated,
  onPendingChange,
}: {
  claim: MemeClaim;
  memeId: number;
  onUpdated: (c: MemeClaim) => void;
  onPendingChange: (dirty: boolean) => void;
}) {
  const { setToast } = useAuth();
  const initialTraits = useMemo(() => claimToTraitsData(claim), [claim]);
  const [traits, setTraits] = useState<TraitsData>(initialTraits);
  const [editionSize, setEditionSize] = useState(
    claim.edition_size != null ? String(claim.edition_size) : ""
  );
  const [season, setSeason] = useState(() => getClaimSeason(claim));
  const [coreSaving, setCoreSaving] = useState(false);
  const [coreError, setCoreError] = useState<string | null>(null);
  const [traitsSaving, setTraitsSaving] = useState(false);
  const [traitsError, setTraitsError] = useState<string | null>(null);
  const [traitsFormKey, setTraitsFormKey] = useState(0);
  const traitsSaveButtonRef = useRef<HTMLButtonElement>(null);
  const mergeUpdatedClaim = useCallback(
    (updated: MemeClaim): MemeClaim => ({
      ...claim,
      ...updated,
      attributes:
        Array.isArray(updated.attributes) && updated.attributes.length > 0
          ? updated.attributes
          : claim.attributes,
    }),
    [claim]
  );

  useEffect(() => {
    setTraits(claimToTraitsData(claim));
    setEditionSize(
      claim.edition_size != null ? String(claim.edition_size) : ""
    );
    setSeason(getClaimSeason(claim));
    setCoreError(null);
    setTraitsError(null);
    setTraitsFormKey((prev) => prev + 1);
  }, [claim.meme_id]);

  const coreChanged =
    editionSize !==
      (claim.edition_size != null ? String(claim.edition_size) : "") ||
    season !== getClaimSeason(claim);
  const traitsChanged =
    JSON.stringify(traits) !== JSON.stringify(claimToTraitsData(claim));

  const editionSizeNum =
    editionSize !== "" && Number.isFinite(Number(editionSize))
      ? Number(editionSize)
      : null;
  const seasonNum =
    season !== "" && Number.isFinite(Number(season)) ? Number(season) : null;

  useEffect(() => {
    onPendingChange(coreChanged || traitsChanged);
  }, [coreChanged, traitsChanged, onPendingChange]);

  useEffect(() => {
    return () => onPendingChange(false);
  }, [onPendingChange]);

  async function handleCoreSave(e: React.FormEvent) {
    e.preventDefault();
    setCoreError(null);
    setCoreSaving(true);
    try {
      const body: Record<string, unknown> = {
        edition_size: editionSizeNum,
        season: seasonNum,
      };
      const updated = await patchClaim(memeId, body as MemeClaimUpdateRequest);
      const nextClaim = mergeUpdatedClaim(updated);
      setEditionSize(
        nextClaim.edition_size != null ? String(nextClaim.edition_size) : ""
      );
      setSeason(getClaimSeason(nextClaim));
      onUpdated(nextClaim);
      setToast({ message: "Core information updated", type: "success" });
    } catch (e) {
      const msg = getErrorMessage(e, "Update failed");
      setCoreError(msg);
      setToast({ message: msg, type: "error" });
    } finally {
      setCoreSaving(false);
    }
  }

  async function handleTraitsSave(e: React.FormEvent) {
    e.preventDefault();
    setTraitsError(null);
    const currentTraits = claimToTraitsData(claim);
    const previouslyFocused =
      typeof document !== "undefined" ? document.activeElement : null;
    setTraitsSaving(true);
    try {
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
      const updated = await patchClaim(memeId, body as MemeClaimUpdateRequest);
      const nextClaim = mergeUpdatedClaim(updated);
      setTraits(claimToTraitsData(nextClaim));
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
    <>
      <div className={`${CARD_CLASS} tw-mb-8`}>
        <h2 className="tw-mb-4 tw-text-lg tw-font-medium tw-text-iron-50">
          Core Information
        </h2>
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
            <p className="tw-mb-0 tw-text-red-400 tw-text-sm" role="alert">
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
                  claim.edition_size != null ? String(claim.edition_size) : ""
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
      </div>

      <div className={CARD_CLASS}>
        <h2 className="tw-mb-4 tw-text-lg tw-font-medium tw-text-iron-50">
          Metadata
        </h2>
        <form
          onSubmit={handleTraitsSave}
          noValidate
          className="tw-flex tw-flex-col tw-gap-2"
        >
          <ArtworkDetails
            title={traits.title}
            description={traits.description}
            onTitleChange={(title) =>
              setTraits((prev) => ({ ...prev, title }))
            }
            onDescriptionChange={(description) =>
              setTraits((prev) => ({ ...prev, description }))
            }
          />

          <div className="tw-mt-6 tw-space-y-4">
            <h3 className="tw-text-lg sm:tw-text-xl tw-font-semibold tw-text-iron-100 tw-mb-4 sm:tw-mb-6">
              Artwork Traits
            </h3>
          <MemesArtSubmissionTraits
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
            <p className="tw-mb-0 tw-text-red-400 tw-text-sm" role="alert">
              {traitsError}
            </p>
          )}
          <div className="tw-grid tw-grid-cols-2 tw-gap-2">
            <button
              ref={traitsSaveButtonRef}
              type="submit"
              disabled={traitsSaving || !traitsChanged}
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
              disabled={!traitsChanged}
              onClick={() => {
                setTraits(claimToTraitsData(claim));
                setTraitsError(null);
                setTraitsFormKey((prev) => prev + 1);
              }}
              className={`${BTN_DANGER} tw-w-full disabled:tw-opacity-50`}
            >
              Revert
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

const ARWEAVE_ROW_GRID =
  "tw-grid tw-grid-cols-[minmax(5rem,auto)_auto_auto_1fr] tw-gap-x-3 tw-items-center";

function ArweaveLinkRow({ label, url }: { label: string; url: string }) {
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
  memeId,
  claim,
  onSynced,
  hasPendingChanges,
}: {
  memeId: number;
  claim: MemeClaim;
  onSynced: () => Promise<void>;
  hasPendingChanges: boolean;
}) {
  const { setToast } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaUploading = claim.media_uploading === true;
  const canSync =
    claim.arweave_synced_at == null &&
    !hasPendingChanges &&
    !loading &&
    !mediaUploading;
  const synced = claim.arweave_synced_at != null;

  useEffect(() => {
    if (!mediaUploading) return;
    const id = setInterval(() => {
      void onSynced().catch((e) => {
        const msg = getErrorMessage(e, "Failed to refresh claim status");
        setError(msg);
      });
    }, 10000);
    return () => clearInterval(id);
  }, [mediaUploading, onSynced]);

  async function handleUpload() {
    if (!canSync) return;
    setError(null);
    setLoading(true);
    try {
      await postArweaveUpload(memeId);
      setToast({ message: "Upload to Arweave started", type: "success" });
      await onSynced();
    } catch (e) {
      const msg = getErrorMessage(e, "Upload failed");
      setError(msg);
      if (msg !== "Already synced" && msg !== "Not authorized") {
        setToast({ message: msg, type: "error" });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={CARD_CLASS}>
      <h2 className="tw-mb-4 tw-text-lg tw-font-medium tw-text-iron-50">
        Arweave
      </h2>
      <div className="tw-mb-4 tw-flex tw-items-center tw-gap-3">
        {mediaUploading ? (
          <>
            <CircleLoader size={CircleLoaderSize.SMALL} />
            <span className="tw-text-base tw-font-medium tw-text-primary-300">
              Uploading to Arweave…
            </span>
          </>
        ) : synced ? (
          <>
            <CheckCircleIcon className="tw-h-6 tw-w-6 tw-flex-shrink-0 tw-text-green" />
            <span className="tw-text-base tw-font-medium tw-text-green">
              Uploaded to Arweave
            </span>
          </>
        ) : (
          <>
            <XCircleIcon className="tw-h-6 tw-w-6 tw-flex-shrink-0 tw-text-red" />
            <span className="tw-text-base tw-font-medium tw-text-red">
              Not uploaded to Arweave
            </span>
          </>
        )}
      </div>
      {synced &&
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
      {!synced && (
        <div className="tw-mt-2 tw-flex tw-flex-col tw-gap-4">
          {!mediaUploading && (
            <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
              Sync this claim's media and metadata to Arweave.
            </p>
          )}
          {hasPendingChanges && (
            <p className="tw-mb-0 tw-text-yellow-400 tw-text-sm">
              Save or revert pending changes before uploading to Arweave.
            </p>
          )}
          {error && (
            <p className="tw-mb-0 tw-text-red-400 tw-text-sm" role="alert">
              {error}
            </p>
          )}
          {!mediaUploading && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={!canSync}
              className={`${BTN_PRIMARY} tw-w-fit`}
            >
              {loading ? (
                <span className="tw-inline-flex tw-items-center tw-gap-2">
                  <CircleLoader size={CircleLoaderSize.SMALL} />
                  <span>Uploading…</span>
                </span>
              ) : (
                "Upload to Arweave"
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
