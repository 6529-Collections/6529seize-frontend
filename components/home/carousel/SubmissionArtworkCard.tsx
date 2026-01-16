"use client";

import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import { ImageScale } from "@/helpers/image.helpers";

interface SubmissionArtworkCardProps {
  readonly drop: ExtendedDrop;
  readonly isActive?: boolean;
}

export default function SubmissionArtworkCard({
  drop,
  isActive = true,
}: SubmissionArtworkCardProps) {
  const media = drop.parts[0]?.media[0];

  if (!media) {
    return null;
  }

  const mediaWrapperClasses = `tw-h-full tw-w-full ${
    isActive
      ? "tw-shadow-[0_8px_32px_rgba(255,255,255,0.08)]"
      : "tw-pointer-events-none"
  }`;

  return (
    <div className="tw-h-full tw-w-full tw-overflow-hidden tw-bg-black">
      <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-z-10 tw-rounded-lg tw-shadow-[inset_0_0_20px_rgba(0,0,0,0.3)] tw-mt-2 tw-ring-1 tw-ring-inset tw-ring-white/[0.15]" />
      <div
        className={mediaWrapperClasses}
        onClick={isActive ? (event) => event.stopPropagation() : undefined}
      >
        <DropListItemContentMedia
          media_mime_type={media.mime_type}
          media_url={media.url}
          imageObjectPosition="center"
          imageScale={ImageScale.AUTOx600}
          disableModal={!isActive}
          disableAutoPlay={!isActive}
        />
      </div>
    </div>
  );
}
