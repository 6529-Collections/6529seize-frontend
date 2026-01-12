"use client";

import { useMemo } from "react";
import Image from "next/image";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { parseIpfsUrl } from "@/helpers/Helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { getFileInfoFromUrl } from "@/helpers/file.helpers";
import {
  AdditionalMedia,
  MemesSubmissionAdditionalInfoKey,
} from "@/components/waves/memes/submission/types/OperationalData";

const MAX_MEDIA = 4;
const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "m4v", "webm", "ogv"]);

const emptyAdditionalMedia: AdditionalMedia = {
  artist_profile_media: [],
  artwork_commentary_media: [],
  preview_image: "",
};

const parseAdditionalMedia = (rawValue?: string): AdditionalMedia => {
  if (!rawValue) {
    return emptyAdditionalMedia;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<AdditionalMedia> | null;
    if (!parsed || typeof parsed !== "object") {
      return emptyAdditionalMedia;
    }

    return {
      artist_profile_media: Array.isArray(parsed.artist_profile_media)
        ? parsed.artist_profile_media.filter(Boolean)
        : [],
      artwork_commentary_media: Array.isArray(parsed.artwork_commentary_media)
        ? parsed.artwork_commentary_media.filter(Boolean)
        : [],
      preview_image:
        typeof parsed.preview_image === "string" ? parsed.preview_image : "",
    };
  } catch {
    return emptyAdditionalMedia;
  }
};

const isVideoUrl = (url: string) => {
  const fileInfo = getFileInfoFromUrl(url);
  if (!fileInfo?.extension) {
    return false;
  }
  return VIDEO_EXTENSIONS.has(fileInfo.extension.toLowerCase());
};

interface WaveDropAdditionalInfoProps {
  readonly drop: ExtendedDrop;
}

export const WaveDropAdditionalInfo = ({
  drop,
}: WaveDropAdditionalInfoProps) => {
  const { commentary, aboutArtist, previewImage, mediaItems } = useMemo(() => {
    const metadata = drop.metadata ?? [];
    const getMetadataValue = (key: MemesSubmissionAdditionalInfoKey) =>
      metadata.find((item) => item.data_key === key)?.data_value?.trim() ?? "";

    const commentaryValue = getMetadataValue(
      MemesSubmissionAdditionalInfoKey.COMMENTARY
    );
    const aboutArtistValue = getMetadataValue(
      MemesSubmissionAdditionalInfoKey.ABOUT_ARTIST
    );

    const additionalMediaEntry = metadata.find(
      (item) =>
        item.data_key === MemesSubmissionAdditionalInfoKey.ADDITIONAL_MEDIA
    );
    const additionalMedia = parseAdditionalMedia(
      additionalMediaEntry?.data_value
    );

    const previewImageValue = additionalMedia.preview_image
      ? parseIpfsUrl(additionalMedia.preview_image)
      : "";

    const mediaItemsValue = additionalMedia.artwork_commentary_media
      .filter(
        (url): url is string =>
          typeof url === "string" && url.trim().length > 0
      )
      .map((url) => parseIpfsUrl(url))
      .filter((url): url is string => url.length > 0)
      .map((url) => {
        const isVideo = isVideoUrl(url);
        const displayUrl = isVideo
          ? url
          : getScaledImageUri(url, ImageScale.AUTOx600);
        return { url, displayUrl, isVideo };
      });

    return {
      commentary: commentaryValue,
      aboutArtist: aboutArtistValue,
      previewImage: previewImageValue,
      mediaItems: mediaItemsValue,
    };
  }, [drop.metadata]);

  const displayedMedia = mediaItems.slice(0, MAX_MEDIA);
  const hasContent =
    previewImage ||
    displayedMedia.length > 0 ||
    aboutArtist ||
    commentary;

  if (!hasContent) {
    return null;
  }

  return (
    <section className="tw-space-y-8">
      {previewImage && (
        <div className="tw-space-y-2">
          <h3 className="tw-text-base tw-font-semibold tw-text-iron-100">
            Preview Image
          </h3>
          <div className="tw-flex tw-justify-center">
            <div className="tw-relative tw-aspect-[4/3] tw-w-full tw-max-w-2xl tw-overflow-hidden tw-bg-white/[0.02]">
              <Image
                src={getScaledImageUri(previewImage, ImageScale.AUTOx600)}
                alt="Preview image"
                fill
                sizes="(min-width: 768px) 400px, 100vw"
                className="tw-object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {displayedMedia.length > 0 && (
        <div className="tw-space-y-2">
          <h3 className="tw-text-base tw-font-semibold tw-text-iron-100">
            Additional Media
          </h3>
          <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-3 md:tw-gap-4">
            {displayedMedia.map((item, index) => (
              <div
                key={`${item.url}-${index}`}
                className={`tw-relative tw-overflow-hidden tw-bg-white/[0.02] ${
                  item.isVideo
                    ? "tw-aspect-video sm:tw-col-span-2"
                    : "tw-aspect-[4/3]"
                }`}
              >
                {item.isVideo ? (
                  <video
                    src={item.url}
                    className="tw-h-full tw-w-full tw-object-cover"
                    controls
                    preload="metadata"
                  >
                    <track
                      kind="captions"
                      src="data:text/vtt,WEBVTT"
                      srcLang="en"
                      label="Captions"
                    />
                  </video>
                ) : (
                  <Image
                    src={item.displayUrl}
                    alt={`Additional media ${index + 1}`}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                    className="tw-object-contain"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {aboutArtist && (
        <div className="tw-space-y-2">
          <h3 className="tw-text-base tw-font-semibold tw-text-iron-100">
            About the Artist
          </h3>
          <p className="tw-mb-0 tw-text-sm tw-text-iron-400 tw-leading-relaxed tw-whitespace-pre-wrap">
            {aboutArtist}
          </p>
        </div>
      )}

      {commentary && (
        <div className="tw-space-y-2">
          <h3 className="tw-text-base tw-font-semibold tw-text-iron-100">
            Artwork Commentary
          </h3>
          <p className="tw-mb-0 tw-text-sm tw-text-iron-400 tw-leading-relaxed tw-whitespace-pre-wrap">
            {commentary}
          </p>
        </div>
      )}
    </section>
  );
};
