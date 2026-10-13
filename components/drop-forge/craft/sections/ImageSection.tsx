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
  getErrorMessage,
  getImageSourceCardProps,
} from "@/components/drop-forge/craft/craft-claim-helpers";
import type { MintingClaim } from "@/generated/models/MintingClaim";
import type { MintingClaimUpdateRequest } from "@/generated/models/MintingClaimUpdateRequest";
import {
  patchClaim,
  uploadClaimMedia,
} from "@/services/api/memes-minting-claims-api";

export default function ImageSection({
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
  const imageSourceCardProps = getImageSourceCardProps({
    pendingImageFile,
    claimImageUrl: claim.image_url,
    imageUrl,
  });
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
      setToast({ message: "Image updated.", type: "success" });
    } catch (err) {
      const msg = getErrorMessage(err, "Update failed");
      setFormError(msg);
      setToast({
        type: "error",
        title: "Couldn't update this image.",
        description: "Please try again.",
        details: msg,
      });
    } finally {
      setSaving(false);
    }
  }

  const hasPendingChanges = pendingImageFile instanceof File;

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
        <MediaSourceLinkCard
          label={imageSourceCardProps.label}
          url={imageSourceCardProps.url}
          emptyText={imageSourceCardProps.emptyText}
        />
        {hasImage && (
          <button
            type="button"
            disabled={saving}
            onClick={() => imageInputRef.current?.click()}
            className={`${BTN_PRIMARY} tw-w-fit tw-self-center`}
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
