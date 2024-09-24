import React from 'react';
import { DropPart } from '../../../../generated/models/DropPart';
import DropListItemContentMedia from '../../../drops/view/item/content/media/DropListItemContentMedia';

interface WaveDetailedDropPartContentMediasProps {
  readonly activePart: DropPart;
  readonly updateContainerHeight: () => void;
}

const WaveDetailedDropPartContentMedias: React.FC<WaveDetailedDropPartContentMediasProps> = ({
  activePart,
  updateContainerHeight,
}) => {
  if (!activePart.media.length) {
    return null;
  }

  return (
    <div className={`${activePart.content ? "tw-mt-3" : "tw-mt-1"} tw-space-y-3`}>
      {activePart.media.map((media, i) => (
        <DropListItemContentMedia
          key={`part-${i}-media-${media.url}`}
          media_mime_type={media.mime_type}
          media_url={media.url}
          onImageLoaded={updateContainerHeight}
        />
      ))}
    </div>
  );
};

export default WaveDetailedDropPartContentMedias;