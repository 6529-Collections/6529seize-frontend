import { PlusIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/Auth";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import MediaSourceLinkCard from "@/components/drop-forge/craft/MediaSourceLinkCard";
import {
  BTN_DANGER,
  BTN_PRIMARY,
  BTN_SAVE,
  BTN_SUCCESS,
  BTN_TERTIARY,
  getAnimationDisplayUrl,
  getAnimationPreviewMimeType,
  getAnimationSourceCardProps,
  getClaimMediaType,
  getErrorMessage,
} from "@/components/drop-forge/craft/craft-claim-helpers";
import { canonicalizeInteractiveMediaUrl } from "@/components/waves/memes/submission/constants/security";
import type { MintingClaim } from "@/generated/models/MintingClaim";
import type { MintingClaimUpdateRequest } from "@/generated/models/MintingClaimUpdateRequest";
import {
  patchClaim,
  uploadClaimMedia,
} from "@/services/api/memes-minting-claims-api";

type AnimationReplaceMode = "choose" | "link" | null;

function AnimationReplaceControls({
  replaceMode,
  animationActionLabel,
  canRemoveAnimation,
  onChooseUpload,
  onSwitchToLink,
  onCancel,
  onRemoveAnimation,
}: Readonly<{
  replaceMode: AnimationReplaceMode;
  animationActionLabel: string;
  canRemoveAnimation: boolean;
  onChooseUpload: () => void;
  onSwitchToLink: () => void;
  onCancel: () => void;
  onRemoveAnimation: () => void;
}>) {
  if (replaceMode === null) {
    return (
      <>
        <button type="button" onClick={onChooseUpload} className={BTN_PRIMARY}>
          {animationActionLabel}
        </button>
        {canRemoveAnimation && (
          <button
            type="button"
            onClick={onRemoveAnimation}
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
        <button type="button" onClick={onChooseUpload} className={BTN_PRIMARY}>
          Upload from device
        </button>
        <button type="button" onClick={onSwitchToLink} className={BTN_SUCCESS}>
          Paste link
        </button>
        <button type="button" onClick={onCancel} className={BTN_TERTIARY}>
          Cancel
        </button>
      </div>
    );
  }

  return null;
}

export default function AnimationSection({
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
  const animationDisplayUrl = getAnimationDisplayUrl({
    pendingAnimationFile,
    pendingAnimationPreviewUrl,
    pendingAnimation,
    claimAnimationUrl: claim.animation_url,
  });
  const animationPreviewMimeType = getAnimationPreviewMimeType({
    pendingAnimationFile,
    animationDisplayUrl,
    mediaType,
  });
  const animationSourceCardProps = getAnimationSourceCardProps({
    pendingAnimationFile,
    pendingAnimation,
    claimAnimationUrl: claim.animation_url,
  });

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
    const url = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
    const canonical = canonicalizeInteractiveMediaUrl(url);
    if (!canonical) {
      setLinkError(
        "Link must be a valid IPFS or Arweave URL (e.g. ipfs://..., ar://..., or https://media.6529.io/...)"
      );
      return;
    }
    clearPendingAnimationFileSelection();
    setPendingAnimation(canonical);
    setLinkError(null);
    setLinkInput("");
    setReplaceMode(null);
    setToast({ message: "Link set. Save to apply it.", type: "success" });
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
      setToast({ message: "Animation updated.", type: "success" });
    } catch (err) {
      const msg = getErrorMessage(err, "Update failed");
      setFormError(msg);
      setToast({
        type: "error",
        title: "Couldn't update this animation.",
        description: "Please try again.",
        details: msg,
      });
    } finally {
      setSaving(false);
    }
  }

  const hasPendingAnimationChange = pendingAnimation !== undefined;
  const hasPendingAnimationUpload = pendingAnimationFile instanceof File;
  const hasPendingChanges =
    hasPendingAnimationChange || hasPendingAnimationUpload;
  const canRevert = hasPendingChanges;

  useEffect(() => {
    onPendingChange(hasPendingChanges);
  }, [hasPendingChanges, onPendingChange]);

  useEffect(() => {
    return () => onPendingChange(false);
  }, [onPendingChange]);

  const showAddFlow =
    !hasAnimation && !hasPendingAnimationChange && !hasPendingAnimationUpload;
  const showAnimationControls =
    hasAnimation || hasPendingAnimationChange || hasPendingAnimationUpload;
  const showAddChoice = showAddFlow && replaceMode === "choose";
  const showAddLink = showAddFlow && replaceMode === "link";
  const showReplaceLink =
    showAnimationControls && !showAddFlow && replaceMode === "link";
  const animationActionLabel =
    pendingAnimation === null ? "Add animation" : "Replace";
  const linkEditor = (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <label
        htmlFor="drop-forge-animation-link"
        className="tw-text-sm tw-text-iron-400"
      >
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
        placeholder="ipfs://... or ar://..."
        className="tw-w-full tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-iron-50 placeholder:tw-text-iron-500 focus:tw-border-iron-600 focus:tw-outline-none"
      />
      {linkError && (
        <p className="tw-mb-0 tw-text-sm tw-text-rose-300" role="alert">
          {linkError}
        </p>
      )}
      <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-2">
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
  );

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
        {showAddChoice && (
          <div className="tw-w-full tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-900/50 tw-p-4">
            <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-300">
              How do you want to add or replace the animation?
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
            {animationDisplayUrl && animationPreviewMimeType && (
              <div className="tw-relative tw-flex tw-aspect-video tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-iron-800">
                <MediaDisplay
                  media_mime_type={animationPreviewMimeType}
                  media_url={animationDisplayUrl}
                  fillVideoContainer
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
            <MediaSourceLinkCard
              label={animationSourceCardProps.label}
              url={animationSourceCardProps.url}
              emptyText={animationSourceCardProps.emptyText}
            />
          </>
        )}

        {showAddLink && linkEditor}

        {showAnimationControls && replaceMode !== "link" && (
          <div className="tw-flex tw-flex-wrap tw-gap-2">
            <AnimationReplaceControls
              replaceMode={replaceMode}
              animationActionLabel={animationActionLabel}
              canRemoveAnimation={pendingAnimation !== null}
              onChooseUpload={() => setReplaceMode("choose")}
              onSwitchToLink={() => setReplaceMode("link")}
              onCancel={() => setReplaceMode(null)}
              onRemoveAnimation={handleRemoveAnimation}
            />
          </div>
        )}

        {showReplaceLink && linkEditor}
      </div>

      {hasPendingChanges && (
        <form onSubmit={handleSave} className="tw-flex tw-flex-col tw-gap-2">
          {formError && (
            <p className="tw-mb-0 tw-text-sm tw-text-rose-300" role="alert">
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
