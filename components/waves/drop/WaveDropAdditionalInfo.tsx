"use client";

import {
  AdditionalMedia,
  MemesSubmissionAdditionalInfoKey,
} from "@/components/waves/memes/submission/types/OperationalData";
import DropListItemContentMediaImage from "@/components/drops/view/item/content/media/DropListItemContentMediaImage";
import { WaveDropAdditionalInfoVideo } from "./WaveDropAdditionalInfoVideo";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import { getFileInfoFromUrl } from "@/helpers/file.helpers";
import { ImageScale } from "@/helpers/image.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useMemo } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

const MAX_MEDIA = 4;
const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "m4v", "webm", "ogv"]);

const emptyAdditionalMedia: AdditionalMedia = {
  artist_profile_media: [],
  artwork_commentary_media: [],
  preview_image: "",
  promo_video: "",
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
      promo_video:
        typeof parsed.promo_video === "string" ? parsed.promo_video : "",
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
  const locale = useBrowserLocale();
  const { commentary, aboutArtist, previewImage, promoVideo, mediaItems } =
    useMemo(() => {
      const metadata = drop.metadata ?? [];
      const getMetadataValue = (key: MemesSubmissionAdditionalInfoKey) =>
        metadata.find((item) => item.data_key === key)?.data_value?.trim() ??
        "";

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
        ? resolveIpfsUrlSync(additionalMedia.preview_image)
        : "";

      const promoVideoValue = additionalMedia.promo_video
        ? resolveIpfsUrlSync(additionalMedia.promo_video)
        : "";

      const resolvedMediaUrls = additionalMedia.artwork_commentary_media
        .filter(
          (url): url is string =>
            typeof url === "string" && url.trim().length > 0
        )
        .map((url) => resolveIpfsUrlSync(url))
        .filter((url): url is string => url.length > 0);
      const mediaItemsValue = Array.from(new Set(resolvedMediaUrls)).map(
        (url) => {
          const isVideo = isVideoUrl(url);
          return { url, isVideo };
        }
      );

      return {
        commentary: commentaryValue,
        aboutArtist: aboutArtistValue,
        previewImage: previewImageValue,
        promoVideo: promoVideoValue,
        mediaItems: mediaItemsValue,
      };
    }, [drop.metadata]);

  const displayedMedia = mediaItems.slice(0, MAX_MEDIA);
  const hasContent =
    previewImage ||
    promoVideo ||
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
            {t(locale, "drop.additionalInfo.previewImage")}
          </h3>
          <div className="tw-flex tw-justify-center">
            <div className="tw-relative tw-aspect-[4/3] tw-w-full tw-max-w-2xl tw-overflow-hidden tw-bg-white/[0.02]">
              <DropListItemContentMediaImage
                src={previewImage}
                alt={t(locale, "drop.additionalInfo.previewImageAlt")}
                openPreviewLabel={t(
                  locale,
                  "drop.additionalInfo.openPreviewImage"
                )}
                imageScale={ImageScale.AUTOx600}
                imageObjectPosition="center"
              />
            </div>
          </div>
        </div>
      )}

      {promoVideo && (
        <div className="tw-space-y-2">
          <h3 className="tw-text-base tw-font-semibold tw-text-iron-100">
            {t(locale, "drop.additionalInfo.promoVideo")}
          </h3>
          <div className="tw-flex tw-justify-center">
            <div className="tw-flex tw-w-full tw-max-w-2xl tw-justify-center">
              <WaveDropAdditionalInfoVideo
                src={promoVideo}
                preload="metadata"
                layout="prominent"
              />
            </div>
          </div>
        </div>
      )}

      {displayedMedia.length > 0 && (
        <div className="tw-space-y-2">
          <h3 className="tw-text-base tw-font-semibold tw-text-iron-100">
            {t(locale, "drop.additionalInfo.additionalMedia")}
          </h3>
          <div className="tw-grid tw-grid-cols-2 tw-gap-3 md:tw-gap-4">
            {displayedMedia.map((item, index) => (
              <div
                key={item.url}
                className={`tw-relative tw-overflow-hidden tw-bg-white/[0.02] ${
                  item.isVideo
                    ? "tw-col-span-2 tw-aspect-video"
                    : "tw-aspect-[4/3]"
                }`}
              >
                {item.isVideo ? (
                  <WaveDropAdditionalInfoVideo
                    src={item.url}
                    preload="none"
                    layout="fill"
                  />
                ) : (
                  <DropListItemContentMediaImage
                    src={item.url}
                    alt={t(locale, "drop.additionalInfo.mediaAlt", {
                      index: index + 1,
                    })}
                    openPreviewLabel={t(
                      locale,
                      "drop.additionalInfo.openMedia",
                      { index: index + 1 }
                    )}
                    imageScale={ImageScale.AUTOx600}
                    imageObjectPosition="center"
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
            {t(locale, "drop.additionalInfo.aboutArtist")}
          </h3>
          <p className="tw-mb-0 tw-whitespace-pre-wrap tw-text-sm tw-leading-relaxed tw-text-iron-400">
            {aboutArtist}
          </p>
        </div>
      )}

      {commentary && (
        <div className="tw-space-y-2">
          <h3 className="tw-text-base tw-font-semibold tw-text-iron-100">
            {t(locale, "drop.additionalInfo.commentary")}
          </h3>
          <p className="tw-mb-0 tw-whitespace-pre-wrap tw-text-sm tw-leading-relaxed tw-text-iron-400">
            {commentary}
          </p>
        </div>
      )}
    </section>
  );
};
