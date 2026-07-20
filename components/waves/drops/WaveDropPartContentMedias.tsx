import React from "react";
import clsx from "clsx";
import type { ApiDropPart } from "@/generated/models/ApiDropPart";
import { ApiDropMediaStatus } from "@/generated/models/ApiDropMediaStatus";
import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import { getDropImageGalleryItemId } from "@/components/drops/view/part/dropImageGallery";
import { ImageScale } from "@/helpers/image.helpers";
import WaveDropPartContentMediaImage from "./WaveDropPartContentMediaImage";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { t, type MessageKey } from "@/i18n/messages";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { useOptionalDropContext } from "./DropContext";
import {
  INTERACTIVE_HTML_MEDIA_CONTAINER_CLASS_NAME,
  INTERACTIVE_HTML_MEDIA_VIEWPORT_CLASS_NAME,
  isInteractiveHtmlMedia,
} from "@/components/drops/view/item/content/media/interactiveHtmlMediaLayout";

function isRenderableMedia(mimeType: string, url: string): boolean {
  return (
    mimeType.includes("image") ||
    mimeType.includes("video") ||
    mimeType.includes("audio") ||
    mimeType === "model/gltf-binary" ||
    mimeType === "model/gltf+json" ||
    mimeType === "text/html" ||
    url.endsWith(".glb") ||
    url.endsWith(".gltf")
  );
}

function getInteractiveHtmlViewportClassName(
  mimeType: string
): string | undefined {
  if (!isInteractiveHtmlMedia(mimeType)) {
    return undefined;
  }

  return INTERACTIVE_HTML_MEDIA_VIEWPORT_CLASS_NAME;
}

function isMediaProcessing(media: ApiDropPart["media"][number]): boolean {
  return (
    media.media_status === ApiDropMediaStatus.Uploading ||
    media.media_status === ApiDropMediaStatus.Processing
  );
}

function isMediaFailed(media: ApiDropPart["media"][number]): boolean {
  return media.media_status === ApiDropMediaStatus.Failed;
}

function getMediaProcessingPlaceholderMessageKey({
  failed,
  useImageCopy,
}: {
  readonly failed: boolean;
  readonly useImageCopy: boolean;
}): MessageKey {
  if (failed) {
    if (useImageCopy) {
      return "drop.media.unavailable";
    }

    return "drop.media.unavailableGeneric";
  }

  if (useImageCopy) {
    return "drop.media.processing";
  }

  return "drop.media.processingGeneric";
}

const MediaProcessingPlaceholder: React.FC<{
  readonly failed: boolean;
  readonly useImageCopy: boolean;
}> = ({ failed, useImageCopy }) => {
  const messageKey = getMediaProcessingPlaceholderMessageKey({
    failed,
    useImageCopy,
  });

  return (
    <div className="tw-flex tw-h-full tw-min-h-40 tw-w-full tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-text-center">
      <div className="tw-flex tw-flex-col tw-items-center tw-gap-2">
        {!failed && <CircleLoader size={CircleLoaderSize.LARGE} />}
        <span className="tw-text-sm tw-font-medium tw-text-iron-200">
          {t(DEFAULT_LOCALE, messageKey)}
        </span>
      </div>
    </div>
  );
};

interface WaveDropPartContentMediasProps {
  readonly activePart: ApiDropPart;
  readonly disableMediaInteraction?: boolean | undefined;
  readonly isCompetitionDrop?: boolean | undefined;
  readonly imageScale?: ImageScale | undefined;
  readonly mediaContainerHeightClassName?: string | undefined;
  readonly fullWidthMedia?: boolean | undefined;
}

