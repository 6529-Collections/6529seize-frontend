import React from "react";
import clsx from "clsx";
import type { ApiDropPart } from "@/generated/models/ApiDropPart";
import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import { ImageScale } from "@/helpers/image.helpers";
import WaveDropPartContentFullWidthImage from "./WaveDropPartContentFullWidthImage";

const RESPONSIVE_IMAGE_GRID_SIZES = "(max-width: 767px) 100vw, 33vw";

function isImageMedia(mimeType: string): boolean {
  return mimeType.includes("image");
}

function isRenderableMedia(mimeType: string, url: string): boolean {
  return (
    isImageMedia(mimeType) ||
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
  readonly fullWidthMedia?: boolean | undefined;
  readonly responsiveImageGrid?: boolean | undefined;
}

const WaveDropPartContentMedias: React.FC<WaveDropPartContentMediasProps> = ({
  activePart,
  disableMediaInteraction = false,
  isCompetitionDrop = false,
  imageScale = ImageScale.AUTOx450,
  fullWidthMedia = false,
  responsiveImageGrid = false,
}) => {
  if (!activePart.media.length) {
    return null;
  }

  const hasContentBeforeMedia =
    Boolean(activePart.content?.trim()) ||
    Boolean(activePart.quoted_drop?.drop_id);
  let topSpacingClassName = "tw-mt-1";

  if (hasContentBeforeMedia) {
    topSpacingClassName = "tw-mt-4";
  } else if (fullWidthMedia) {
    topSpacingClassName = "tw-mt-0";
  }

  const useResponsiveImageGrid =
    responsiveImageGrid &&
    activePart.media.length > 1 &&
    activePart.media.every((media) => isImageMedia(media.mime_type)) &&
    !fullWidthMedia &&
    !disableMediaInteraction;
  const desktopGridColumnClassName =
    activePart.media.length === 2 ? "md:tw-grid-cols-2" : "md:tw-grid-cols-3";
  const mediaStackClassName = useResponsiveImageGrid
    ? clsx(
        topSpacingClassName,
        "tw-grid tw-grid-cols-1 tw-gap-3",
        desktopGridColumnClassName
      )
    : clsx(topSpacingClassName, "tw-space-y-3");
  const getMediaContainerClassName = ({
    useNaturalHeightImage,
    useCompactLink,
    useResponsiveGridItem,
  }: {
    readonly useNaturalHeightImage: boolean;
    readonly useCompactLink: boolean;
    readonly useResponsiveGridItem: boolean;
  }) => {
    if (useNaturalHeightImage || useCompactLink) {
      return "tw-w-full";
    }

    return clsx(
      "tw-flex tw-h-64 tw-items-center tw-justify-center",
      useResponsiveGridItem && "md:tw-aspect-square md:tw-h-auto",
      fullWidthMedia && "tw-w-full"
    );
  };

  return (
    <div className={mediaStackClassName}>
      {activePart.media.map((media, i) => {
        const useNaturalHeightImage =
          fullWidthMedia && media.mime_type.includes("image");
        const useCompactLink = !isRenderableMedia(media.mime_type, media.url);
        const mediaContainerClassName = getMediaContainerClassName({
          useNaturalHeightImage,
          useCompactLink,
          useResponsiveGridItem: useResponsiveImageGrid,
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
        } else if (useNaturalHeightImage) {
          mediaContent = (
            <WaveDropPartContentFullWidthImage
              src={media.url}
              imageScale={imageScale}
            />
          );
        } else {
          mediaContent = (
            <DropListItemContentMedia
              media_mime_type={media.mime_type}
              media_url={media.url}
              isCompetitionDrop={isCompetitionDrop}
              imageScale={imageScale}
              imageSizes={
                useResponsiveImageGrid ? RESPONSIVE_IMAGE_GRID_SIZES : undefined
              }
              useResponsiveImageSrcSet={useResponsiveImageGrid}
            />
          );
        }

        return (
          <div
            key={`part-${i}-media-${media.url}`}
            className={mediaContainerClassName}
          >
            {mediaContent}
          </div>
        );
      })}
    </div>
  );
};

export default WaveDropPartContentMedias;
