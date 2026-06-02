import React from "react";
import clsx from "clsx";
import type { ApiDropPart } from "@/generated/models/ApiDropPart";
import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import { getDropImageGalleryItemId } from "@/components/drops/view/part/dropImageGallery";
import { ImageScale } from "@/helpers/image.helpers";
import WaveDropPartContentMediaImage from "./WaveDropPartContentMediaImage";

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
    useIntrinsicHeightMedia,
    useCompactLink,
  }: {
    readonly groupedImage: boolean;
    readonly useIntrinsicHeightMedia: boolean;
    readonly useCompactLink: boolean;
  }) => {
    if (groupedImage) {
      return "tw-min-w-0 tw-w-full";
    }

    if (useCompactLink) {
      return "tw-w-full";
    }

    if (useIntrinsicHeightMedia) {
      return "tw-flex tw-w-full tw-min-w-[min(200px,100%)] tw-max-h-64 tw-items-center tw-justify-center";
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
    const useNaturalHeightImage =
      fullWidthMedia && media.mime_type.includes("image");
    const useImageIntrinsicHeight =
      !fullWidthMedia && media.mime_type.includes("image");
    const galleryItemId = media.mime_type.includes("image")
      ? getDropImageGalleryItemId("media", i, media.url)
      : undefined;
    const useVideoIntrinsicHeight = media.mime_type.includes("video");
    const useCompactLink = !isRenderableMedia(media.mime_type, media.url);
    const mediaContainerClassName = getMediaContainerClassName({
      groupedImage,
      useIntrinsicHeightMedia:
        useNaturalHeightImage ||
        useImageIntrinsicHeight ||
        useVideoIntrinsicHeight,
      useCompactLink,
    });
    let mediaContent;

    if (disableMediaInteraction) {
      mediaContent = (
        <MediaDisplay
          media_mime_type={media.mime_type}
          media_url={media.url}
          disableMediaInteraction={disableMediaInteraction}
          imageScale={imageScale}
        />
      );
    } else if (useNaturalHeightImage || useImageIntrinsicHeight) {
      mediaContent = (
        <WaveDropPartContentMediaImage
          src={media.url}
          imageScale={imageScale}
          imageObjectPosition={useImageIntrinsicHeight ? "left top" : "center"}
          galleryItemId={galleryItemId}
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
