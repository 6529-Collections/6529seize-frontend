"use client";

import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
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
    <div className="tw-overflow-hidden tw-rounded-xl tw-bg-iron-900 tw-transition-transform tw-duration-200 hover:tw-scale-[1.01]">
      {/* Badge */}
      <div className="tw-flex tw-items-center tw-justify-between tw-bg-iron-800/50 tw-px-3 tw-py-2">
        <span className="tw-text-xs tw-font-medium tw-text-iron-400">
          Current Top {rank}
        </span>
      </div>

      {/* Image - grayed out */}
      <div className="tw-aspect-square tw-w-full tw-overflow-hidden tw-brightness-75 tw-grayscale">
        {media ? (
          <DropListItemContentMedia
            media_mime_type={media.mime_type}
            media_url={media.url}
          />
        ) : (
          <div className="tw-flex tw-size-full tw-items-center tw-justify-center tw-bg-iron-800">
            <span className="tw-text-iron-500">No image</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="tw-p-3">
        <h3 className="tw-m-0 tw-truncate tw-text-sm tw-font-semibold tw-text-iron-200">
          {title}
        </h3>
        <div className="tw-mt-2 tw-flex tw-items-center tw-gap-2">
          <ProfileAvatar
            pfpUrl={author.pfp}
            alt={author.handle ?? "Artist"}
            size={ProfileBadgeSize.SMALL}
          />
          <span className="tw-truncate tw-text-xs tw-text-iron-500">
            {author.handle ?? "Anonymous"}
          </span>
        </div>
      </div>
    </div>
  );
};
