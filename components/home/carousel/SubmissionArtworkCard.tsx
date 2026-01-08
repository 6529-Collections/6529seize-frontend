"use client";

import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import { ImageScale } from "@/helpers/image.helpers";

interface SubmissionArtworkCardProps {
  readonly drop: ExtendedDrop;
  readonly onClick?: () => void;
}

export default function SubmissionArtworkCard({
  drop,
  onClick,
}: SubmissionArtworkCardProps) {
  const media = drop.parts[0]?.media[0];

  if (!media) {
    return null;
  }

  return (
    <div
      onClick={onClick}
      className="tw-cursor-pointer tw-overflow-hidden tw-rounded-xl tw-bg-iron-900 tw-transition-transform tw-duration-200 tw-ease-out hover:tw-scale-[1.02]"
    >
      <div className="tw-aspect-square tw-w-full tw-overflow-hidden">
        <DropListItemContentMedia
          media_mime_type={media.mime_type}
          media_url={media.url}
          imageScale={ImageScale.AUTOx450}
        />
      </div>
    </div>
  );
}
