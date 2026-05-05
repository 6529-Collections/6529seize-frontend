import React from "react";
import clsx from "clsx";
import type { ApiDropPart } from "@/generated/models/ApiDropPart";
import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import DropMediaActionRow from "@/components/drops/view/item/content/media/DropMediaActionRow";
import { ImageScale } from "@/helpers/image.helpers";
import WaveDropPartContentFullWidthImage from "./WaveDropPartContentFullWidthImage";

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
  readonly fullWidthMedia?: boolean | undefined;
}

const WaveDropPartContentMedias: React.FC<WaveDropPartContentMediasProps> = ({
  activePart,
  disableMediaInteraction = false,
  isCompetitionDrop = false,
  imageScale = ImageScale.AUTOx450,
  fullWidthMedia = false,
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

  const mediaStackClassName = clsx(topSpacingClassName, "tw-space-y-3");
  const getMediaContainerClassName = ({
    useIntrinsicHeightMedia,
    useCompactLink,
  }: {
    readonly useIntrinsicHeightMedia: boolean;
    readonly useCompactLink: boolean;
  }) => {
    if (useCompactLink) {
      return "tw-w-full";
    }

    if (useIntrinsicHeightMedia) {
      return "tw-flex tw-w-full tw-max-h-64 tw-items-center tw-justify-center";
    }

    return clsx(
      "tw-flex tw-h-64 tw-items-center tw-justify-center",
      fullWidthMedia && "tw-w-full"
    );
  };

  return (
    <div className={mediaStackClassName}>
      {activePart.media.map((media, i) => {
        const useNaturalHeightImage =
          fullWidthMedia && media.mime_type.includes("image");
        const useImageIntrinsicHeight =
          !fullWidthMedia && media.mime_type.includes("image");
        const useVideoIntrinsicHeight = media.mime_type.includes("video");
        const useCompactLink = !isRenderableMedia(media.mime_type, media.url);
        const showMediaActionRow =
          !disableMediaInteraction &&
          (media.mime_type.includes("image") ||
            media.mime_type.includes("video"));
        const mediaContainerClassName = getMediaContainerClassName({
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
            <WaveDropPartContentFullWidthImage
              src={media.url}
              imageScale={imageScale}
              imageObjectPosition={
                useImageIntrinsicHeight ? "left top" : "center"
              }
            />
          );
        } else {
          mediaContent = (
            <DropListItemContentMedia
              media_mime_type={media.mime_type}
              media_url={media.url}
              isCompetitionDrop={isCompetitionDrop}
              imageScale={imageScale}
            />
          );
        }

        return (
          <div key={`part-${i}-media-${media.url}`}>
            <div className={mediaContainerClassName}>{mediaContent}</div>
            {showMediaActionRow && (
              <DropMediaActionRow mimeType={media.mime_type} url={media.url} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default WaveDropPartContentMedias;
