import React from "react";
import { ApiDropPart } from "../../../generated/models/ApiDropPart";
import DropListItemContentMedia from "../../drops/view/item/content/media/DropListItemContentMedia";

interface WaveDropPartContentMediasProps {
  readonly activePart: ApiDropPart;
}

const WaveDropPartContentMedias: React.FC<WaveDropPartContentMediasProps> = ({
  activePart,
}) => {
  if (!activePart.media.length) {
    return null;
  }

  return (
    <div
      className={`${activePart.content ? "tw-mt-3" : "tw-mt-1"} tw-space-y-3`}
    >
      {activePart.media.map((media, i) => (
        <div key={`part-${i}-media-${media.url}`} className="tw-h-64">
          <DropListItemContentMedia
            media_mime_type={media.mime_type}
            media_url={media.url}
          />
        </div>
      ))}
    </div>
  );
};

export default WaveDropPartContentMedias;
