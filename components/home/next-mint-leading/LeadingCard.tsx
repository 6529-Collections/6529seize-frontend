"use client";

import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { ImageScale } from "@/helpers/image.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

interface LeadingCardProps {
  readonly drop: ExtendedDrop;
  readonly rank: number;
}

export const LeadingCard = ({ drop, rank }: LeadingCardProps) => {
  const media = drop.parts[0]?.media[0];
  const title =
    drop.title ??
    drop.metadata.find((m) => m.data_key === "title")?.data_value ??
    "Untitled";
  const author = drop.author;

  return (
    <div className="tw-group tw-flex tw-flex-col tw-gap-3 sm:tw-gap-4 tw-text-left tw-opacity-70 tw-grayscale tw-transition-all tw-duration-500 hover:tw-opacity-100 hover:tw-grayscale-0">
      <div className="tw-flex tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-[#0c0c0c] tw-transition-colors group-hover:tw-border-white/10">
        <div className="tw-flex tw-flex-col tw-items-start tw-gap-1 @sm:tw-flex-row @sm:tw-items-center @sm:tw-justify-between tw-border-b tw-border-white/5 tw-bg-[#111111] tw-px-2.5 tw-py-1.5 sm:tw-px-3 sm:tw-py-2">
          <span className="tw-text-xs tw-font-medium tw-tracking-wide tw-text-white/50">
            {rank === 1 ? "Leading" : `#${rank} in votes`}
          </span>
          <span className="tw-font-mono tw-text-xs tw-text-white/40">
            {formatNumberWithCommas(drop.rating)} TDH
          </span>
        </div>
        <div className="tw-relative tw-flex tw-aspect-[4/5] sm:tw-aspect-[3/4] tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-bg-black/50 tw-p-2 sm:tw-p-3">
          <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-transition-transform tw-duration-700 tw-ease-out group-hover:tw-scale-105 [@media(max-width:750px)]:tw-pointer-events-none">
            {media ? (
              <DropListItemContentMedia
                media_mime_type={media.mime_type}
                media_url={media.url}
                imageObjectPosition="center"
                imageScale={ImageScale.AUTOx600}
              />
            ) : (
              <div className="tw-flex tw-size-full tw-items-center tw-justify-center tw-bg-black/40">
                <span className="tw-text-sm tw-text-white/40">No image</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-3">
        <div>
          <span className="tw-m-0 tw-line-clamp-2 @lg:tw-line-clamp-1 tw-text-base tw-font-semibold tw-leading-tight tw-text-white/90 tw-transition-colors group-hover:tw-text-white">
            {title}
          </span>
          <div className="tw-mt-2 tw-flex tw-min-w-0 tw-items-center tw-gap-2">
            <ProfileAvatar
              pfpUrl={author.pfp}
              alt={author.handle ?? "Artist"}
              size={ProfileBadgeSize.SMALL}
            />
            <span className="tw-min-w-0 tw-truncate tw-text-xs tw-text-white/50">
              {author.handle ?? "Anonymous"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
