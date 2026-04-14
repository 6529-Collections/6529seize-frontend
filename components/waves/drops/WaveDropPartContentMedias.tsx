import React from "react";
import clsx from "clsx";
import type { ApiDropPart } from "@/generated/models/ApiDropPart";
import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import { ImageScale } from "@/helpers/image.helpers";

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

  const mediaStackClassName = clsx(
    topSpacingClassName,
    "tw-space-y-3",
    fullWidthMedia && "-tw-mx-4"
  );

  return (
    <div className={mediaStackClassName}>
      {activePart.media.map((media, i) => {
        const useNaturalHeightImage =
          fullWidthMedia && media.mime_type.includes("image");
        const mediaContainerClassName = useNaturalHeightImage
          ? "tw-w-full"
          : clsx(
              "tw-flex tw-h-64 tw-items-center tw-justify-center",
              fullWidthMedia && "tw-w-full"
            );

        return (
          <div
            key={`part-${i}-media-${media.url}`}
            className={mediaContainerClassName}
          >
            {disableMediaInteraction ? (
              <MediaDisplay
                media_mime_type={media.mime_type}
                media_url={media.url}
                disableMediaInteraction={disableMediaInteraction}
                imageScale={imageScale}
              />
            ) : (
              <DropListItemContentMedia
                media_mime_type={media.mime_type}
                media_url={media.url}
                isCompetitionDrop={isCompetitionDrop}
                imageScale={imageScale}
                imageObjectPosition={
                  useNaturalHeightImage ? "center" : undefined
                }
                naturalHeight={useNaturalHeightImage}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default WaveDropPartContentMedias;
