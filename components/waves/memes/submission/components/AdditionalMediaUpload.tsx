"use client";

import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import type { ChangeEvent, FC, RefObject } from "react";
import Image from "next/image";
import FormSection from "../ui/FormSection";
import ValidationError from "../ui/ValidationError";
import { TraitWrapper } from "../../traits/TraitWrapper";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useMediaUpload, MediaUploadItem } from "../hooks/useMediaUpload";

interface AdditionalMediaUploadProps {
  readonly artworkCommentaryMedia: string[];
  readonly artworkCommentary: string;
  readonly onArtworkCommentaryMediaChange: (media: string[]) => void;
  readonly onArtworkCommentaryChange: (commentary: string) => void;
  readonly errors?: {
    artworkCommentaryMedia?: string;
    artworkCommentary?: string;
  };
}

const MAX_FILES = 4;

const AdditionalMediaUpload: FC<AdditionalMediaUploadProps> = ({
  artworkCommentary,
  onArtworkCommentaryMediaChange,
  onArtworkCommentaryChange,
  errors,
}) => {
  const commentaryInputRef = useRef<HTMLInputElement>(null);

  const commentaryUpload = useMediaUpload(MAX_FILES);

  // Track previous URL values to avoid unnecessary parent updates
  const prevCommentaryUrlsRef = useRef<string>("");

  // Memoize the server URLs to get stable references
  const commentaryServerUrls = useMemo(
    () => commentaryUpload.getServerUrls(),
    [commentaryUpload.items]
  );

  // Sync server URLs to parent only when they actually change
  useEffect(() => {
    const urlsKey = commentaryServerUrls.join(",");
    if (urlsKey !== prevCommentaryUrlsRef.current) {
      prevCommentaryUrlsRef.current = urlsKey;
      onArtworkCommentaryMediaChange(commentaryServerUrls);
    }
  }, [commentaryServerUrls, onArtworkCommentaryMediaChange]);

  const handleFileChange = useCallback(
    (upload: ReturnType<typeof useMediaUpload>) =>
      (e: ChangeEvent<HTMLInputElement>) => {
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
  ) => {
    const isVideo = item.file.type.startsWith("video/");
    const previewClassName = `tw-w-full tw-h-full tw-object-cover ${
      item.status === "uploading" ? "tw-opacity-50" : ""
    }`;

    return (
      <div
        key={item.id}
        className="tw-relative tw-aspect-square tw-rounded-lg tw-overflow-hidden tw-bg-iron-900 tw-border tw-border-iron-800"
      >
        {isVideo ? (
          <video
            src={item.previewUrl}
            className={previewClassName}
            controls
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <Image
            src={item.previewUrl}
            alt="Media preview"
            fill
            unoptimized
            sizes="100vw"
            className={previewClassName}
          />
        )}

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
          className="tw-border-0 tw-flex tw-items-center tw-justify-center tw-absolute tw-top-1.5 tw-right-1.5 tw-text-iron-300 tw-rounded-full tw-size-6 tw-transition-all tw-duration-300 tw-z-10 tw-cursor-pointer tw-bg-iron-800 desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-text-red"
          aria-label="Remove media"
        >
          <svg
            className="tw-size-3.5 tw-flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Success indicator */}
        {item.status === "done" && (
          <div className="tw-absolute tw-bottom-1.5 tw-left-1.5 tw-flex tw-items-center tw-justify-center tw-size-5 tw-rounded-full tw-bg-green/90">
            <svg
              className="tw-size-3 tw-text-white tw-flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
    );
  };

  const renderMediaSection = (
    title: string,
    upload: ReturnType<typeof useMediaUpload>,
    inputRef: RefObject<HTMLInputElement | null>,
    error?: string
  ) => (
    <div className="tw-flex tw-flex-col tw-gap-y-2">
      <div className="tw-flex tw-justify-between tw-items-center">
        <span className="tw-text-sm tw-font-medium tw-text-iron-300">{title}</span>
        <button
          type="button"
          disabled={upload.items.length >= MAX_FILES || upload.isUploading}
          onClick={() => inputRef.current?.click()}
          className="tw-bg-transparent tw-border-0 tw-flex tw-items-center tw-gap-x-1.5 tw-text-sm tw-font-semibold tw-text-primary-400 desktop-hover:hover:tw-text-primary-300 tw-cursor-pointer disabled:tw-opacity-50 disabled:tw-cursor-not-allowed tw-transition tw-duration-300 tw-ease-out"
          aria-label={`Add ${title}`}
        >
          <PlusIcon className="tw-w-4 tw-h-4 tw-flex-shrink-0" />
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
          "Artwork Commentary Media",
          commentaryUpload,
          commentaryInputRef,
          errors?.artworkCommentaryMedia
        )}

        <TraitWrapper
          label="Artwork Commentary"
          id="artwork-commentary"
          error={errors?.artworkCommentary}
          isFieldFilled={!!artworkCommentary}
        >
          <textarea
            placeholder="Tell us more about the artwork..."
            defaultValue={artworkCommentary}
            onBlur={(e) => onArtworkCommentaryChange(e.target.value)}
            className={`tw-form-textarea tw-w-full tw-rounded-lg tw-pl-4 tw-pr-11 tw-py-3 tw-text-sm tw-text-iron-100 tw-bg-iron-900 tw-border-0 tw-outline-none tw-ring-1 tw-min-h-[120px] focus:tw-ring-primary-400 ${
              errors?.artworkCommentary ? "tw-ring-red" : "tw-ring-iron-700"
            }`}
          />
        </TraitWrapper>
      </div>
    </FormSection>
  );
};

export default memo(AdditionalMediaUpload);
