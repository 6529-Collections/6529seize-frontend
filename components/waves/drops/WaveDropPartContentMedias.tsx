import React from "react";
import { ApiDropPart } from "../../../generated/models/ApiDropPart";
import MediaDisplay from "../../drops/view/item/content/media/MediaDisplay";
import DropListItemContentMedia from "../../drops/view/item/content/media/DropListItemContentMedia";

interface WaveDropPartContentMediasProps {
  readonly activePart: ApiDropPart;
  readonly disableMediaInteraction?: boolean;
  readonly isCompetitionDrop?: boolean;
}

const WaveDropPartContentMedias: React.FC<WaveDropPartContentMediasProps> = ({
  activePart,
  disableMediaInteraction = false,
  isCompetitionDrop = false,
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
            />
          ) : (
            <DropListItemContentMedia
              media_mime_type={media.mime_type}
              media_url={media.url}
              isCompetitionDrop={isCompetitionDrop}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default WaveDropPartContentMedias;
