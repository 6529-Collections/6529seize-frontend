"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import type { ChangeEvent, FC, RefObject } from "react";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { TraitWrapper } from "../../traits/TraitWrapper";
import { MediaUploadItem, useMediaUpload } from "../hooks/useMediaUpload";
import FormSection from "../ui/FormSection";
import ValidationError from "../ui/ValidationError";

interface AdditionalMediaUploadProps {
  readonly supportingMedia: string[];
  readonly artworkCommentary: string;
  readonly aboutArtist: string;
  readonly previewImage: string;
  readonly requiresPreviewImage: boolean;
  readonly previewRequiredMediaType: string | null;
  readonly onSupportingMediaChange: (media: string[]) => void;
  readonly onPreviewImageChange: (url: string) => void;
  readonly onArtworkCommentaryChange: (commentary: string) => void;
  readonly onAboutArtistChange: (aboutArtist: string) => void;
  readonly errors?: {
    supportingMedia?: string;
    previewImage?: string;
    artworkCommentary?: string;
    aboutArtist?: string;
  };
}

const MAX_FILES = 4;

const AdditionalMediaUpload: FC<AdditionalMediaUploadProps> = ({
  artworkCommentary,
  aboutArtist,
  previewImage: _previewImage,
  requiresPreviewImage,
  previewRequiredMediaType,
  onSupportingMediaChange,
  onPreviewImageChange,
  onArtworkCommentaryChange,
  onAboutArtistChange,
  errors,
}) => {
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const previewInputRef = useRef<HTMLInputElement>(null);

  const mediaUpload = useMediaUpload(MAX_FILES);
  const previewUpload = useMediaUpload(1);

  const prevMediaUrlsRef = useRef<string>("");
  const prevPreviewUrlRef = useRef<string>("");

  const mediaServerUrls = useMemo(
    () => mediaUpload.getServerUrls(),
    [mediaUpload.items]
  );

  const previewServerUrl = useMemo(() => {
    const urls = previewUpload.getServerUrls();
    return urls[0] || "";
  }, [previewUpload.items]);

  useEffect(() => {
    const urlsKey = mediaServerUrls.join(",");
    if (urlsKey !== prevMediaUrlsRef.current) {
      prevMediaUrlsRef.current = urlsKey;
      onSupportingMediaChange(mediaServerUrls);
    }
  }, [mediaServerUrls, onSupportingMediaChange]);

  useEffect(() => {
    if (previewServerUrl !== prevPreviewUrlRef.current) {
      prevPreviewUrlRef.current = previewServerUrl;
      onPreviewImageChange(previewServerUrl);
    }
  }, [previewServerUrl, onPreviewImageChange]);

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
        className="tw-relative tw-aspect-square tw-overflow-hidden tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-900"
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

        {item.status === "uploading" && (
          <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-iron-900/60">
            <div className="tw-flex tw-flex-col tw-items-center tw-gap-1">
              <div className="tw-h-12 tw-w-12 tw-animate-spin tw-rounded-full tw-border-2 tw-border-primary-400 tw-border-t-transparent" />
              <span className="tw-text-xs tw-text-iron-300">
                {item.progress}%
              </span>
            </div>
          </div>
        )}

        {item.status === "error" && (
          <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-red/20">
            <span className="tw-px-2 tw-text-center tw-text-xs tw-text-red">
              {item.error || "Upload failed"}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="tw-absolute tw-right-1.5 tw-top-1.5 tw-z-10 tw-flex tw-size-6 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-800 tw-text-iron-300 tw-transition-all tw-duration-300 desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-text-red"
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

        {item.status === "done" && (
          <div className="tw-absolute tw-bottom-1.5 tw-left-1.5 tw-flex tw-size-5 tw-items-center tw-justify-center tw-rounded-full tw-bg-green/90">
            <svg
              className="tw-size-3 tw-flex-shrink-0 tw-text-white"
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
    maxItems: number,
    error?: string,
    acceptTypes: string = "image/*,video/*",
    description?: string
  ) => (
    <div className="tw-flex tw-flex-col tw-gap-y-2">
      <div className="tw-flex tw-items-center tw-justify-between">
        <span className="tw-text-sm tw-font-medium tw-text-iron-300">
          {title}
        </span>
        <button
          type="button"
          disabled={upload.items.length >= maxItems || upload.isUploading}
          onClick={() => inputRef.current?.click()}
          className="tw-flex tw-cursor-pointer tw-items-center tw-gap-x-1.5 tw-border-0 tw-bg-transparent tw-text-sm tw-font-semibold tw-text-primary-400 tw-transition tw-duration-300 tw-ease-out disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-text-primary-300"
          aria-label={`Add ${title}`}
        >
          <PlusIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
          {maxItems === 1 ? "Add" : `Add (Max ${maxItems})`}
        </button>
        <input
          type="file"
          ref={inputRef}
          className="tw-hidden"
          accept={acceptTypes}
          multiple={maxItems > 1}
          onChange={handleFileChange(upload)}
        />
      </div>

      {description && (
        <p className="tw-mb-0 tw-text-xs tw-text-amber-400">{description}</p>
      )}

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
        {requiresPreviewImage && (
          <div className="tw-flex tw-flex-col tw-gap-y-2">
            {renderMediaSection(
              "Preview Image *",
              previewUpload,
              previewInputRef,
              1,
              errors?.previewImage,
              "image/*",
              `${previewRequiredMediaType} submissions require a preview image or GIF. This will be used as the NFT's image field, while your main media is served via animation_url.`
            )}
          </div>
        )}

        <div className="tw-flex tw-flex-col tw-gap-y-2">
          {renderMediaSection(
            "Supporting Media",
            mediaUpload,
            mediaInputRef,
            MAX_FILES,
            errors?.supportingMedia,
            "image/*,video/*"
          )}
        </div>

        <div className="tw-flex tw-flex-col tw-gap-y-6">
          <TraitWrapper
            label="About the Artist *"
            id="about-artist"
            error={errors?.aboutArtist}
            isFieldFilled={!!aboutArtist.trim()}
            className="tw-pb-0"
          >
            <textarea
              placeholder="Tell us about yourself as an artist..."
              value={aboutArtist}
              onChange={(e) => onAboutArtistChange(e.target.value)}
              className={`tw-form-textarea tw-min-h-[120px] tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-py-3 tw-pl-4 tw-pr-11 tw-text-sm tw-text-iron-100 tw-outline-none tw-ring-1 focus:tw-ring-primary-400 ${
                errors?.aboutArtist ? "tw-ring-red" : "tw-ring-iron-700"
              }`}
            />
          </TraitWrapper>

          <TraitWrapper
            label="Artwork Commentary *"
            id="artwork-commentary"
            error={errors?.artworkCommentary}
            isFieldFilled={!!artworkCommentary.trim()}
            className="tw-pb-0"
          >
            <textarea
              placeholder="Tell us more about the artwork..."
              value={artworkCommentary}
              onChange={(e) => onArtworkCommentaryChange(e.target.value)}
              className={`tw-form-textarea tw-min-h-[120px] tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-py-3 tw-pl-4 tw-pr-11 tw-text-sm tw-text-iron-100 tw-outline-none tw-ring-1 focus:tw-ring-primary-400 ${
                errors?.artworkCommentary ? "tw-ring-red" : "tw-ring-iron-700"
              }`}
            />
          </TraitWrapper>
        </div>
      </div>
    </FormSection>
  );
};

export default memo(AdditionalMediaUpload);
