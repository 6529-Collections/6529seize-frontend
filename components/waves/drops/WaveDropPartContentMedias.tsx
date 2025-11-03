import React from "react";
import { ApiDropPart } from "@/generated/models/ApiDropPart";
import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import { ImageScale } from "@/helpers/image.helpers";

interface WaveDropPartContentMediasProps {
  readonly activePart: ApiDropPart;
  readonly disableMediaInteraction?: boolean;
  readonly isCompetitionDrop?: boolean;
  readonly imageScale?: ImageScale;
}

const WaveDropPartContentMedias: React.FC<WaveDropPartContentMediasProps> = ({
  activePart,
  disableMediaInteraction = false,
  isCompetitionDrop = false,
  imageScale = ImageScale.AUTOx450,
}) => {
  if (!activePart.media.length) {
    return null;
  }

  return (
    <div
      className={`${activePart.content ? "tw-mt-3" : "tw-mt-1"} tw-space-y-3`}
    >
      {activePart.media.map((media, i) => (
        <div
          key={`part-${i}-media-${media.url}`}
          className="tw-flex tw-h-64"
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
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default WaveDropPartContentMedias;