const WaveDropPartContentMedias: React.FC<WaveDropPartContentMediasProps> = ({
  activePart,
  disableMediaInteraction = false,
  isCompetitionDrop = false,
  imageScale = ImageScale.AUTOx450,
  mediaContainerHeightClassName = "tw-h-64",
  fullWidthMedia = false,
}) => {
  const dropContext = useOptionalDropContext();

  if (!activePart.media.length) {
    return null;
  }

  const imageGridClassName =
    "tw-grid tw-w-full tw-grid-cols-1 tw-items-start tw-justify-start tw-gap-2 sm:tw-grid-cols-[repeat(auto-fit,minmax(min(12rem,100%),16rem))]";

  const hasContentBeforeMedia =
    Boolean(activePart.content?.trim()) ||
    Boolean(activePart.quoted_drop?.drop_id);
  let topSpacingClassName = "tw-mt-1";

  if (hasContentBeforeMedia) {
    topSpacingClassName = "tw-mt-4";
  } else if (fullWidthMedia) {
    topSpacingClassName = "tw-mt-0";
  }

  const mediaStackClassName = clsx(topSpacingClassName, "tw-space-y-3");
  const getMediaContainerClassName = ({
    groupedImage,
    reserveMediaHeight,
    useNaturalHeightMedia,
    useCompactLink,
    alignStart,
    useInteractiveHtmlLayout,
  }: {
    readonly groupedImage: boolean;
    readonly reserveMediaHeight: boolean;
    readonly useNaturalHeightMedia: boolean;
    readonly useCompactLink: boolean;
    readonly alignStart: boolean;
    readonly useInteractiveHtmlLayout: boolean;
  }) => {
    if (useCompactLink) {
      return "tw-w-full";
    }

    if (useInteractiveHtmlLayout) {
      return `${INTERACTIVE_HTML_MEDIA_CONTAINER_CLASS_NAME} tw-flex tw-items-center tw-justify-center`;
    }

    if (reserveMediaHeight) {
      return clsx(
        "tw-flex tw-w-full tw-items-center tw-justify-center",
        groupedImage ? "tw-min-w-0" : "tw-min-w-[min(200px,100%)]",
        mediaContainerHeightClassName
      );
    }

    if (groupedImage) {
      return "tw-min-w-0 tw-w-full";
    }

    if (useNaturalHeightMedia) {
      return clsx(
        "tw-flex tw-w-full tw-min-w-[min(200px,100%)] tw-items-start",
        alignStart ? "tw-justify-start" : "tw-justify-center"
      );
    }

    return clsx(
      "tw-flex tw-min-w-[min(200px,100%)] tw-items-center tw-justify-center",
      mediaContainerHeightClassName,
      fullWidthMedia && "tw-w-full"
    );
  };

  const renderMedia = (
    media: ApiDropPart["media"][number],
    i: number,
    groupedImage = false
  ) => {
    const reserveFullWidthMediaHeight =
      fullWidthMedia && Boolean(dropContext?.reserveMediaHeight);
    const useNaturalHeightImage =
      fullWidthMedia &&
      media.mime_type.includes("image") &&
      !reserveFullWidthMediaHeight;
    const useImageReservedHeight =
      media.mime_type.includes("image") &&
      (!fullWidthMedia || reserveFullWidthMediaHeight);
    const useVideoReservedHeight =
      media.mime_type.includes("video") && reserveFullWidthMediaHeight;
    const useNaturalHeightVideo =
      media.mime_type.includes("video") && !useVideoReservedHeight;
    const galleryItemId = media.mime_type.includes("image")
      ? getDropImageGalleryItemId("media", i, media.url)
      : undefined;
    const useCompactLink = !isRenderableMedia(media.mime_type, media.url);
    const htmlIframeViewportClassName = getInteractiveHtmlViewportClassName(
      media.mime_type
    );
    const useInteractiveHtmlLayout = Boolean(htmlIframeViewportClassName);
    const isImageMedia = media.mime_type.includes("image");
    const isProcessingMedia = isMediaProcessing(media);
    const isFailedMedia = isMediaFailed(media);
    const mediaContainerClassName = getMediaContainerClassName({
      groupedImage,
      reserveMediaHeight: useImageReservedHeight || useVideoReservedHeight,
      useNaturalHeightMedia: useNaturalHeightImage || useNaturalHeightVideo,
      useCompactLink,
      alignStart: useNaturalHeightVideo,
      useInteractiveHtmlLayout,
    });
    let mediaContent;

    if (isProcessingMedia || isFailedMedia) {
      mediaContent = (
        <MediaProcessingPlaceholder
          failed={isFailedMedia}
          useImageCopy={isImageMedia}
        />
      );
    } else if (disableMediaInteraction) {
      mediaContent = (
        <MediaDisplay
          media_mime_type={media.mime_type}
          media_url={media.url}
          disableMediaInteraction={disableMediaInteraction}
          imageScale={imageScale}
          htmlIframeViewportClassName={htmlIframeViewportClassName}
        />
      );
    } else if (useNaturalHeightImage || useImageReservedHeight) {
      mediaContent = (
        <WaveDropPartContentMediaImage
          src={media.url}
          imageScale={imageScale}
          imageObjectPosition={
            useImageReservedHeight && !fullWidthMedia ? "left top" : "center"
          }
          galleryItemId={galleryItemId}
          fillContainer={useImageReservedHeight}
        />
      );
    } else {
      mediaContent = (
        <DropListItemContentMedia
          media_mime_type={media.mime_type}
          media_url={media.url}
          isCompetitionDrop={isCompetitionDrop}
          imageScale={imageScale}
          galleryItemId={galleryItemId}
          fillVideoContainer={useVideoReservedHeight}
          htmlIframeViewportClassName={htmlIframeViewportClassName}
        />
      );
    }

    return (
      <div key={`part-${i}-media-${media.url}`}>
        <div className={mediaContainerClassName}>{mediaContent}</div>
      </div>
    );
  };

  const mediaElements: React.ReactNode[] = [];
  let imageRun: Array<{ media: ApiDropPart["media"][number]; index: number }> =
    [];

  const flushImageRun = () => {
    if (imageRun.length === 0) {
      return;
    }

    if (imageRun.length === 1) {
      const [item] = imageRun;
      if (item) {
        mediaElements.push(renderMedia(item.media, item.index));
      }
      imageRun = [];
      return;
    }

    mediaElements.push(
      <div
        key={`image-media-group:${imageRun
          .map((item) => `${item.index}:${item.media.url}`)
          .join("|")}`}
        className={imageGridClassName}
      >
        {imageRun.map((item) => renderMedia(item.media, item.index, true))}
      </div>
    );
    imageRun = [];
  };

  activePart.media.forEach((media, i) => {
    if (isMediaProcessing(media) || isMediaFailed(media)) {
      flushImageRun();
      mediaElements.push(renderMedia(media, i));
      return;
    }

    if (!disableMediaInteraction && media.mime_type.includes("image")) {
      imageRun.push({ media, index: i });
      return;
    }

    flushImageRun();
    mediaElements.push(renderMedia(media, i));
  });
  flushImageRun();

  return <div className={mediaStackClassName}>{mediaElements}</div>;
};

export default WaveDropPartContentMedias;
