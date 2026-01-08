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
  const { commentary, mediaItems } = useMemo(() => {
    const metadata = drop.metadata ?? [];
    const commentaryEntry = metadata.find(
      (item) => item.data_key === MemesSubmissionAdditionalInfoKey.COMMENTARY
    );
    const additionalMediaEntry = metadata.find(
      (item) =>
        item.data_key === MemesSubmissionAdditionalInfoKey.ADDITIONAL_MEDIA
    );

    const commentaryValue = commentaryEntry?.data_value?.trim() ?? "";
    const additionalMedia = parseAdditionalMedia(
      additionalMediaEntry?.data_value
    );
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

    return { commentary: commentaryValue, mediaItems: mediaItemsValue };
  }, [drop.metadata]);

  const displayedMedia = mediaItems.slice(0, MAX_MEDIA);

  if (!commentary && displayedMedia.length === 0) {
    return null;
  }

  return (
    <section className="tw-space-y-6">
      <div className="tw-space-y-2">
        <h2 className="tw-text-lg tw-font-semibold tw-text-iron-100">
          Additional Media & Notes
        </h2>
        {commentary && (
          <p className="tw-mb-0 tw-text-sm tw-text-iron-400 tw-leading-relaxed">
            {commentary}
          </p>
        )}
      </div>

      {displayedMedia.length > 0 && (
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
                  alt={`Process media ${index + 1}`}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                  className="tw-object-contain"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
