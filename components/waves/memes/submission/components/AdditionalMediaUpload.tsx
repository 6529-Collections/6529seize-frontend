"use client";

import React, { useCallback, useRef, useEffect } from "react";
import FormSection from "../ui/FormSection";
import ValidationError from "../ui/ValidationError";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useMediaUpload, MediaUploadItem } from "../hooks/useMediaUpload";

interface AdditionalMediaUploadProps {
  readonly artistProfileMedia: string[];
  readonly artworkCommentaryMedia: string[];
  readonly artworkCommentary: string;
  readonly onArtistProfileMediaChange: (media: string[]) => void;
  readonly onArtworkCommentaryMediaChange: (media: string[]) => void;
  readonly onArtworkCommentaryChange: (commentary: string) => void;
  readonly errors?: {
    artistProfileMedia?: string;
    artworkCommentaryMedia?: string;
    artworkCommentary?: string;
  };
}

const MAX_FILES = 4;

const AdditionalMediaUpload: React.FC<AdditionalMediaUploadProps> = ({
  artworkCommentary,
  onArtistProfileMediaChange,
  onArtworkCommentaryMediaChange,
  onArtworkCommentaryChange,
  errors,
}) => {
  const artistInputRef = useRef<HTMLInputElement>(null);
  const commentaryInputRef = useRef<HTMLInputElement>(null);

  const artistUpload = useMediaUpload(MAX_FILES);
  const commentaryUpload = useMediaUpload(MAX_FILES);

  // Sync server URLs to parent when uploads complete
  useEffect(() => {
    const urls = artistUpload.getServerUrls();
    onArtistProfileMediaChange(urls);
  }, [artistUpload.items, artistUpload.getServerUrls, onArtistProfileMediaChange]);

  useEffect(() => {
    const urls = commentaryUpload.getServerUrls();
    onArtworkCommentaryMediaChange(urls);
  }, [commentaryUpload.items, commentaryUpload.getServerUrls, onArtworkCommentaryMediaChange]);

  const handleFileChange = useCallback(
    (upload: ReturnType<typeof useMediaUpload>) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        upload.addFiles(Array.from(files));
        e.target.value = "";
      },
    []
  );

  const renderMediaItem = (
    item: MediaUploadItem,
    onRemove: (id: string) => void
  ) => (
    <div
      key={item.id}
      className="tw-relative tw-aspect-square tw-rounded-lg tw-overflow-hidden tw-bg-iron-900 tw-border tw-border-iron-800"
    >
      <img
        src={item.previewUrl}
        alt="Media preview"
        className={`tw-w-full tw-h-full tw-object-cover ${
          item.status === "uploading" ? "tw-opacity-50" : ""
        }`}
      />

      {/* Upload progress overlay */}
      {item.status === "uploading" && (
        <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-iron-900/60">
          <div className="tw-flex tw-flex-col tw-items-center tw-gap-1">
            <div className="tw-w-12 tw-h-12 tw-rounded-full tw-border-2 tw-border-primary-400 tw-border-t-transparent tw-animate-spin" />
            <span className="tw-text-xs tw-text-iron-300">{item.progress}%</span>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {item.status === "error" && (
        <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-red/20">
          <span className="tw-text-xs tw-text-red tw-text-center tw-px-2">
            {item.error || "Upload failed"}
          </span>
        </div>
      )}

      {/* Remove button */}
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="tw-absolute tw-top-1 tw-right-1 tw-p-1 tw-rounded-full tw-bg-iron-900/80 tw-text-iron-100 hover:tw-text-red tw-transition-colors"
        aria-label="Remove media"
      >
        <XMarkIcon className="tw-w-3 tw-h-3" />
      </button>

      {/* Success indicator */}
      {item.status === "done" && (
        <div className="tw-absolute tw-bottom-1 tw-left-1 tw-p-1 tw-rounded-full tw-bg-green/80">
          <svg className="tw-w-3 tw-h-3 tw-text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );

  const renderMediaSection = (
    title: string,
    upload: ReturnType<typeof useMediaUpload>,
    inputRef: React.RefObject<HTMLInputElement | null>,
    error?: string
  ) => (
    <div className="tw-flex tw-flex-col tw-gap-y-2">
      <div className="tw-flex tw-justify-between tw-items-center">
        <span className="tw-text-sm tw-font-medium tw-text-iron-300">{title}</span>
        <button
          type="button"
          disabled={upload.items.length >= MAX_FILES || upload.isUploading}
          onClick={() => inputRef.current?.click()}
          className="tw-flex tw-items-center tw-gap-x-1.5 tw-text-sm tw-font-semibold tw-text-primary-400 hover:tw-text-primary-300 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed tw-transition-colors"
          aria-label={`Add ${title}`}
        >
          <PlusIcon className="tw-w-4 tw-h-4" />
          Add (Max {MAX_FILES})
        </button>
        <input
          type="file"
          ref={inputRef}
          className="tw-hidden"
          accept="image/*,video/*"
          multiple
          onChange={handleFileChange(upload)}
        />
      </div>

      {upload.items.length > 0 && (
        <div className="tw-grid tw-grid-cols-4 tw-gap-4">
          {upload.items.map((item) => renderMediaItem(item, upload.removeItem))}
        </div>
      )}

      <ValidationError error={error} />
    </div>
  );

  return (
    <FormSection title="Supplemental Media & Commentary">
      <div className="tw-flex tw-flex-col tw-gap-y-8">
        {renderMediaSection(
          "Artist Profile Media",
          artistUpload,
          artistInputRef,
          errors?.artistProfileMedia
        )}

        {renderMediaSection(
          "Artwork Commentary Media",
          commentaryUpload,
          commentaryInputRef,
          errors?.artworkCommentaryMedia
        )}

        <div className="tw-group tw-relative">
          <div className="tw-relative">
            <label
              htmlFor="artwork-commentary"
              className={`tw-absolute tw-left-3 -tw-top-2 tw-px-1 tw-text-xs tw-font-medium tw-bg-iron-900 tw-z-10 tw-transition-all ${
                errors?.artworkCommentary ? "tw-text-red" : "tw-text-iron-300"
              }`}
            >
              Artwork Commentary
            </label>
            <textarea
              id="artwork-commentary"
              placeholder="Tell us more about the artwork..."
              defaultValue={artworkCommentary}
              onBlur={(e) => onArtworkCommentaryChange(e.target.value)}
              className={`tw-form-textarea tw-w-full tw-rounded-lg tw-px-4 tw-py-3 tw-text-sm tw-text-iron-100 tw-bg-iron-900 tw-border-0 tw-outline-none tw-ring-1 tw-min-h-[120px] focus:tw-ring-primary-400 ${
                errors?.artworkCommentary ? "tw-ring-red" : "tw-ring-iron-700"
              }`}
            />
          </div>
          <ValidationError error={errors?.artworkCommentary} />
        </div>
      </div>
    </FormSection>
  );
};

export default React.memo(AdditionalMediaUpload);
