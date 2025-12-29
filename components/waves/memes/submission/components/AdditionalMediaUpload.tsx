"use client";

import React, { useCallback, useRef } from "react";
import FormSection from "../ui/FormSection";
import ValidationError from "../ui/ValidationError";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

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
  artistProfileMedia,
  artworkCommentaryMedia,
  artworkCommentary,
  onArtistProfileMediaChange,
  onArtworkCommentaryMediaChange,
  onArtworkCommentaryChange,
  errors,
}) => {
  const artistInputRef = useRef<HTMLInputElement>(null);
  const commentaryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (
      type: "artist" | "commentary",
      currentMedia: string[],
      onChange: (media: string[]) => void
    ) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newFiles = Array.from(files);
        if (currentMedia.length + newFiles.length > MAX_FILES) {
          // This should ideally be handled by validation or a toast
          return;
        }

        // Mocking upload by creating object URLs
        // In a real scenario, this would involve useFileUploader or similar
        const newUrls = newFiles.map((file) => URL.createObjectURL(file));
        onChange([...currentMedia, ...newUrls]);
        
        // Reset input
        e.target.value = "";
      },
    []
  );

  const handleRemoveMedia = useCallback(
    (index: number, currentMedia: string[], onChange: (media: string[]) => void) => {
      const newMedia = [...currentMedia];
      newMedia.splice(index, 1);
      onChange(newMedia);
    },
    []
  );

  const renderMediaSection = (
    title: string,
    media: string[],
    inputRef: React.RefObject<HTMLInputElement>,
    onChange: (media: string[]) => void,
    error?: string
  ) => (
    <div className="tw-flex tw-flex-col tw-gap-y-2">
      <div className="tw-flex tw-justify-between tw-items-center">
        <span className="tw-text-sm tw-font-medium tw-text-iron-300">{title}</span>
        <button
          type="button"
          disabled={media.length >= MAX_FILES}
          onClick={() => inputRef.current?.click()}
          className="tw-flex tw-items-center tw-gap-x-1.5 tw-text-sm tw-font-semibold tw-text-primary-400 hover:tw-text-primary-300 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed tw-transition-colors"
          aria-label={`Add ${title}`}
        >
          <PlusIcon className="tw-w-4 tw-h-4" />
          Add (Max 4)
        </button>
        <input
          type="file"
          ref={inputRef}
          className="tw-hidden"
          accept="image/*,video/*"
          multiple
          onChange={handleFileChange(
            title.toLowerCase().includes("artist") ? "artist" : "commentary",
            media,
            onChange
          )}
        />
      </div>

      <div className="tw-grid tw-grid-cols-4 tw-gap-4">
        {media.map((url, index) => (
          <div key={index} className="tw-relative tw-aspect-square tw-rounded-lg tw-overflow-hidden tw-bg-iron-900 tw-border tw-border-iron-800">
            <img
              src={url}
              alt={`Media ${index + 1}`}
              className="tw-w-full tw-h-full tw-object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemoveMedia(index, media, onChange)}
              className="tw-absolute tw-top-1 tw-right-1 tw-p-1 tw-rounded-full tw-bg-iron-900/80 tw-text-iron-100 hover:tw-text-red tw-transition-colors"
              aria-label="Remove media"
            >
              <XMarkIcon className="tw-w-3 tw-h-3" />
            </button>
          </div>
        ))}
      </div>
      <ValidationError error={error} />
    </div>
  );

  return (
    <FormSection title="Supplemental Media & Commentary">
      <div className="tw-flex tw-flex-col tw-gap-y-8">
        {renderMediaSection(
          "Artist Profile Media",
          artistProfileMedia,
          artistInputRef,
          onArtistProfileMediaChange,
          errors?.artistProfileMedia
        )}

        {renderMediaSection(
          "Artwork Commentary Media",
          artworkCommentaryMedia,
          commentaryInputRef,
          onArtworkCommentaryMediaChange,
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
              className={`tw-form-textarea tw-w-full tw-rounded-lg tw-px-4 tw-py-3 tw-text-sm tw-text-iron-100 tw-bg-iron-900 tw-border-0 tw-outline-none tw-ring-1 tw-min-h-[120px] ${
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
