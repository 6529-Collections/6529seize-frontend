"use client";

import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import { ImageScale } from "@/helpers/image.helpers";

interface SubmissionArtworkCardProps {
  readonly drop: ExtendedDrop;
  readonly onClick?: () => void;
  readonly isActive?: boolean;
}

export default function SubmissionArtworkCard({
  drop,
  onClick,
  isActive = true,
}: SubmissionArtworkCardProps) {
  const media = drop.parts[0]?.media[0];

  if (!media) {
    return null;
  }

  const mediaWrapperClasses = `tw-h-full tw-w-full tw-overflow-hidden${
    isActive ? "" : " tw-pointer-events-none"
  }`;

  return (
    <div
      onClick={onClick}
      className="tw-h-full tw-w-full tw-cursor-pointer tw-overflow-hidden tw-rounded-lg tw-bg-black tw-transition-transform tw-duration-200 tw-ease-out hover:tw-scale-[1.02]"
    >
      <div
        className={mediaWrapperClasses}
        onClick={isActive ? (event) => event.stopPropagation() : undefined}
      >
        <DropListItemContentMedia
          media_mime_type={media.mime_type}
          media_url={media.url}
          imageObjectPosition="center"
          imageScale={ImageScale.AUTOx450}
          disableModal={!isActive}
          disableAutoPlay={!isActive}
        />
      </div>
    </div>
  );
}
